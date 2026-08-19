/**
 * api/index.ts — SINGLE serverless function (Vercel Hobby: 12-function limit workaround)
 *
 * Sab API routes is ek file mein combine kar diye gaye hain, path-based routing ke saath.
 * lib/ aur models/ files unchanged hain — sirf yahan se .js extension ke saath import ho rahi hain.
 *
 * Routes handled:
 *   POST /api/requests
 *   POST /api/send-email
 *   POST /api/admin/login
 *   POST /api/admin/logout
 *   GET  /api/admin/me
 *   GET  /api/admin/requests
 *   GET  /api/admin/stats
 *   GET  /api/admin/requests/:id
 *   POST /api/admin/requests/:id/status
 *   GET|POST /api/admin/requests/:id/notes
 *   POST /api/admin/requests/:id/verification
 *   POST /api/admin/requests/:id/email
 */

import { connectDB, isDBConfigured } from "./lib/db.js";
import { validatePublicInput } from "./lib/validation.js";
import { rateLimit, getClientIp } from "./lib/rateLimit.js";
import { signToken, setAuthCookie, clearAuthCookie, hashPassword, comparePassword, getAuthUser, requireAdmin } from "./lib/auth.js";
import { nextRequestId } from "./lib/counter.js";
import VerificationRequest from "./models/VerificationRequest.js";
import AdminUser from "./models/AdminUser.js";
import EmailRecord from "./models/EmailRecord.js";

/* ------------------------------------------------------------------ */
/* Route handlers — logic copied as-is from the original files        */
/* ------------------------------------------------------------------ */

// ===== POST /api/requests (public submission) =====
const memStore: any[] = [];
let memCounter = 1244;
function memNextId() {
  const year = new Date().getFullYear();
  memCounter += 1;
  return `ECV-${year}-${String(memCounter).padStart(6, "0")}`;
}

async function handlePublicRequests(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Token");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed." } });
  }

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

  if (db) {
    try {
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

      let requestId = await nextRequestId();
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
      if (e.code === 11000) {
        return res.status(409).json({ success: false, error: { code: "DUPLICATE", message: "Duplicate request detected. Please try again." } });
      }
      return res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "We couldn't save your request. Please try again." } });
    }
  } else {
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

// ===== POST /api/send-email (legacy) =====
async function handleSendEmail(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Token");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, error: { message: "Method not allowed" } });

  let body: any = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {} as any; } }

  if (!body?.to || !body?.subject) {
    return res.status(400).json({ success: false, error: { message: "Missing to / subject" } });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.to)) {
    return res.status(400).json({ success: false, error: { message: "Invalid recipient email" } });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const EMAIL_FROM = process.env.EMAIL_FROM;
  const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || EMAIL_FROM;

  if (!RESEND_API_KEY || !EMAIL_FROM) {
    return res.status(500).json({
      success: false,
      error: {
        code: "EMAIL_NOT_CONFIGURED",
        message: "Email provider not configured. Set RESEND_API_KEY and EMAIL_FROM in environment variables.",
        hint: "Add RESEND_API_KEY, EMAIL_FROM, EMAIL_REPLY_TO in Vercel Environment Variables and redeploy",
      },
    });
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(RESEND_API_KEY);
    const result: any = await resend.emails.send({
      from: EMAIL_FROM,
      to: body.to,
      subject: body.subject,
      html: body.html || `<pre style="font-family:Inter,system-ui,sans-serif;white-space:pre-wrap">${String(body.text || "").replace(/</g, "&lt;")}</pre>`,
      text: body.text || undefined,
      replyTo: EMAIL_REPLY_TO || undefined,
    });
    if (result.error) throw new Error(result.error.message || JSON.stringify(result.error));
    return res.status(200).json({
      success: true,
      messageId: result.data?.id || result.id || null,
      message: "Email sent via Resend",
    });
  } catch (e: any) {
    console.error("[send-email] Resend error", e);
    return res.status(502).json({ success: false, error: { code: "EMAIL_FAILED", message: e.message || "Resend failed", retryable: true } });
  }
}

