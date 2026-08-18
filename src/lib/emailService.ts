/**
 * Email Service — Production (Resend)
 * Templates stay client-side for preview; sending is server-side only (POST /api/admin/requests/:id/email).
 * Only counts as SENT when Resend actually accepts the message. FAILED never marks COMPLETED.
 * No simulation — demo fallback removed in production (server returns 500 if not configured).
 */
import type { VerificationRequest } from "./requestModel";
import type { VerificationResult } from "../types/adminTypes";

export function isEmailConfigured(): boolean {
  // Client cannot know server env; admin detail page will show demo banner based on server response.
  // Keep for preview UI hint — real check is server-side (RESEND_API_KEY + EMAIL_FROM).
  // We return false so UI shows config guidance until admin successfully sends.
  try {
    const env: any = (import.meta as any).env || {};
    if (env.VITE_RESEND_API_KEY || env.VITE_FORCE_EMAIL_CONFIGURED === "1") return true;
  } catch {}
  return false; // server is source of truth; client shows guidance banner
}

export function getEmailConfigRequirements(): string[] {
  return [
    "RESEND_API_KEY — from resend.com/api-keys",
    "EMAIL_FROM — e.g. Karachi E-Challan <noreply@yourdomain.com> (must be verified in Resend)",
    "EMAIL_REPLY_TO — e.g. support@karachiechallan.pk",
    "Set all three in Vercel → Environment Variables (Production), then Redeploy",
  ];
}

export type EmailTemplateId = "CHALLAN_FOUND" | "NO_CHALLAN_FOUND" | "UNABLE_TO_VERIFY" | "MORE_INFORMATION_REQUIRED";
export interface PreparedEmail {
  to: string;
  subject: string;
  text: string;
  html: string;
  templateId: EmailTemplateId;
}

function esc(s: string) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

function challanHtmlTable(v: VerificationResult) {
  const row = (k: string, val?: string) =>
    `<tr><td style="padding:8px 12px;border:1px solid #E2E8F0;color:#5B6B85;font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;">${esc(k)}</td><td style="padding:8px 12px;border:1px solid #E2E8F0;font-size:13px;font-weight:600;color:#0C1E3A">${esc(val || "—")}</td></tr>`;
  return `<table style="width:100%;border-collapse:collapse;border-radius:12px;overflow:hidden;">
    ${row("Challan Number", v.challanNumber)}
    ${row("Violation", v.violation)}
    ${row("Date", v.challanDate || "—")}${v.challanTime ? ` <span style="color:#64748B">${esc(v.challanTime)}</span>` : ""}
    ${row("Location", v.location)}
    ${row("Fine Amount", v.fineAmount ? `Rs. ${v.fineAmount}` : "—")}
    ${row("Due Date", v.dueDate || "—")}
    ${row("Payment Status", v.paymentStatus || "—")}
    ${row("Reference / PSID", v.referencePsid || "—")}
  </table>`;
}

