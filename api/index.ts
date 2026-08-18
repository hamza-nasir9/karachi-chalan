// api/index.ts - MASTER FILE (FIXED - Sab errors resolve)
import { connectDB, isDBConfigured } from "./lib/db.js";
import { validatePublicInput } from "./lib/validation.js";
import { rateLimit, getClientIp } from "./lib/rateLimit.js";
import VerificationRequest from "./models/VerificationRequest.js";
import { nextRequestId } from "./lib/counter.js";
import { authenticateAdmin, generateToken, verifyToken } from "./lib/auth.js";
import AdminUser from "./models/AdminUser.js";
import EmailRecord from "./models/EmailRecord.js";

// ============================================
// MEMORY STORE (Fallback)
// ============================================
const memStore: any[] = [];
let memCounter = 1244;
function memNextId() {
  const year = new Date().getFullYear();
  memCounter += 1;
  return `ECV-${year}-${String(memCounter).padStart(6, "0")}`;
}

// ============================================
// MAIN HANDLER - Sab routes yahan
// ============================================
export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Token");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") return res.status(200).end();

  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const path = url.pathname.replace(/^\/api/, '');

  // ==========================================
  // PUBLIC ROUTES
  // ==========================================
  
  // POST /api/requests - Public submission
  if (path === '/requests' && req.method === 'POST') {
    return handlePublicRequest(req, res);
  }

  // POST /api/send-email - Send email
  if (path === '/send-email' && req.method === 'POST') {
    return handleSendEmail(req, res);
  }

  // ==========================================
  // ADMIN AUTH ROUTES
  // ==========================================
  
  // POST /api/admin/login
  if (path === '/admin/login' && req.method === 'POST') {
    return handleAdminLogin(req, res);
  }

  // POST /api/admin/logout
  if (path === '/admin/logout' && req.method === 'POST') {
    return handleAdminLogout(req, res);
  }

  // GET /api/admin/me
  if (path === '/admin/me' && req.method === 'GET') {
    return handleAdminMe(req, res);
  }

  // ==========================================
  // ADMIN REQUESTS ROUTES
  // ==========================================
  
  // GET /api/admin/requests
  if (path === '/admin/requests' && req.method === 'GET') {
    return handleAdminRequests(req, res);
  }

  // GET /api/admin/stats
  if (path === '/admin/stats' && req.method === 'GET') {
    return handleAdminStats(req, res);
  }

  // ==========================================
  // ADMIN SINGLE REQUEST ROUTES
  // ==========================================
  
  // GET /api/admin/requests/:id
  const singleRequestMatch = path.match(/^\/admin\/requests\/([^\/]+)$/);
  if (singleRequestMatch && req.method === 'GET') {
    return handleSingleRequest(req, res, singleRequestMatch[1]);
  }

  // PUT /api/admin/requests/:id/status
  const statusMatch = path.match(/^\/admin\/requests\/([^\/]+)\/status$/);
  if (statusMatch && req.method === 'PUT') {
    return handleUpdateStatus(req, res, statusMatch[1]);
  }

  // PUT /api/admin/requests/:id/verification
  const verificationMatch = path.match(/^\/admin\/requests\/([^\/]+)\/verification$/);
  if (verificationMatch && req.method === 'PUT') {
    return handleVerification(req, res, verificationMatch[1]);
  }

  // POST /api/admin/requests/:id/notes
  const notesMatch = path.match(/^\/admin\/requests\/([^\/]+)\/notes$/);
  if (notesMatch && req.method === 'POST') {
    return handleAddNotes(req, res, notesMatch[1]);
  }

  // POST /api/admin/requests/:id/email
  const emailMatch = path.match(/^\/admin\/requests\/([^\/]+)\/email$/);
  if (emailMatch && req.method === 'POST') {
    return handleSendEmailToUser(req, res, emailMatch[1]);
  }

  // 404 - Route not found
  return res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: "API endpoint not found" }
  });
}

