/**
 * Email Service — Production (SMTP via Nodemailer)
 * Templates stay client-side for preview; sending is server-side only (POST /api/admin/requests/:id/email),
 * via the centralized SMTP utility in api/lib/mail.ts.
 * Only counts as SENT when the SMTP server actually accepts the message. FAILED never marks COMPLETED.
 * No simulation — demo fallback removed in production (server returns 500 if not configured).
 */
import type { VerificationRequest } from "./requestModel";
import type { VerificationResult } from "../types/adminTypes";
import { getService, getRequestField, resultLabel } from "./services";

export function isEmailConfigured(): boolean {
  // Client cannot know server env; admin detail page will show demo banner based on server response.
  // Keep for preview UI hint — real check is server-side (SMTP_HOST/PORT/USER/PASSWORD/FROM).
  // We return false so UI shows config guidance until admin successfully sends.
  try {
    const env: any = (import.meta as any).env || {};
    if (env.VITE_FORCE_EMAIL_CONFIGURED === "1") return true;
  } catch {}
  return false; // server is source of truth; client shows guidance banner
}

export function getEmailConfigRequirements(): string[] {
  return [
    "SMTP_HOST — e.g. smtp.yourprovider.com",
    "SMTP_PORT — e.g. 587 (STARTTLS) or 465 (implicit TLS)",
    "SMTP_USER — SMTP account username",
    "SMTP_PASSWORD — SMTP account password",
    "SMTP_FROM — e.g. noreply@karachiechallan.pk",
    "SMTP_FROM_NAME — e.g. Karachi E-Challan (optional, defaults to this)",
    "Set all in your environment variables, then redeploy",
  ];
}

