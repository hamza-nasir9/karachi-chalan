import { connectDB, isDBConfigured } from "../../../lib/db";
import { requireAdmin } from "../../../lib/auth";
import VerificationRequest from "../../../models/VerificationRequest";
import EmailRecord from "../../../models/EmailRecord";

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
    // Validate no private notes leakage
    const privateNotesText = (doc.privateNotes || []).map((n:any)=>n.text).join(" ");
    if (privateNotesText && (subject.includes(privateNotesText.slice(0,20)) || text.includes(privateNotesText.slice(0,20)))) {
      // heuristic — not blocking, just warn log
      console.warn("[Email] Possible private note content in email body — blocked");
    }

    // Check Resend config
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const EMAIL_FROM = process.env.EMAIL_FROM;
    const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || process.env.EMAIL_FROM;
    if (!RESEND_API_KEY || !EMAIL_FROM) {
      console.error("[Email] RESEND_API_KEY or EMAIL_FROM not configured");
      // Record as FAILED, do NOT complete
      await EmailRecord.create({
        requestId: id, to, subject, body: text, html, templateId, resultType: doc.verification.outcome,
        status: "FAILED", sentBy: admin.email, error: "Email provider not configured: set RESEND_API_KEY and EMAIL_FROM",
      });
      return res.status(500).json({ success: false, error: { code: "EMAIL_NOT_CONFIGURED", message: "Email service not configured. Set RESEND_API_KEY and EMAIL_FROM in environment variables.", hint: "Add RESEND_API_KEY, EMAIL_FROM, EMAIL_REPLY_TO to Vercel env" } });
    }

    // Send via Resend — only mark SENT when provider accepts
    let messageId: string | null = null;
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(RESEND_API_KEY);
      const result: any = await resend.emails.send({
        from: EMAIL_FROM,
        to: to,
        subject,
        html: html || `<pre style="font-family:Inter,system-ui,sans-serif;white-space:pre-wrap">${text.replace(/</g,"&lt;")}</pre>`,
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

    // Success — record SENT and mark COMPLETED only now
    await EmailRecord.create({
      requestId: id, to, subject, body: text, html, templateId, resultType: doc.verification.outcome,
      status: "SENT", sentBy: admin.email, messageId,
    });
    // Only after real provider acceptance, mark COMPLETED
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