// ============================================
// HANDLER: Public Request Submission
// ============================================
async function handlePublicRequest(req: any, res: any) {
  // Rate limiting
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
      console.error("[API] DB connect failed", e);
      return res.status(503).json({
        success: false,
        error: { code: "DB_UNAVAILABLE", message: "Database temporarily unavailable. Please try again." },
      });
    }
  }

  if (db) {
    try {
      // Duplicate check
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
        ...cleaned,
        verification: null,
        privateNotes: [],
        statusHistory: [{ from: "NONE", to: "NEW", changedAt: new Date(), changedBy: "system" }],
      });

      return res.status(201).json({
        success: true,
        data: { requestId: doc.requestId, status: doc.status, createdAt: doc.createdAt },
      });
    } catch (e: any) {
      console.error("[API] DB error", e);
      if (e.code === 11000) {
        return res.status(409).json({ success: false, error: { code: "DUPLICATE", message: "Duplicate request detected." } });
      }
      return res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Could not save request." } });
    }
  } else {
    // In-memory fallback
    console.warn("[API] Using in-memory fallback");
    const now = Date.now();
    const dup = memStore.find((r: any) => {
      const eligible = ["NEW", "IN_REVIEW", "MORE_INFORMATION_REQUIRED"].includes(r.status);
      const within24h = now - new Date(r.createdAt).getTime() < 24 * 60 * 60 * 1000;
      return r.vehicleRegistrationNumber === cleaned.vehicleRegistrationNumber &&
             r.email === cleaned.email &&
             r.cnic === cleaned.cnic &&
             eligible && within24h;
    });
    if (dup) {
      return res.status(200).json({
        success: true,
        data: { requestId: dup.requestId, status: dup.status, createdAt: dup.createdAt, duplicate: true },
      });
    }
    let requestId = memNextId();
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

// ============================================
// HANDLER: Send Email
// ============================================
async function handleSendEmail(req: any, res: any) {
  try {
    const { to, subject, html } = req.body;
    // Resend API integration
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@karachiechallan.pk',
      to: [to],
      subject: subject,
      html: html,
      replyTo: process.env.EMAIL_REPLY_TO || 'support@karachiechallan.pk',
    });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    // Save email record if DB available
    const db = await connectDB().catch(() => null);
    if (db) {
      await EmailRecord.create({
        to,
        subject,
        type: 'manual',
        sentAt: new Date(),
        messageId: data?.id,
      });
    }

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// ============================================
// HANDLER: Admin Login
// ============================================
async function handleAdminLogin(req: any, res: any) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: { code: "MISSING_FIELDS", message: "Email and password required" } });
    }

    await connectDB();
    const admin = await AdminUser.findOne({ email });
    if (!admin) {
      return res.status(401).json({ success: false, error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials" } });
    }

    const isValid = await admin.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ success: false, error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials" } });
    }

    const token = generateToken({ id: admin._id, email: admin.email, role: admin.role });
    return res.status(200).json({
      success: true,
      data: { token, admin: { id: admin._id, email: admin.email, name: admin.name, role: admin.role } }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// ============================================
// HANDLER: Admin Logout
// ============================================
async function handleAdminLogout(req: any, res: any) {
  return res.status(200).json({ success: true, message: "Logged out successfully" });
}

// ============================================
// HANDLER: Admin Me
// ============================================
async function handleAdminMe(req: any, res: any) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "No token provided" } });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Invalid token" } });
    }

    await connectDB();
    const admin = await AdminUser.findById(decoded.id).select('-password');
    if (!admin) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Admin not found" } });
    }

    return res.status(200).json({ success: true, data: admin });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// ============================================