// ===== POST /api/admin/login =====
const DEFAULT_ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin@karachiechallan.pk").toLowerCase();
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123";
const DEFAULT_ADMIN_NAME = process.env.ADMIN_NAME || "Verification Admin";

async function ensureDefaultAdmin() {
  if (!isDBConfigured()) return;
  try {
    await connectDB();
    const exists = await AdminUser.findOne({ email: DEFAULT_ADMIN_EMAIL });
    if (!exists) {
      const hash = await hashPassword(DEFAULT_ADMIN_PASSWORD);
      await AdminUser.create({ email: DEFAULT_ADMIN_EMAIL, passwordHash: hash, name: DEFAULT_ADMIN_NAME });
      console.log(`[Admin] Seeded default admin ${DEFAULT_ADMIN_EMAIL}`);
    }
  } catch (e) {
    console.error("[Admin] ensureDefaultAdmin failed", e);
  }
}

async function handleAdminLogin(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, error: { message: "Method not allowed" } });

  const ip = getClientIp(req);
  const rl = rateLimit(`admin_login:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.allowed) {
    res.setHeader("Retry-After", String(Math.ceil(rl.retryAfterMs / 1000)));
    return res.status(429).json({ success: false, error: { code: "RATE_LIMITED", message: "Too many login attempts. Please try again in a few minutes." } });
  }

  let body: any = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!email || !password) return res.status(400).json({ success: false, error: { message: "Email and password are required." } });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ success: false, error: { message: "Enter a valid email." } });

  if (!isDBConfigured()) {
    console.warn("[Admin Login] No DB — using demo credential check");
    if (email === DEFAULT_ADMIN_EMAIL && password === DEFAULT_ADMIN_PASSWORD) {
      const token = signToken({ email: DEFAULT_ADMIN_EMAIL, id: "demo" });
      setAuthCookie(res, token);
      return res.status(200).json({ success: true, data: { email: DEFAULT_ADMIN_EMAIL, name: DEFAULT_ADMIN_NAME } });
    }
    return res.status(401).json({ success: false, error: { message: "Invalid email or password." } });
  }

  try {
    await connectDB();
    await ensureDefaultAdmin();
    const user: any = await AdminUser.findOne({ email });
    if (!user) return res.status(401).json({ success: false, error: { message: "Invalid email or password." } });
    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) return res.status(401).json({ success: false, error: { message: "Invalid email or password." } });
    const token = signToken({ email: user.email, id: String(user._id) });
    setAuthCookie(res, token);
    return res.status(200).json({ success: true, data: { email: user.email, name: user.name } });
  } catch (e: any) {
    console.error("[Admin Login] error", e);
    return res.status(500).json({ success: false, error: { message: "Internal error. Please try again." } });
  }
}

// ===== POST /api/admin/logout =====
async function handleAdminLogout(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, error: { message: "Method not allowed" } });
  clearAuthCookie(res);
  return res.status(200).json({ success: true, data: { message: "Logged out" } });
}

// ===== GET /api/admin/me =====
async function handleAdminMe(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Token");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ success: false, error: { message: "Method not allowed" } });
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ success: false, error: { message: "Not authenticated" } });
  if (!isDBConfigured()) {
    return res.status(200).json({ success: true, data: { email: user.email, name: "Verification Admin" } });
  }
  try {
    await connectDB();
    const dbUser: any = await AdminUser.findOne({ email: user.email });
    if (!dbUser) return res.status(401).json({ success: false, error: { message: "User not found" } });
    return res.status(200).json({ success: true, data: { email: dbUser.email, name: dbUser.name } });
  } catch (e: any) {
    console.error("[Admin Me] error", e);
    return res.status(500).json({ success: false, error: { message: "Internal error" } });
  }
}

// ===== GET /api/admin/requests (list) =====
async function handleAdminRequestsList(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Token");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ success: false, error: { message: "Method not allowed" } });
  const admin = requireAdmin(req, res);
  if (!admin) return;
  if (!isDBConfigured()) {
    return res.status(200).json({ success: true, data: { items: [], total: 0, page: 1, pageSize: 10 } });
  }
  try {
    await connectDB();
    const { search = "", status = "ALL", page = "1", pageSize = "10", sort = "newest" } = req.query || {};
    const p = Math.max(1, parseInt(String(page), 10) || 1);
    const ps = Math.max(5, Math.min(50, parseInt(String(pageSize), 10) || 10));
    const filter: any = {};
    if (status && status !== "ALL") filter.status = String(status);
    if (search && String(search).trim()) {
      const q = String(search).trim();
      const digits = q.replace(/\D/g, "");
      const or: any[] = [
        { requestId: { $regex: q, $options: "i" } },
        { fullName: { $regex: q, $options: "i" } },
        { vehicleRegistrationNumber: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
      if (digits) {
        or.push({ mobile: { $regex: digits, $options: "i" } });
        or.push({ cnic: { $regex: digits, $options: "i" } });
      }
      filter.$or = or;
    }
    const sortDir = sort === "oldest" ? 1 : -1;
    const total = await VerificationRequest.countDocuments(filter);
    const items = await VerificationRequest.find(filter)
      .sort({ createdAt: sortDir })
      .skip((p - 1) * ps)
      .limit(ps)
      .lean();
    return res.status(200).json({ success: true, data: { items, total, page: p, pageSize: ps } });
  } catch (e: any) {
    console.error("[Admin Requests] error", e);
    return res.status(500).json({ success: false, error: { message: "Failed to load requests" } });
  }
}

// ===== GET /api/admin/stats =====
async function handleAdminStats(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Token");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ success: false, error: { message: "Method not allowed" } });
  const admin = requireAdmin(req, res);
  if (!admin) return;
  if (!isDBConfigured()) {
    return res.status(200).json({ success: true, data: { total: 0, new: 0, inReview: 0, completed: 0, challanFound: 0, noChallanFound: 0, note: "DB not configured — in-memory stats not available via API" } });
  }
  try {
    await connectDB();
    const [total, neu, inReview, completed, challanFound, noChallanFound] = await Promise.all([
      VerificationRequest.countDocuments({}),
      VerificationRequest.countDocuments({ status: "NEW" }),
      VerificationRequest.countDocuments({ status: "IN_REVIEW" }),
      VerificationRequest.countDocuments({ status: "COMPLETED" }),
      VerificationRequest.countDocuments({ status: "CHALLAN_FOUND" }),
      VerificationRequest.countDocuments({ status: "NO_CHALLAN_FOUND" }),
    ]);
    return res.status(200).json({ success: true, data: { total, new: neu, inReview, completed, challanFound, noChallanFound } });
  } catch (e: any) {
    console.error("[Admin Stats] error", e);
    return res.status(500).json({ success: false, error: { message: "Failed to load stats" } });
  }
}

// ===== GET /api/admin/requests/:id (detail) =====
async function handleAdminRequestDetail(req: any, res: any, id: string) {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Token");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ success: false, error: { message: "Method not allowed" } });
  const admin = requireAdmin(req, res);
  if (!admin) return;
  if (!id || typeof id !== "string") return res.status(400).json({ success: false, error: { message: "Missing id" } });
  if (!isDBConfigured()) {
    return res.status(503).json({ success: false, error: { message: "Database not configured" } });
  }
  try {
    await connectDB();
    const reqDoc: any = await VerificationRequest.findOne({ requestId: id }).lean();
    if (!reqDoc) return res.status(404).json({ success: false, error: { message: "Request not found" } });
    const emails = await EmailRecord.find({ requestId: id }).sort({ createdAt: -1 }).limit(50).lean();
    return res.status(200).json({
      success: true,
      data: {
        request: reqDoc,
        enrichment: {
          verification: reqDoc.verification || null,
          internalNotes: reqDoc.privateNotes || [],
          completedAt: reqDoc.completedAt || null,
        },
        emails: emails.map((e: any) => ({
          id: String(e._id),
          requestId: e.requestId,
          to: e.to,
          subject: e.subject,
          body: e.body,
          html: e.html || null,
          templateId: e.templateId || null,
          resultType: e.resultType || e.templateId || null,
          status: e.status,
          sentAt: e.createdAt || e.sentAt,
          sentBy: e.sentBy,
          messageId: e.messageId || null,
          demoMode: false,
        })),
      },
    });
  } catch (e: any) {
    console.error("[Admin Request Detail] error", e);
    return res.status(500).json({ success: false, error: { message: "Failed to load request" } });
  }
}

// ===== POST /api/admin/requests/:id/status =====
const VALID_TRANSITIONS: Record<string, string[]> = {
  NEW: ["IN_REVIEW"],
  IN_REVIEW: ["CHALLAN_FOUND", "NO_CHALLAN_FOUND", "UNABLE_TO_VERIFY", "MORE_INFORMATION_REQUIRED"],
  CHALLAN_FOUND: ["COMPLETED"],
  NO_CHALLAN_FOUND: ["COMPLETED"],
  UNABLE_TO_VERIFY: ["COMPLETED"],
  MORE_INFORMATION_REQUIRED: ["COMPLETED", "IN_REVIEW"],
};

async function handleAdminStatus(req: any, res: any, id: string) {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Token");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, error: { message: "Method not allowed" } });
  const admin = requireAdmin(req, res);
  if (!admin) return;
  if (!isDBConfigured()) return res.status(503).json({ success: false, error: { message: "Database not configured — set MONGODB_URI" } });
  let body: any = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const toStatus = String(body.status || body.to || "").trim();
  if (!toStatus) return res.status(400).json({ success: false, error: { message: "Missing status" } });
  try {
    await connectDB();
    const doc: any = await VerificationRequest.findOne({ requestId: id });
    if (!doc) return res.status(404).json({ success: false, error: { message: "Request not found" } });
    const allowed = VALID_TRANSITIONS[doc.status] || [];
    const isCompleting = toStatus === "COMPLETED";
    const isValid = allowed.includes(toStatus) || (isCompleting && ["CHALLAN_FOUND", "NO_CHALLAN_FOUND", "UNABLE_TO_VERIFY", "MORE_INFORMATION_REQUIRED"].includes(doc.status));
    if (!isValid && doc.status !== toStatus) {
      return res.status(400).json({ success: false, error: { message: `Invalid transition ${doc.status} → ${toStatus}. Allowed: ${(allowed).join(", ") || "none"}` } });
    }
    const from = doc.status;
    doc.status = toStatus;
    doc.statusHistory.push({ from, to: toStatus, changedAt: new Date(), changedBy: admin.email });
    if (toStatus === "COMPLETED") doc.completedAt = new Date();
    await doc.save();
    return res.status(200).json({ success: true, data: { requestId: doc.requestId, status: doc.status, updatedAt: doc.updatedAt, completedAt: doc.completedAt } });
  } catch (e: any) {
    console.error("[Admin Status] error", e);
    return res.status(500).json({ success: false, error: { message: "Failed to update status" } });
  }
}

// ===== GET|POST /api/admin/requests/:id/notes =====
async function handleAdminNotes(req: any, res: any, id: string) {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Token");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") return res.status(200).end();
  const admin = requireAdmin(req, res);
  if (!admin) return;
  if (!isDBConfigured()) return res.status(503).json({ success: false, error: { message: "Database not configured" } });
  await connectDB();
  if (req.method === "GET") {
    try {
      const doc: any = await VerificationRequest.findOne({ requestId: id }).lean();
      if (!doc) return res.status(404).json({ success: false, error: { message: "Not found" } });
      return res.status(200).json({ success: true, data: { notes: doc.privateNotes || [] } });
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ success: false, error: { message: "Failed to load notes" } });
    }
  }
  if (req.method !== "POST") return res.status(405).json({ success: false, error: { message: "Method not allowed" } });
  let body: any = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const text = String(body.text || "").trim();
  if (!text) return res.status(400).json({ success: false, error: { message: "Note text is required" } });
  if (text.length > 2000) return res.status(400).json({ success: false, error: { message: "Note too long (max 2000)" } });
  const clean = text.replace(/[<>]/g, "");
  try {
    let adminName = admin.email;
    try {
      const u: any = await AdminUser.findOne({ email: admin.email }).lean();
      if (u?.name) adminName = u.name;
    } catch {}
    const doc: any = await VerificationRequest.findOne({ requestId: id });
    if (!doc) return res.status(404).json({ success: false, error: { message: "Request not found" } });
    const note = {
      id: `NOTE-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      text: clean,
      adminName,
      adminEmail: admin.email,
      createdAt: new Date(),
    };
    doc.privateNotes.unshift(note as any);
    if (doc.privateNotes.length > 200) doc.privateNotes.length = 200;
    await doc.save();
    return res.status(201).json({ success: true, data: { note } });
  } catch (e: any) {
    console.error("[Admin Notes] error", e);
    return res.status(500).json({ success: false, error: { message: "Failed to add note" } });
  }
}