export function prepareVerificationEmail(request: VerificationRequest, verification: VerificationResult): PreparedEmail {
  const firstName = request.fullName.split(" ")[0] || request.fullName;
  const reqId = request.requestId;
  const vehicle = request.vehicleRegistrationNumber;
  const baseFooter = `<p style="margin:16px 0 0;color:#64748B;font-size:12px;line-height:1.6">— Karachi E-Challan Verification Team<br><a href="mailto:support@karachiechallan.pk" style="color:#0F766E;text-decoration:none">support@karachiechallan.pk</a> • This is a manual verification result.</p>`;
  const textFooter = `\n— Karachi E-Challan Verification Team\nsupport@karachiechallan.pk`;
  switch (verification.outcome) {
    case "CHALLAN_FOUND": {
      const subject = `Your E-Challan verification — ${reqId} — Challan Found`;
      const text = `Dear ${firstName},\n\nYour verification request ${reqId} for vehicle ${vehicle} has been manually reviewed.\n\nResult: CHALLAN FOUND\n\nVerified details:\n• Challan Number: ${verification.challanNumber || "—"}\n• Violation: ${verification.violation || "—"}\n• Date: ${verification.challanDate || "—"} ${verification.challanTime || ""}\n• Location: ${verification.location || "—"}\n• Fine Amount: ${verification.fineAmount ? `Rs. ${verification.fineAmount}` : "—"}\n• Due Date: ${verification.dueDate || "—"}\n• Payment Status: ${verification.paymentStatus || "—"}\n• Reference / PSID: ${verification.referencePsid || "—"}\n\n${verification.notes ? `Notes: ${verification.notes}\n\n` : ""}Please keep this email for your records.` + textFooter;
      const html = `<div style="font-family:Inter,system-ui,sans-serif;color:#0C1E3A;line-height:1.6;max-width:640px">
        <h2 style="margin:0 0 8px;font-size:18px;font-weight:800">Result: Challan Found</h2>
        <p style="margin:0;color:#4A5A78;font-size:14px">Dear ${esc(firstName)}, your verification request <span style="font-family:JetBrains Mono,monospace;font-weight:700">${esc(reqId)}</span> for <span style="font-family:JetBrains Mono,monospace;font-weight:700">${esc(vehicle)}</span> has been <strong>manually verified</strong>.</p>
        <div style="margin:16px 0">${challanHtmlTable(verification)}</div>
        ${verification.notes ? `<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:12px 14px;font-size:13px">${esc(verification.notes)}</div>` : ""}
        ${baseFooter}
      </div>`;
      return { to: request.email, subject, text, html, templateId: "CHALLAN_FOUND" };
    }
    case "NO_CHALLAN_FOUND": {
      const subject = `Your E-Challan verification — ${reqId} — No Challan Found`;
      const text = `Dear ${firstName},\n\nYour verification request ${reqId} for vehicle ${vehicle} has been manually reviewed.\n\nResult: NO CHALLAN FOUND\n\nAs of the verification time, no active challan matching your vehicle and the details you provided was found.\n\n${verification.notes ? `Notes: ${verification.notes}\n\n` : ""}New violations may appear later.` + textFooter;
      const html = `<div style="font-family:Inter,system-ui,sans-serif;color:#0C1E3A;line-height:1.6;max-width:640px">
        <h2 style="margin:0 0 8px;font-size:18px;font-weight:800;color:#0F766E">Result: No Challan Found ✓</h2>
        <p style="margin:0;color:#4A5A78;font-size:14px">Dear ${esc(firstName)}, your request <span style="font-family:JetBrains Mono,monospace;font-weight:700">${esc(reqId)}</span> for <span style="font-family:JetBrains Mono,monospace;font-weight:700">${esc(vehicle)}</span> was <strong>manually verified</strong>.</p>
        <div style="margin:14px 0;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:14px;font-size:13px">As of the verification time, <strong>no active challan</strong> was found matching your vehicle and the details you provided.</div>
        ${verification.notes ? `<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:12px 14px;font-size:13px">${esc(verification.notes)}</div>` : ""}
        ${baseFooter}</div>`;
      return { to: request.email, subject, text, html, templateId: "NO_CHALLAN_FOUND" };
    }
    case "UNABLE_TO_VERIFY": {
      const subject = `Your E-Challan verification — ${reqId} — Unable to Verify`;
      const text = `Dear ${firstName},\n\nWe attempted to verify your request ${reqId} for vehicle ${vehicle}, but verification could not be completed.\n\nReason: ${verification.notes || "Records were temporarily unavailable or information was insufficient/unclear."}\n\nWhat to do: Please submit a new request with clearer vehicle documents.` + textFooter;
      const html = `<div style="font-family:Inter,system-ui,sans-serif;color:#0C1E3A;line-height:1.6;max-width:640px">
        <h2 style="margin:0 0 8px;font-size:18px;font-weight:800;color:#B45309">Unable to Verify</h2>
        <p style="margin:0;color:#4A5A78;font-size:14px">Dear ${esc(firstName)}, we attempted to verify <span style="font-family:JetBrains Mono,monospace;font-weight:700">${esc(reqId)}</span> for <span style="font-family:JetBrains Mono,monospace;font-weight:700">${esc(vehicle)}</span> but could not complete verification.</p>
        <div style="margin:14px 0;background:#FEF3C7;border:1px solid #FDE68A;border-radius:12px;padding:14px;font-size:13px"><strong>Reason:</strong> ${esc(verification.notes || "Records unavailable or information insufficient/unclear.")}</div>
        ${baseFooter}</div>`;
      return { to: request.email, subject, text, html, templateId: "UNABLE_TO_VERIFY" };
    }
    case "MORE_INFORMATION_REQUIRED": {
      const subject = `Action required — More information for ${reqId}`;
      const text = `Dear ${firstName},\n\nTo complete verification for ${reqId} (vehicle ${vehicle}), we need more information.\n\nRequired: ${verification.notes || "Please reply with a clearer photo of your registration book/card."}\n\nPlease reply to this email with the requested details.` + textFooter;
      const html = `<div style="font-family:Inter,system-ui,sans-serif;color:#0C1E3A;line-height:1.6;max-width:640px">
        <h2 style="margin:0 0 8px;font-size:18px;font-weight:800;color:#0C4A6E">More Information Required</h2>
        <p style="margin:0;color:#4A5A78;font-size:14px">Dear ${esc(firstName)}, to complete verification for <span style="font-family:JetBrains Mono,monospace;font-weight:700">${esc(reqId)}</span> (<span style="font-family:JetBrains Mono,monospace;font-weight:700">${esc(vehicle)}</span>) we need additional information.</p>
        <div style="margin:14px 0;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:14px;font-size:13px"><strong>Required:</strong> ${esc(verification.notes || "Please reply with a clearer photo of your registration book/card.")}</div>
        ${baseFooter}</div>`;
      return { to: request.email, subject, text, html, templateId: "MORE_INFORMATION_REQUIRED" };
    }
  }
}

// Production: sending is server-side only via /api/admin/requests/:id/email with HttpOnly auth
// This client helper now calls the real endpoint (no simulation).
export interface SendResult { ok: boolean; messageId?: string; error?: string }
export async function sendVerificationEmail(prepared: PreparedEmail, requestId: string): Promise<SendResult> {
  try {
    const res = await fetch(`/api/admin/requests/${encodeURIComponent(requestId)}/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ subject: prepared.subject, text: prepared.text, html: prepared.html, templateId: prepared.templateId }),
    });
    const json = await res.json().catch(() => null);
    if (res.ok && json?.success) return { ok: true, messageId: json.data?.messageId || undefined };
    return { ok: false, error: json?.error?.message || `Email service returned ${res.status}` };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Network error sending email" };
  }
}