/** The saved result value (CHALLAN_FOUND, PAID, ACCEPTED, …) doubles as the template id. */
export type EmailTemplateId = string;
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
  const challanNo = getRequestField(request, "challanNumber");
  const vehicle = request.vehicleRegistrationNumber || challanNo || "—";
  // Requests from the Check Challan form have no vehicle — refer to the challan number instead.
  const refPhrase = request.vehicleRegistrationNumber ? `vehicle ${request.vehicleRegistrationNumber}` : `challan ${challanNo || "reference"}`;
  const baseFooter = `<p style="margin:16px 0 0;color:#64748B;font-size:12px;line-height:1.6">— Karachi E-Challan Verification Team<br><a href="mailto:support@karachiechallan.pk" style="color:#0F766E;text-decoration:none">support@karachiechallan.pk</a></p>`;
  const textFooter = `\n— Karachi E-Challan Verification Team\nsupport@karachiechallan.pk`;
  switch (verification.outcome) {
    case "CHALLAN_FOUND": {
      const subject = `Your E-Challan verification — ${reqId} — Challan Found`;
      const text = `Dear ${firstName},\n\nYour verification request ${reqId} for ${refPhrase} has been reviewed.\n\nResult: CHALLAN FOUND\n\nVerified details:\n• Challan Number: ${verification.challanNumber || "—"}\n• Violation: ${verification.violation || "—"}\n• Date: ${verification.challanDate || "—"} ${verification.challanTime || ""}\n• Location: ${verification.location || "—"}\n• Fine Amount: ${verification.fineAmount ? `Rs. ${verification.fineAmount}` : "—"}\n• Due Date: ${verification.dueDate || "—"}\n• Payment Status: ${verification.paymentStatus || "—"}\n• Reference / PSID: ${verification.referencePsid || "—"}\n\n${verification.notes ? `Notes: ${verification.notes}\n\n` : ""}Please keep this email for your records.` + textFooter;
      const html = `<div style="font-family:Inter,system-ui,sans-serif;color:#0C1E3A;line-height:1.6;max-width:640px">
        <h2 style="margin:0 0 8px;font-size:18px;font-weight:800">Result: Challan Found</h2>
        <p style="margin:0;color:#4A5A78;font-size:14px">Dear ${esc(firstName)}, your verification request <span style="font-family:JetBrains Mono,monospace;font-weight:700">${esc(reqId)}</span> for <span style="font-family:JetBrains Mono,monospace;font-weight:700">${esc(vehicle)}</span> has been <strong>verified</strong>.</p>
        <div style="margin:16px 0">${challanHtmlTable(verification)}</div>
        ${verification.notes ? `<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:12px 14px;font-size:13px">${esc(verification.notes)}</div>` : ""}
        ${baseFooter}
      </div>`;
      return { to: request.email, subject, text, html, templateId: "CHALLAN_FOUND" };
    }
    case "NO_CHALLAN_FOUND": {
      const subject = `Your E-Challan verification — ${reqId} — No Challan Found`;
      const text = `Dear ${firstName},\n\nYour verification request ${reqId} for ${refPhrase} has been reviewed.\n\nResult: NO CHALLAN FOUND\n\nAs of the verification time, no active challan matching your vehicle and the details you provided was found.\n\n${verification.notes ? `Notes: ${verification.notes}\n\n` : ""}New violations may appear later.` + textFooter;
      const html = `<div style="font-family:Inter,system-ui,sans-serif;color:#0C1E3A;line-height:1.6;max-width:640px">
        <h2 style="margin:0 0 8px;font-size:18px;font-weight:800;color:#0F766E">Result: No Challan Found ✓</h2>
        <p style="margin:0;color:#4A5A78;font-size:14px">Dear ${esc(firstName)}, your request <span style="font-family:JetBrains Mono,monospace;font-weight:700">${esc(reqId)}</span> for <span style="font-family:JetBrains Mono,monospace;font-weight:700">${esc(vehicle)}</span> was <strong>verified</strong>.</p>
        <div style="margin:14px 0;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:14px;font-size:13px">As of the verification time, <strong>no active challan</strong> was found matching your vehicle and the details you provided.</div>
        ${verification.notes ? `<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:12px 14px;font-size:13px">${esc(verification.notes)}</div>` : ""}
        ${baseFooter}</div>`;
      return { to: request.email, subject, text, html, templateId: "NO_CHALLAN_FOUND" };
    }
    case "UNABLE_TO_VERIFY": {
      const subject = `Your E-Challan verification — ${reqId} — Unable to Verify`;
      const text = `Dear ${firstName},\n\nWe attempted to verify your request ${reqId} for ${refPhrase}, but verification could not be completed.\n\nReason: ${verification.notes || "Records were temporarily unavailable or information was insufficient/unclear."}\n\nWhat to do: Please submit a new request with clearer vehicle documents.` + textFooter;
      const html = `<div style="font-family:Inter,system-ui,sans-serif;color:#0C1E3A;line-height:1.6;max-width:640px">
        <h2 style="margin:0 0 8px;font-size:18px;font-weight:800;color:#B45309">Unable to Verify</h2>
        <p style="margin:0;color:#4A5A78;font-size:14px">Dear ${esc(firstName)}, we attempted to verify <span style="font-family:JetBrains Mono,monospace;font-weight:700">${esc(reqId)}</span> for <span style="font-family:JetBrains Mono,monospace;font-weight:700">${esc(vehicle)}</span> but could not complete verification.</p>
        <div style="margin:14px 0;background:#FEF3C7;border:1px solid #FDE68A;border-radius:12px;padding:14px;font-size:13px"><strong>Reason:</strong> ${esc(verification.notes || "Records unavailable or information insufficient/unclear.")}</div>
        ${baseFooter}</div>`;
      return { to: request.email, subject, text, html, templateId: "UNABLE_TO_VERIFY" };
    }
    case "MORE_INFORMATION_REQUIRED": {
      const subject = `Action required — More information for ${reqId}`;
      const text = `Dear ${firstName},\n\nTo complete verification for ${reqId} (${refPhrase}), we need more information.\n\nRequired: ${verification.notes || "Please reply with a clearer photo of your registration book/card."}\n\nPlease reply to this email with the requested details.` + textFooter;
      const html = `<div style="font-family:Inter,system-ui,sans-serif;color:#0C1E3A;line-height:1.6;max-width:640px">
        <h2 style="margin:0 0 8px;font-size:18px;font-weight:800;color:#0C4A6E">More Information Required</h2>
        <p style="margin:0;color:#4A5A78;font-size:14px">Dear ${esc(firstName)}, to complete verification for <span style="font-family:JetBrains Mono,monospace;font-weight:700">${esc(reqId)}</span> (<span style="font-family:JetBrains Mono,monospace;font-weight:700">${esc(vehicle)}</span>) we need additional information.</p>
        <div style="margin:14px 0;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:14px;font-size:13px"><strong>Required:</strong> ${esc(verification.notes || "Please reply with a clearer photo of your registration book/card.")}</div>
        ${baseFooter}</div>`;
      return { to: request.email, subject, text, html, templateId: "MORE_INFORMATION_REQUIRED" };
    }
    default:
      return prepareServiceEmail(request, verification);
  }
}

// ─── Other services: Challan Status, Complaint Status, Blacklist / Block ───

type Tone = { color: string; bg: string; border: string };
const TONES: Record<string, Tone> = {
  good: { color: "#0F766E", bg: "#F0FDF4", border: "#BBF7D0" },
  bad: { color: "#B91C1C", bg: "#FEF2F2", border: "#FECACA" },
  warn: { color: "#B45309", bg: "#FEF3C7", border: "#FDE68A" },
  neutral: { color: "#0C1E3A", bg: "#F8FAFC", border: "#E2E8F0" },
};
const RESULT_TONE: Record<string, string> = {
  PAID: "good", ACCEPTED: "good", NOT_BLACKLISTED: "good",
  UNPAID: "bad", REJECTED: "bad", BLACKLISTED: "bad", BLOCKED: "bad",
  STILL_PENDING: "warn", UNABLE_TO_VERIFY: "warn", MORE_INFORMATION_REQUIRED: "warn",
};

/** One plain sentence per result. Add a line here when a new result value is introduced. */
const RESULT_SENTENCE: Record<string, string> = {
  PAID: "Our team checked this challan and it is recorded as paid.",
  UNPAID: "Our team checked this challan and it is recorded as unpaid. Please use the official payment channels to settle it.",
  WAIVED: "Our team checked this challan and it is recorded as waived.",
  STILL_PENDING: "Our team checked your complaint and it is still pending.",
  REJECTED: "Our team checked your complaint and it has been rejected.",
  ACCEPTED: "Our team checked your complaint and it has been accepted.",
  NOT_BLACKLISTED: "Our team checked this vehicle and found no blacklist or block record.",
  BLACKLISTED: "Our team checked this vehicle and it is recorded as blacklisted.",
  BLOCKED: "Our team checked this vehicle and it is recorded as blocked.",
  UNABLE_TO_VERIFY: "We tried to check this request but could not complete the verification.",
  MORE_INFORMATION_REQUIRED: "To complete your request we need some more information from you.",
};

const SUBJECT_PREFIX: Record<string, string> = {
  CHALLAN_STATUS: "Your challan status result",
  COMPLAINT_STATUS: "Your complaint status update",
  BLACKLIST_BLOCK: "Your blacklist / block check",
  CHECK_CHALLAN: "Your E-Challan verification",
};

export function prepareServiceEmail(request: VerificationRequest, verification: VerificationResult): PreparedEmail {
  const service = getService(request.requestType);
  const firstName = request.fullName.split(" ")[0] || request.fullName;
  const reqId = request.requestId;
  const label = resultLabel(verification.outcome);
  const tone = TONES[RESULT_TONE[verification.outcome] || "neutral"];

  // Only the reference details relevant to this service — never CNIC or phone.
  const refs: Array<[string, string]> = [];
  const challanNo = getRequestField(request, "challanNumber");
  const complaintNo = getRequestField(request, "complaintNumber");
  const vehicleNo = getRequestField(request, "vehicleNumber");
  if (service.type === "CHALLAN_STATUS" && challanNo) refs.push(["Challan Number", challanNo]);
  if (service.type === "COMPLAINT_STATUS") { if (challanNo) refs.push(["Challan Number", challanNo]); if (complaintNo) refs.push(["Complaint Number", complaintNo]); }
  if (service.type === "BLACKLIST_BLOCK" && vehicleNo) refs.push(["Vehicle Number", vehicleNo]);

  const sentence = RESULT_SENTENCE[verification.outcome] || `Our team has reviewed your request. Result: ${label}.`;
  const needsAction = verification.outcome === "MORE_INFORMATION_REQUIRED";
  const subject = needsAction
    ? `Action required — More information for ${reqId}`
    : `${SUBJECT_PREFIX[service.type] || "Your request"} — ${reqId} — ${label}`;

  const notesLabel = needsAction ? "Required" : verification.outcome === "UNABLE_TO_VERIFY" ? "Reason" : "Notes";
  const text =
    `Dear ${firstName},\n\nYour ${service.emailSubject} ${reqId} has been reviewed.\n\n` +
    `Result: ${label.toUpperCase()}\n` +
    (refs.length ? `\n${refs.map(([k, v]) => `• ${k}: ${v}`).join("\n")}\n` : "") +
    `\n${sentence}\n` +
    (verification.notes ? `\n${notesLabel}: ${verification.notes}\n` : "") +
    (needsAction ? `\nPlease reply to this email with the requested details.\n` : "") +
    `\n— Karachi E-Challan Verification Team\nsupport@karachiechallan.pk`;

  const rows = refs.map(([k, v]) =>
    `<tr><td style="padding:8px 12px;border:1px solid #E2E8F0;color:#5B6B85;font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;">${esc(k)}</td><td style="padding:8px 12px;border:1px solid #E2E8F0;font-size:13px;font-weight:600;color:#0C1E3A;font-family:JetBrains Mono,monospace">${esc(v)}</td></tr>`).join("");
  const html = `<div style="font-family:Inter,system-ui,sans-serif;color:#0C1E3A;line-height:1.6;max-width:640px">
    <h2 style="margin:0 0 8px;font-size:18px;font-weight:800;color:${tone.color}">Result: ${esc(label)}</h2>
    <p style="margin:0;color:#4A5A78;font-size:14px">Dear ${esc(firstName)}, your ${esc(service.emailSubject)} <span style="font-family:JetBrains Mono,monospace;font-weight:700">${esc(reqId)}</span> has been <strong>reviewed</strong>.</p>
    ${rows ? `<div style="margin:16px 0"><table style="width:100%;border-collapse:collapse">${rows}</table></div>` : ""}
    <div style="margin:14px 0;background:${tone.bg};border:1px solid ${tone.border};border-radius:12px;padding:14px;font-size:13px">${esc(sentence)}</div>
    ${verification.notes ? `<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:12px 14px;font-size:13px"><strong>${notesLabel}:</strong> ${esc(verification.notes)}</div>` : ""}
    <p style="margin:16px 0 0;color:#64748B;font-size:12px;line-height:1.6">— Karachi E-Challan Verification Team<br><a href="mailto:support@karachiechallan.pk" style="color:#0F766E;text-decoration:none">support@karachiechallan.pk</a></p>
  </div>`;
  return { to: request.email, subject, text, html, templateId: verification.outcome };
}

/** Result email for any request type — picks the right template. */
export function prepareResultEmail(request: VerificationRequest, verification: VerificationResult): PreparedEmail {
  return (request.requestType || "CHECK_CHALLAN") === "CHECK_CHALLAN"
    ? prepareVerificationEmail(request, verification)
    : prepareServiceEmail(request, verification);
}

/** Draft shown before a result is saved (sending stays disabled until then). */
export function prepareHoldingDraft(request: VerificationRequest): { subject: string; text: string } {
  const service = getService(request.requestType);
  const firstName = request.fullName.split(" ")[0] || request.fullName;
  return {
    subject: `Update on your ${service.title} request — ${request.requestId}`,
    text: `Dear ${firstName},\n\nWe are reviewing your ${service.emailSubject} ${request.requestId}.\nOur team is checking the relevant records and will email the result within 24 hours.\n\n— Karachi E-Challan Verification Team\nsupport@karachiechallan.pk`,
  };
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