// ===== POST /api/admin/requests/:id/verification =====
function sanitize(v: any, max: number): string | undefined {
  if (v == null || v === "") return undefined;
  let s = String(v).trim().replace(/[<>]/g, "").slice(0, max);
  return s || undefined;
}

async function handleAdminVerification(req: any, res: any, id: string) {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Token");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, error: { message: "Method not allowed" } });
  const admin = requireAdmin(req, res);
  if (!admin) return;
  if (!isDBConfigured()) return res.status(503).json({ success: false, error: { message: "Database not configured" } });
  let body: any = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const outcome = String(body.outcome || "").trim();
  const validOutcomes = ["CHALLAN_FOUND", "NO_CHALLAN_FOUND", "UNABLE_TO_VERIFY", "MORE_INFORMATION_REQUIRED"];
  if (!validOutcomes.includes(outcome)) {
    return res.status(400).json({ success: false, error: { message: "Invalid outcome. Choose: " + validOutcomes.join(", ") } });
  }
  if (outcome === "CHALLAN_FOUND") {
    const challanNumber = String(body.challanNumber || "").trim();
    if (!challanNumber || challanNumber.length < 4) return res.status(400).json({ success: false, error: { message: "Challan Number is required for Challan Found (≥4 chars)." } });
    if (challanNumber.length > 40) return res.status(400).json({ success: false, error: { message: "Challan Number too long." } });
    const fine = String(body.fineAmount || "").trim();
    if (fine && isNaN(Number(fine.replace(/[,Rs.\s]/g, "")))) return res.status(400).json({ success: false, error: { message: "Fine Amount must be a number." } });
  } else {
    const notes = String(body.notes || "").trim();
    if (!notes) {
      const msg = outcome === "MORE_INFORMATION_REQUIRED" ? "Describe what information is required." : outcome === "UNABLE_TO_VERIFY" ? "Provide the reason you were unable to verify." : "Add notes / explanation.";
      return res.status(400).json({ success: false, error: { message: msg } });
    }
    if (notes.length < 10) return res.status(400).json({ success: false, error: { message: "Provide a more detailed explanation (≥10 characters)." } });
    if (notes.length > 2000) return res.status(400).json({ success: false, error: { message: "Notes too long (max 2000)." } });
  }

  try {
    await connectDB();
    const doc: any = await VerificationRequest.findOne({ requestId: id });
    if (!doc) return res.status(404).json({ success: false, error: { message: "Request not found" } });
    const verification: any = {
      outcome,
      challanNumber: sanitize(body.challanNumber, 40),
      violation: sanitize(body.violation, 120),
      challanDate: sanitize(body.challanDate, 20),
      challanTime: sanitize(body.challanTime, 10),
      location: sanitize(body.location, 120),
      fineAmount: sanitize(body.fineAmount, 20),
      dueDate: sanitize(body.dueDate, 20),
      paymentStatus: sanitize(body.paymentStatus, 20),
      referencePsid: sanitize(body.referencePsid, 60),
      notes: sanitize(body.notes, 2000),
      updatedAt: new Date(),
      updatedBy: admin.email,
    };
    const from = doc.status;
    doc.verification = verification;
    doc.status = outcome as any;
    doc.statusHistory.push({ from, to: outcome, changedAt: new Date(), changedBy: admin.email });
    await doc.save();
    return res.status(200).json({
      success: true,
      data: { requestId: doc.requestId, status: doc.status, verification: doc.verification, updatedAt: doc.updatedAt },
    });
  } catch (e: any) {
    console.error("[Admin Verification] error", e);
    return res.status(500).json({ success: false, error: { message: "Failed to save verification result" } });
  }
}

