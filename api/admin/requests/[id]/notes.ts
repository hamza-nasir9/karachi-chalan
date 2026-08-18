import { connectDB, isDBConfigured } from "../../../lib/db";
import { requireAdmin } from "../../../lib/auth";
import VerificationRequest from "../../../models/VerificationRequest";
import AdminUser from "../../../models/AdminUser";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Token");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") return res.status(200).end();
  const admin = requireAdmin(req, res);
  if (!admin) return;
  if (!isDBConfigured()) return res.status(503).json({ success: false, error: { message: "Database not configured" } });
  const id = req.query.id as string;
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
  // sanitize: strip <> already, keep simple
  const clean = text.replace(/[<>]/g, "");
  try {
    // get admin name
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
