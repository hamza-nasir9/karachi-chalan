/**
 * Service registry (server side).
 *
 * One request model serves all four public services. What differs per service is
 *   1) the fields the user submits          -> validation.ts (validateServiceInput)
 *   2) the result options an admin can pick -> SERVICE_RESULTS below
 *
 * Workflow status (NEW → IN_REVIEW → RESULT_READY → COMPLETED) is deliberately
 * separate from the service result (verification.outcome).
 *
 * NOTE: src/lib/services.ts mirrors the result lists for the UI. When you change
 * a result list here, change it there too (labels only live in the UI file).
 */

export const REQUEST_TYPES = ["CHECK_CHALLAN", "CHALLAN_STATUS", "COMPLAINT_STATUS", "BLACKLIST_BLOCK"] as const;
export type RequestType = (typeof REQUEST_TYPES)[number];

export const REQUEST_STATUSES = ["NEW", "IN_REVIEW", "RESULT_READY", "COMPLETED"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

/** Statuses in which a request is still "open" (used for duplicate detection). */
export const OPEN_STATUSES: RequestStatus[] = ["NEW", "IN_REVIEW", "RESULT_READY"];

export interface ResultOption {
  value: string;
  /** Admin must type an explanation (sent to the user) before this result can be saved. */
  requiresNotes: boolean;
}

export const SERVICE_RESULTS: Record<RequestType, ResultOption[]> = {
  CHECK_CHALLAN: [
    { value: "CHALLAN_FOUND", requiresNotes: false },
    { value: "NO_CHALLAN_FOUND", requiresNotes: true },
    { value: "UNABLE_TO_VERIFY", requiresNotes: true },
    { value: "MORE_INFORMATION_REQUIRED", requiresNotes: true },
  ],
  CHALLAN_STATUS: [
    { value: "PAID", requiresNotes: false },
    { value: "UNPAID", requiresNotes: false },
    { value: "WAIVED", requiresNotes: false },
  ],
  COMPLAINT_STATUS: [
    { value: "STILL_PENDING", requiresNotes: false },
    { value: "REJECTED", requiresNotes: false },
    { value: "ACCEPTED", requiresNotes: false },
  ],
  // Placeholder set — edit this list (and src/lib/services.ts) once the exact
  // blacklist / block statuses are confirmed. Nothing else needs to change.
  BLACKLIST_BLOCK: [
    { value: "NOT_BLACKLISTED", requiresNotes: false },
    { value: "BLACKLISTED", requiresNotes: false },
    { value: "BLOCKED", requiresNotes: false },
    { value: "UNABLE_TO_VERIFY", requiresNotes: true },
    { value: "MORE_INFORMATION_REQUIRED", requiresNotes: true },
  ],
};

export function isRequestType(v: any): v is RequestType {
  return typeof v === "string" && (REQUEST_TYPES as readonly string[]).includes(v);
}

export function getResultOption(type: RequestType, value: string): ResultOption | undefined {
  return SERVICE_RESULTS[type]?.find(r => r.value === value);
}

/** Statuses used by the old, result-based workflow. They are migrated to RESULT_READY. */
export const LEGACY_RESULT_STATUSES = ["CHALLAN_FOUND", "NO_CHALLAN_FOUND", "UNABLE_TO_VERIFY", "MORE_INFORMATION_REQUIRED"];