// ===== POST /api/admin/requests/:id/email =====
async function handleAdminEmail(req: any, res: any, id: string) {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Token");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, error: { message: "Method not allowed" } });
  const admin = requireAdmin(req, res);
  if (!admin) return;
  if (!isDBConfigured()) return res.status(503).json({ success: false, error: { message: "Database not configured — set MONGODB_URI" } });
  let body: any = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const subject = String(body.subject || "").trim();
  const text = String(body.text || body.body || "").trim();
  const html = body.html ? String(body.html) : null;
  const templateId = body.templateId ? String(body.templateId) : null;
  if (!subject || !text) return res.status(400).json({ success: false, error: { message: "Subject and message are required" } });
  if (subject.length > 200) return res.status(400).json({ success: false, error: { message: "Subject too long (max 200)" } });
  if (text.length > 10000) return res.status(400).json({ success: false, error: { message: "Message too long (max 10000)" } });

  try {
    await connectDB();
    const doc: any = await VerificationRequest.findOne({ requestId: id });
    if (!doc) return res.status(404).json({ success: false, error: { message: "Request not found" } });
    if (!doc.verification) return res.status(400).json({ success: false, error: { message: "Save a verification result before sending email" } });

    const to = doc.email;
    const privateNotesText = (doc.privateNotes || []).map((n: any) => n.text).join(" ");
    if (privateNotesText && (subject.includes(privateNotesText.slice(0, 20)) || text.includes(privateNotesText.slice(0, 20)))) {
      console.warn("[Email] Possible private note content in email body — blocked");
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const EMAIL_FROM = process.env.EMAIL_FROM;
    const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || process.env.EMAIL_FROM;
    if (!RESEND_API_KEY || !EMAIL_FROM) {
      console.error("[Email] RESEND_API_KEY or EMAIL_FROM not configured");
      await EmailRecord.create({
        requestId: id, to, subject, body: text, html, templateId, resultType: doc.verification.outcome,
        status: "FAILED", sentBy: admin.email, error: "Email provider not configured: set RESEND_API_KEY and EMAIL_FROM",
      });
      return res.status(500).json({ success: false, error: { code: "EMAIL_NOT_CONFIGURED", message: "Email service not configured. Set RESEND_API_KEY and EMAIL_FROM in environment variables.", hint: "Add RESEND_API_KEY, EMAIL_FROM, EMAIL_REPLY_TO to Vercel env" } });
    }

    let messageId: string | null = null;
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(RESEND_API_KEY);
      const result: any = await resend.emails.send({
        from: EMAIL_FROM,
        to: to,
        subject,
        html: html || `<pre style="font-family:Inter,system-ui,sans-serif;white-space:pre-wrap">${text.replace(/</g, "&lt;")}</pre>`,
        text,
        replyTo: EMAIL_REPLY_TO || undefined,
      });
      if (result.error) {
        throw new Error(result.error.message || JSON.stringify(result.error));
      }
      messageId = result.data?.id || result.id || null;
    } catch (e: any) {
      const errMsg = e?.message || "Resend error";
      console.error("[Email] Resend failed", e);
      await EmailRecord.create({
        requestId: id, to, subject, body: text, html, templateId, resultType: doc.verification.outcome,
        status: "FAILED", sentBy: admin.email, error: errMsg.slice(0, 500),
      });
      return res.status(502).json({ success: false, error: { code: "EMAIL_FAILED", message: `Email failed to send: ${errMsg.slice(0, 200)}`, retryable: true } });
    }

    await EmailRecord.create({
      requestId: id, to, subject, body: text, html, templateId, resultType: doc.verification.outcome,
      status: "SENT", sentBy: admin.email, messageId,
    });
    if (doc.status !== "COMPLETED") {
      const from = doc.status;
      doc.status = "COMPLETED";
      doc.completedAt = new Date();
      doc.statusHistory.push({ from, to: "COMPLETED", changedAt: new Date(), changedBy: admin.email });
      await doc.save();
    }
    return res.status(200).json({ success: true, data: { messageId, status: "SENT", requestStatus: "COMPLETED" } });
  } catch (e: any) {
    console.error("[Admin Email] error", e);
    return res.status(500).json({ success: false, error: { message: "Failed to send email" } });
  }
}

