/**
 * POST /api/send-email — LEGACY generic endpoint (deprecated)
 * New code should use POST /api/admin/requests/:id/email (authenticated, Resend, COMPLETED logic).
 * This endpoint is kept for backwards compatibility but now also requires real Resend config.
 * No demo simulation — only succeeds when RESEND_API_KEY + EMAIL_FROM are configured and Resend accepts the message.
 */

export default async function handler(req: any, res: any) {
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
