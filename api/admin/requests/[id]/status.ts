import { connectDB, isDBConfigured } from "../../../lib/db";
import { requireAdmin } from "../../../lib/auth";
import VerificationRequest from "../../../models/VerificationRequest";

const VALID_TRANSITIONS: Record<string, string[]> = {
  NEW: ["IN_REVIEW"],
  IN_REVIEW: ["CHALLAN_FOUND","NO_CHALLAN_FOUND","UNABLE_TO_VERIFY","MORE_INFORMATION_REQUIRED"],
  CHALLAN_FOUND: ["COMPLETED"],
  NO_CHALLAN_FOUND: ["COMPLETED"],
  UNABLE_TO_VERIFY: ["COMPLETED"],
  MORE_INFORMATION_REQUIRED: ["COMPLETED", "IN_REVIEW"],
};

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Token");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, error: { message: "Method not allowed" } });
  const admin = requireAdmin(req, res);
  if (!admin) return;
  if (!isDBConfigured()) return res.status(503).json({ success: false, error: { message: "Database not configured — set MONGODB_URI" } });
  const id = req.query.id as string;
  let body: any = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const toStatus = String(body.status || body.to || "").trim();
  if (!toStatus) return res.status(400).json({ success: false, error: { message: "Missing status" } });
  try {
    await connectDB();
    const doc: any = await VerificationRequest.findOne({ requestId: id });
    if (!doc) return res.status(404).json({ success: false, error: { message: "Request not found" } });
    const allowed = VALID_TRANSITIONS[doc.status] || [];
    // Allow COMPLETED from any result state; also allow IN_REVIEW re-open
    const isCompleting = toStatus === "COMPLETED";
    const isValid = allowed.includes(toStatus) || (isCompleting && ["CHALLAN_FOUND","NO_CHALLAN_FOUND","UNABLE_TO_VERIFY","MORE_INFORMATION_REQUIRED"].includes(doc.status));
    if (!isValid && doc.status !== toStatus) {
      // For now enforce strictly but allow admin override via direct save if needed — return error
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