/* ------------------------------------------------------------------ */
/* Router                                                              */
/* ------------------------------------------------------------------ */

// Order matters only in that more path-segments must come before fewer
// where prefixes could otherwise collide — regex anchors avoid that here.
const ROUTES: Array<{ pattern: RegExp; handler: (req: any, res: any, id?: string) => any }> = [
  { pattern: /^\/api\/requests\/?$/, handler: handlePublicRequests },
  { pattern: /^\/api\/send-email\/?$/, handler: handleSendEmail },
  { pattern: /^\/api\/admin\/login\/?$/, handler: handleAdminLogin },
  { pattern: /^\/api\/admin\/logout\/?$/, handler: handleAdminLogout },
  { pattern: /^\/api\/admin\/me\/?$/, handler: handleAdminMe },
  { pattern: /^\/api\/admin\/stats\/?$/, handler: handleAdminStats },
  { pattern: /^\/api\/admin\/requests\/?$/, handler: handleAdminRequestsList },
  { pattern: /^\/api\/admin\/requests\/([^/]+)\/status\/?$/, handler: (req, res, id) => handleAdminStatus(req, res, id!) },
  { pattern: /^\/api\/admin\/requests\/([^/]+)\/notes\/?$/, handler: (req, res, id) => handleAdminNotes(req, res, id!) },
  { pattern: /^\/api\/admin\/requests\/([^/]+)\/verification\/?$/, handler: (req, res, id) => handleAdminVerification(req, res, id!) },
  { pattern: /^\/api\/admin\/requests\/([^/]+)\/email\/?$/, handler: (req, res, id) => handleAdminEmail(req, res, id!) },
  { pattern: /^\/api\/admin\/requests\/([^/]+)\/?$/, handler: (req, res, id) => handleAdminRequestDetail(req, res, id!) },
];

export default async function handler(req: any, res: any) {
  const rawUrl: string = req.url || "/";
  const pathname = rawUrl.split("?")[0];

  for (const route of ROUTES) {
    const match = pathname.match(route.pattern);
    if (match) {
      const id = match[1] ? decodeURIComponent(match[1]) : undefined;
      return route.handler(req, res, id);
    }
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Token");
  if (req.method === "OPTIONS") return res.status(200).end();
  return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: `No route for ${req.method} ${pathname}` } });
}
