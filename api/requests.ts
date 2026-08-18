import { connectDB, isDBConfigured } from "./lib/db.js";  // ← .js add kiya
import { validatePublicInput } from "./lib/validation.js";  // ← .js add kiya
import { rateLimit, getClientIp } from "./lib/rateLimit.js";  // ← .js add kiya
import VerificationRequest from "./models/VerificationRequest.js";  // ← .js add kiya
import { nextRequestId } from "./lib/counter.js";  // ← .js add kiya

// In-memory fallback when MONGO not configured (preview)
const memStore: any[] = [];
let memCounter = 1244;
function memNextId() {
  const year = new Date().getFullYear();
  memCounter += 1;
  return `ECV-${year}-${String(memCounter).padStart(6, "0")}`;
}

export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Token");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed." } });
  }

  // Rate limiting: 5 submissions per 15 minutes per IP
  const ip = getClientIp(req);
  const rl = rateLimit(`public_submit:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.allowed) {
    res.setHeader("Retry-After", String(Math.ceil(rl.retryAfterMs / 1000)));
    return res.status(429).json({
      success: false,
      error: { code: "RATE_LIMITED", message: "Too many requests. Please try again in a few minutes." },
    });
  }

  let body: any = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  if (!body || typeof body !== "object") body = {};

  const validation = validatePublicInput(body);
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Please correct the highlighted fields.", fields: validation.errors },
    });
  }
  const cleaned = validation.cleaned;

  // Try MongoDB
  const dbConfigured = isDBConfigured();
  let db: any = null;
  if (dbConfigured) {
    try { db = await connectDB(); } catch (e) {
      console.error("[API /requests] DB connect failed", e);
      return res.status(503).json({
        success: false,
        error: { code: "DB_UNAVAILABLE", message: "Database temporarily unavailable. Please try again." },
      });
    }
  }

  // Use MongoDB if available, otherwise in-memory fallback (for preview without env)
  if (db) {
    try {
      // Duplicate check: same vehicle + email + cnic within 24h and still active
      const dup = await VerificationRequest.findOne({
        vehicleRegistrationNumber: cleaned.vehicleRegistrationNumber,
        email: cleaned.email,
        cnic: cleaned.cnic,
        status: { $in: ["NEW", "IN_REVIEW", "MORE_INFORMATION_REQUIRED"] },
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      }).sort({ createdAt: -1 }).lean();

      if (dup) {
        return res.status(200).json({
          success: true,
          data: {
            requestId: dup.requestId,
            status: dup.status,
            createdAt: dup.createdAt,
            duplicate: true,
            existingRequestId: dup.requestId,
          },
        });
      }

      // Generate unique ID with counter (atomic)
      let requestId = await nextRequestId();
      // Ensure uniqueness (race safe due to unique index, but retry once)
      let tries = 0;
      while (tries < 3) {
        const exists = await VerificationRequest.findOne({ requestId }).lean();
        if (!exists) break;
        requestId = await nextRequestId();
        tries++;
      }

      const doc = await VerificationRequest.create({
        requestId,
        status: "NEW",
        vehicleRegistrationNumber: cleaned.vehicleRegistrationNumber,
        vehicleType: cleaned.vehicleType,
        vehicleMake: cleaned.vehicleMake,
        vehicleColor: cleaned.vehicleColor,
        fullName: cleaned.fullName,
        cnic: cleaned.cnic,
        mobile: cleaned.mobile,
        email: cleaned.email,
        violationDate: cleaned.violationDate,
        violationTime: cleaned.violationTime,
        area: cleaned.area,
        challanRef: cleaned.challanRef,
        notes: cleaned.notes,
        verification: null,
        privateNotes: [],
        statusHistory: [{ from: "NONE", to: "NEW", changedAt: new Date(), changedBy: "system" }],
      });

      console.log(`[API] Created ${doc.requestId} NEW for ${doc.vehicleRegistrationNumber}`);

      return res.status(201).json({
        success: true,
        data: { requestId: doc.requestId, status: doc.status, createdAt: doc.createdAt },
      });
    } catch (e: any) {
      console.error("[API /requests] DB error", e);
      // Duplicate key edge
      if (e.code === 11000) {
        return res.status(409).json({ success: false, error: { code: "DUPLICATE", message: "Duplicate request detected. Please try again." } });
      }
      return res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "We couldn't save your request. Please try again." } });
    }
  } else {
    // In-memory fallback (warning: not persistent across lambdas)
    console.warn("[API /requests] Using in-memory fallback — set MONGODB_URI for persistence");
    const now = Date.now();
    const dup = memStore.find((r: any) => {
      const eligible = ["NEW", "IN_REVIEW", "MORE_INFORMATION_REQUIRED"].includes(r.status);
      const within24h = now - new Date(r.createdAt).getTime() < 24 * 60 * 60 * 1000;
      return (
        r.vehicleRegistrationNumber === cleaned.vehicleRegistrationNumber &&
        r.email === cleaned.email &&
        r.cnic === cleaned.cnic &&
        eligible && within24h
      );
    });
    if (dup) {
      return res.status(200).json({
        success: true,
        data: { requestId: dup.requestId, status: dup.status, createdAt: dup.createdAt, duplicate: true, existingRequestId: dup.requestId },
      });
    }
    let requestId = memNextId();
    let tries = 0;
    while (memStore.some((r: any) => r.requestId === requestId) && tries < 5) {
      requestId = memNextId(); tries++;
    }
    const nowIso = new Date().toISOString();
    const record = {
      requestId,
      status: "NEW",
      ...cleaned,
      verification: null,
      privateNotes: [],
      statusHistory: [{ from: "NONE", to: "NEW", changedAt: new Date(), changedBy: "system" }],
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    memStore.unshift(record);
    if (memStore.length > 500) memStore.length = 500;
    return res.status(201).json({ success: true, data: { requestId, status: "NEW", createdAt: nowIso } });
  }
}