import { connectDB, isDBConfigured } from "../../lib/db";
import { requireAdmin } from "../../lib/auth";
import VerificationRequest from "../../models/VerificationRequest";
import EmailRecord from "../../models/EmailRecord";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Token");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ success: false, error: { message: "Method not allowed" } });
  const admin = requireAdmin(req, res);
  if (!admin) return;
  const { id } = req.query;
  if (!id || typeof id !== "string") return res.status(400).json({ success: false, error: { message: "Missing id" } });
  if (!isDBConfigured()) {
    return res.status(503).json({ success: false, error: { message: "Database not configured" } });
  }
  try {
    await connectDB();
    const reqDoc: any = await VerificationRequest.findOne({ requestId: id }).lean();
    if (!reqDoc) return res.status(404).json({ success: false, error: { message: "Request not found" } });
    const emails = await EmailRecord.find({ requestId: id }).sort({ createdAt: -1 }).limit(50).lean();
    // Normalize for client AdminDetail expectations: requestDoc + emails mapped
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
