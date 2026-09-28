/**
 * API Client — Production
 * Public verification form -> real backend API -> MongoDB.
 * No localStorage fallback — database is single source of truth.
 * Sanitization + validation also runs server-side; client validates for UX.
 */
import { validateCreateInput, type CreateRequestInput, type CreateRequestResult } from "./requestModel";
import { validateServiceForm, type RequestType, SERVICES } from "./services";

export type ApiSuccess<T> = { success: true; data: T };
export type ApiError = {
  success: false;
  error: { code?: string; message: string; fields?: Record<string, string> };
};
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

/** Single public endpoint for every service form. Handled by src/server/handler.ts. */
const REQUESTS_ENDPOINT = "/api/requests";

/**
 * POST a public request and normalise every outcome (success, server error,
 * non-JSON error page, network failure) into an ApiResponse. Never fakes success.
 */
async function postRequest(payload: unknown): Promise<ApiResponse<CreateRequestResult>> {
  try {
    const res = await fetch(REQUESTS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // No auth needed for public submission
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => null);

    if (res.ok && json?.success) return json as ApiSuccess<CreateRequestResult>;

    // Structured error from our API (validation / duplicate / rate limit / DB error)
    if (json && json.success === false) return json as ApiError;

    // Non-JSON or unexpected response
    if (res.status === 429) {
      return { success: false, error: { code: "RATE_LIMITED", message: "Too many requests. Please wait a few minutes before submitting again." } };
    }
    if (res.status === 404 || res.status === 405) {
      // The request never reached our API (wrong path / API not running) — say so instead of a bare status.
      return { success: false, error: { code: "API_UNREACHABLE", message: `The submission service is not reachable right now (${res.status}). Please try again in a moment.` } };
    }
    return { success: false, error: { code: "SERVER_ERROR", message: `Submission failed (${res.status}). Please try again.` } };
  } catch (e: any) {
    // Network error — do NOT fake success, preserve form data
    return {
      success: false,
      error: { code: "NETWORK_ERROR", message: e?.message?.includes("Failed to fetch") ? "Network error. Please check your connection and try again." : e?.message || "Submission failed. Please try again." },
    };
  }
}

export async function submitVerificationRequest(input: CreateRequestInput): Promise<ApiResponse<CreateRequestResult>> {
  const v = validateCreateInput(input);
  if (!v.valid) {
    return {
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Please correct the highlighted fields.", fields: v.errors },
    };
  }
  return postRequest(input);
}

/**
 * Submit one of the four service requests (Check Challan, Challan Status,
 * Complaint Status, Blacklist / Block) to the same public endpoint.
 */
export async function submitServiceRequest(type: RequestType, values: Record<string, string>): Promise<ApiResponse<CreateRequestResult>> {
  const errors = validateServiceForm(SERVICES[type], values);
  if (Object.keys(errors).length) {
    return { success: false, error: { code: "VALIDATION_ERROR", message: "Please correct the highlighted fields.", fields: errors } };
  }
  return postRequest({ ...values, requestType: type });
}
