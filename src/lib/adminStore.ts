/**
 * Admin Store — Production
 * All data now comes from real API (MongoDB) — this file is a thin typed wrapper.
 * Legacy localStorage logic removed. Private notes & emails are server-persisted.
 * Kept for client-side types and helpers only.
 */
import type { RequestStatusType, VerificationRequest } from "./requestModel";
import type { VerificationResult, InternalNote, EmailRecord } from "../types/adminTypes";

// Re-export types for consumers
export type { VerificationResult, InternalNote, EmailRecord };
export interface Enrichment {
  internalNotes: InternalNote[];
  verification?: VerificationResult | null;
  completedAt?: string | null;
}
export interface Stats {
  total: number; new: number; inReview: number; completed: number; challanFound: number; noChallanFound: number;
}

// ---- API wrappers ----

async function apiFetch(path: string, opts: RequestInit = {}): Promise<any> {
  const res = await fetch(path, { ...opts, credentials: "include" });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    const msg = json?.error?.message || `Request failed (${res.status})`;
    const err: any = new Error(msg);
    err.fields = json?.error?.fields;
    err.code = json?.error?.code;
    err.status = res.status;
    throw err;
  }
  return json.data;
}

export async function fetchStats(): Promise<Stats> {
  return apiFetch("/api/admin/stats");
}

export async function fetchRequests(opts: { search?: string; status?: RequestStatusType | "ALL"; page?: number; pageSize?: number; sort?: "newest" | "oldest" }): Promise<{ items: VerificationRequest[]; total: number; page: number; pageSize: number }> {
  const params = new URLSearchParams();
  if (opts.search) params.set("search", opts.search);
  if (opts.status) params.set("status", opts.status);
  if (opts.page) params.set("page", String(opts.page));
  if (opts.pageSize) params.set("pageSize", String(opts.pageSize));
  if (opts.sort) params.set("sort", opts.sort);
  const data = await apiFetch(`/api/admin/requests?${params.toString()}`);
  return data;
}

// Legacy sync helper kept for dashboard initial load fallback — now async
export function getStats(): Stats {
  // Deprecated sync version — use fetchStats()
  return { total: 0, new: 0, inReview: 0, completed: 0, challanFound: 0, noChallanFound: 0 };
}
export function listRequestsFiltered(_opts: any): { items: VerificationRequest[]; total: number } {
  // Deprecated sync — use fetchRequests()
  return { items: [], total: 0 };
}
export function getRequestAdmin(_requestId: string): VerificationRequest | undefined { return undefined; }
export function getEnrichment(_requestId: string): Enrichment { return { internalNotes: [], verification: null, completedAt: null }; }
export function getEmailHistory(_requestId: string): EmailRecord[] { return []; }

// New async versions
export async function fetchRequestDetail(requestId: string): Promise<{ request: VerificationRequest; enrichment: Enrichment; emails: EmailRecord[] }> {
  const data = await apiFetch(`/api/admin/requests/${encodeURIComponent(requestId)}`);
  return data;
}

export async function apiMarkInReview(requestId: string): Promise<any> {
  return apiFetch(`/api/admin/requests/${encodeURIComponent(requestId)}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "IN_REVIEW" }),
  });
}

export async function apiAddInternalNote(requestId: string, text: string): Promise<InternalNote> {
  const data = await apiFetch(`/api/admin/requests/${encodeURIComponent(requestId)}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  return data.note;
}

export async function apiSaveVerificationResult(requestId: string, payload: any): Promise<any> {
  return apiFetch(`/api/admin/requests/${encodeURIComponent(requestId)}/verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function apiSendEmail(requestId: string, subject: string, text: string, html: string | null, templateId: string | null): Promise<any> {
  return apiFetch(`/api/admin/requests/${encodeURIComponent(requestId)}/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subject, text, html, templateId }),
  });
}

