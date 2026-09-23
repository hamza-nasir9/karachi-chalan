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

export async function submitVerificationRequest(input: CreateRequestInput): Promise<ApiResponse<CreateRequestResult>> {
  const v = validateCreateInput(input);
  if (!v.valid) {
    return {
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Please correct the highlighted fields.", fields: v.errors },
    };
  }

  try {
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // No auth needed for public submission
      body: JSON.stringify(input),
    });
    const json = await res.json().catch(() => null);

    if (res.ok && json?.success) {
      // Real DB success — no local mirror
      return json as ApiSuccess<CreateRequestResult>;
    }

    if (json && json.success === false) {
      // Server validation / duplicate / rate limit / DB error
      return json as ApiError;
    }

    // Fallback for non-JSON or unexpected status
    if (res.status === 429) {
      return {
        success: false,
        error: { code: "RATE_LIMITED", message: json?.error?.message || "Too many requests. Please wait a few minutes before submitting again." },
      };
    }

    return {
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: json?.error?.message || `Submission failed (${res.status}). Please try again.`,
        fields: json?.error?.fields,
      },
    };
  } catch (e: any) {
    // Network error — do NOT fake success, preserve form data
    return {
      success: false,
      error: { code: "NETWORK_ERROR", message: e?.message?.includes("Failed to fetch") ? "Network error. Please check your connection and try again." : e?.message || "Submission failed. Please try again." },
    };
  }
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
  try {
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, requestType: type }),
    });
    const json = await res.json().catch(() => null);
    if (res.ok && json?.success) return json as ApiSuccess<CreateRequestResult>;
    if (json && json.success === false) return json as ApiError;
    return {
      success: false,
      error: { code: res.status === 429 ? "RATE_LIMITED" : "SERVER_ERROR", message: json?.error?.message || `Submission failed (${res.status}). Please try again.` },
    };
  } catch (e: any) {
    return {
      success: false,
      error: { code: "NETWORK_ERROR", message: e?.message?.includes("Failed to fetch") ? "Network error. Please check your connection and try again." : e?.message || "Submission failed. Please try again." },
    };
  }
}