// HANDLER: Admin Requests List
// ============================================
async function handleAdminRequests(req: any, res: any) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
    }

    await connectDB();
    const { status, search, page = 1, limit = 20 } = req.query;
    const query: any = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { requestId: { $regex: search, $options: 'i' } },
        { vehicleRegistrationNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { cnic: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [requests, total] = await Promise.all([
      VerificationRequest.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      VerificationRequest.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: { requests, total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// ============================================
// HANDLER: Admin Stats
// ============================================
async function handleAdminStats(req: any, res: any) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
    }

    await connectDB();
    const [total, newCount, inReview, completed, rejected] = await Promise.all([
      VerificationRequest.countDocuments(),
      VerificationRequest.countDocuments({ status: "NEW" }),
      VerificationRequest.countDocuments({ status: "IN_REVIEW" }),
      VerificationRequest.countDocuments({ status: "VERIFIED" }),
      VerificationRequest.countDocuments({ status: "REJECTED" }),
    ]);

    return res.status(200).json({
      success: true,
      data: { total, new: newCount, inReview, completed, rejected }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// ============================================
// HANDLER: Single Request
// ============================================
async function handleSingleRequest(req: any, res: any, id: string) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
    }

    await connectDB();
    const request = await VerificationRequest.findOne({ requestId: id }).lean();
    if (!request) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Request not found" } });
    }

    return res.status(200).json({ success: true, data: request });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// ============================================
// HANDLER: Update Status
// ============================================
async function handleUpdateStatus(req: any, res: any, id: string) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
    }

    const { status, note } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, error: { code: "MISSING_FIELD", message: "Status required" } });
    }

    await connectDB();
    const request = await VerificationRequest.findOne({ requestId: id });
    if (!request) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Request not found" } });
    }

    const oldStatus = request.status;
    request.status = status;
    request.statusHistory.push({
      from: oldStatus,
      to: status,
      changedAt: new Date(),
      changedBy: 'system',
      note: note || '',
    });
    await request.save();

    return res.status(200).json({ success: true, data: request });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// ============================================
// HANDLER: Verification
// ============================================
async function handleVerification(req: any, res: any, id: string) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
    }

    const { verified, notes } = req.body;
    await connectDB();
    const request = await VerificationRequest.findOne({ requestId: id });
    if (!request) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Request not found" } });
    }

    request.verification = {
      verified: verified || false,
      verifiedAt: new Date(),
      verifiedBy: 'system',
      notes: notes || '',
    };
    request.status = verified ? "VERIFIED" : "REJECTED";
    request.statusHistory.push({
      from: request.status,
      to: verified ? "VERIFIED" : "REJECTED",
      changedAt: new Date(),
      changedBy: 'system',
      note: notes || '',
    });
    await request.save();

    return res.status(200).json({ success: true, data: request });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// ============================================
// HANDLER: Add Notes
// ============================================
async function handleAddNotes(req: any, res: any, id: string) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
    }

    const { note } = req.body;
    if (!note) {
      return res.status(400).json({ success: false, error: { code: "MISSING_FIELD", message: "Note required" } });
    }

    await connectDB();
    const request = await VerificationRequest.findOne({ requestId: id });
    if (!request) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Request not found" } });
    }

    request.privateNotes.push({
      note,
      addedAt: new Date(),
      addedBy: 'system',
    });
    await request.save();

    return res.status(200).json({ success: true, data: request });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// ============================================
// HANDLER: Send Email to User
// ============================================
async function handleSendEmailToUser(req: any, res: any, id: string) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
    }

    const { subject, message } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ success: false, error: { code: "MISSING_FIELDS", message: "Subject and message required" } });
    }

    await connectDB();
    const request = await VerificationRequest.findOne({ requestId: id });
    if (!request) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Request not found" } });
    }

    // Send email using Resend
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const html = `
      <h2>Request #${request.requestId}</h2>
      <p><strong>Status:</strong> ${request.status}</p>
      <p><strong>Vehicle:</strong> ${request.vehicleRegistrationNumber}</p>
      <hr/>
      <p>${message}</p>
    `;

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@karachiechallan.pk',
      to: [request.email],
      subject: subject,
      html: html,
      replyTo: process.env.EMAIL_REPLY_TO || 'support@karachiechallan.pk',
    });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    await EmailRecord.create({
      to: request.email,
      subject,
      type: 'admin_manual',
      sentAt: new Date(),
      messageId: data?.id,
    });

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}