// Compatibility shims — no-ops in production (server handles these)
export function markInReview() { throw new Error("Use apiMarkInReview — local mutation disabled"); }
export function addInternalNote() { throw new Error("Use apiAddInternalNote"); }
export function saveVerificationResult() { throw new Error("Use apiSaveVerificationResult"); }
export function recordEmail() { throw new Error("Use apiSendEmail — SMTP sending is server-side only"); }
export function completeRequest() { throw new Error("Server marks COMPLETED on successful SMTP send"); }
export function updateRequestStatus() { throw new Error("Use apiMarkInReview / apiSaveVerificationResult"); }
export function getAllEmails(): EmailRecord[] { return []; }

// Build email draft helper (kept client-side for preview, no DB needed)
export function buildEmailDraft(request: VerificationRequest, verification: any): { subject: string; body: string } {
  const name = (request.fullName || "").split(" ")[0] || request.fullName;
  const reqId = request.requestId;
  const vehicle = request.vehicleRegistrationNumber;
  if (!verification) {
    return {
      subject: `Update on your E-Challan verification — ${reqId}`,
      body: `Dear ${name},\n\nWe are reviewing your verification request ${reqId} for vehicle ${vehicle}.\nOur team is checking the relevant records and will email the result within 24–48 working hours.\n\n— Karachi E-Challan Verification Team\nsupport@karachiechallan.pk`,
    };
  }
  switch (verification.outcome) {
    case "CHALLAN_FOUND":
      return {
        subject: `Your E-Challan verification result — ${reqId} — Challan Found`,
        body: `Dear ${name},\n\nYour verification request ${reqId} for vehicle ${vehicle} has been reviewed.\n\nResult: CHALLAN FOUND\n\nDetails:\n• Challan Number: ${verification.challanNumber || "—"}\n• Violation: ${verification.violation || "—"}\n• Date: ${verification.challanDate || "—"} ${verification.challanTime || ""}\n• Location: ${verification.location || "—"}\n• Fine Amount: ${verification.fineAmount || "—"}\n• Due Date: ${verification.dueDate || "—"}\n• Payment Status: ${verification.paymentStatus || "—"}\n• Reference / PSID: ${verification.referencePsid || "—"}\n\nNotes: ${verification.notes || "Please follow the official payment instructions on the Sindh Traffic Police portal."}\n\n— Karachi E-Challan Verification Team\nsupport@karachiechallan.pk`,
      };
    case "NO_CHALLAN_FOUND":
      return {
        subject: `Your E-Challan verification result — ${reqId} — No Challan Found`,
        body: `Dear ${name},\n\nYour verification request ${reqId} for vehicle ${vehicle} has been reviewed.\n\nResult: NO CHALLAN FOUND\n\nAs of the verification time, no active challan was found for the vehicle and details you provided.\n\nNotes: ${verification.notes || "New violations may appear later."}\n\n— Karachi E-Challan Verification Team\nsupport@karachiechallan.pk`,
      };
    case "UNABLE_TO_VERIFY":
      return {
        subject: `Your E-Challan verification — ${reqId} — Unable to Verify`,
        body: `Dear ${name},\n\nWe attempted to verify your request ${reqId} for vehicle ${vehicle}, but we were unable to complete the verification.\n\nReason: ${verification.notes || "Records were temporarily unavailable."}\n\n— Karachi E-Challan Verification Team\nsupport@karachiechallan.pk`,
      };
    case "MORE_INFORMATION_REQUIRED":
      return {
        subject: `Action required — More information for ${reqId}`,
        body: `Dear ${name},\n\nTo complete the verification for request ${reqId} (vehicle ${vehicle}), we need more information.\n\nRequired: ${verification.notes || "Please reply with a clearer photo of your registration book/card."}\n\n— Karachi E-Challan Verification Team\nsupport@karachiechallan.pk`,
      };
    default:
      return { subject: `Update — ${reqId}`, body: `Dear ${name},\n\nUpdate for ${reqId}.` };
  }
}
