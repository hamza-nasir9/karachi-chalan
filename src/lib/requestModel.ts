/**
 * Karachi E-Challan — Verification Request Model
 * Part 3: Backend Request Management Foundation
 *
 * Database-ready architecture. In production replace the Store with Postgres/Prisma.
 */
import type { RequestType } from "./services"

/**
 * Overall workflow status. The service-specific result (Challan Found, Paid, Accepted, …)
 * is stored separately in `verification.outcome` — see services.ts.
 */
export const RequestStatus = {
  NEW: "NEW",
  IN_REVIEW: "IN_REVIEW",
  RESULT_READY: "RESULT_READY",
  COMPLETED: "COMPLETED",
} as const

export type RequestStatusType = typeof RequestStatus[keyof typeof RequestStatus]

export const STATUS_LABEL: Record<RequestStatusType, string> = {
  NEW: "New",
  IN_REVIEW: "In Review",
  RESULT_READY: "Result Ready",
  COMPLETED: "Completed",
}

/** Tailwind classes for the workflow-status pill (shared by dashboard, list and detail). */
export const statusBadge = (s: string): string => {
  const map: Record<string, string> = {
    NEW: "bg-amber-50 text-amber-700 border-amber-200",
    IN_REVIEW: "bg-blue-50 text-blue-700 border-blue-200",
    RESULT_READY: "bg-teal-50 text-teal-700 border-teal-200",
    COMPLETED: "bg-[#0C1E3A] text-white border-[#0C1E3A]",
  }
  return map[s] || "bg-slate-50 text-slate-700 border-slate-200"
}

export interface VerificationRequest {
  // Identity
  requestId: string // ECV-2026-001245
  requestType?: RequestType // missing on very old records = CHECK_CHALLAN
  status: RequestStatusType
  formData?: Record<string, string> // service-specific submitted fields
  // Vehicle — Step 1 (original vehicle form, and Blacklist / Block vehicle number)
  vehicleRegistrationNumber?: string
  vehicleType?: string
  vehicleMake?: string
  vehicleColor?: string
  // Personal — Step 2 (sensitive)
  fullName: string
  cnic?: string // stored normalized digits only (13)
  mobile?: string // normalized digits only (11)
  email: string
  // Additional — Step 3 (all optional)
  violationDate?: string | null // YYYY-MM-DD or null
  violationTime?: string | null // HH:MM or null
  area?: string | null
  challanRef?: string | null
  notes?: string | null
  // Meta
  createdAt: string // ISO
  updatedAt: string // ISO
}

export interface CreateRequestInput {
  vehicleRegistrationNumber: string
  vehicleType: string
  vehicleMake?: string
  vehicleColor?: string
  fullName: string
  cnic: string
  mobile: string
  email: string
  violationDate?: string | null
  violationTime?: string | null
  area?: string | null
  challanRef?: string | null
  notes?: string | null
}

export interface CreateRequestResult {
  requestId: string
  status: RequestStatusType
  createdAt: string
  duplicate?: boolean
  existingRequestId?: string
}

// ─── helpers ───

export function normalizeVehicle(v: string): string {
  return v.trim().toUpperCase().replace(/\s+/g, "").replace(/[^A-Z0-9-]/g, "")
}
export function normalizeEmail(e: string): string {
  return e.trim().toLowerCase()
}
export function digitsOnly(s: string): string {
  return s.replace(/\D/g, "")
}

export function generateRequestId(counter: number, year = new Date().getFullYear()): string {
  return `ECV-${year}-${String(counter).padStart(6, "0")}`
}

export function maskCNIC(cnicDigits: string): string {
  if (cnicDigits.length !== 13) return "•••••••••••••"
  return `${cnicDigits.slice(0, 5)}-•••••••-${cnicDigits.slice(12)}`
}
export function maskMobile(mobileDigits: string): string {
  if (mobileDigits.length !== 11) return "•••••••••••"
  return `${mobileDigits.slice(0, 4)}-•••${mobileDigits.slice(7)}`
}
export function maskEmail(email: string): string {
  const [u, d] = email.split("@")
  if (!d) return "***"
  const masked = u.length <= 2 ? u[0] + "*" : u[0] + "*" + u.slice(-1)
  return `${masked}@${d}`
}

// ─── validation ───
export interface FieldErrors {
  [k: string]: string
}

export function validateCreateInput(input: CreateRequestInput): { valid: boolean; errors: FieldErrors } {
  const errors: FieldErrors = {}

  const vrn = normalizeVehicle(input.vehicleRegistrationNumber || "")
  if (!vrn || vrn.length < 3 || vrn.length > 16) {
    errors.vehicleRegistrationNumber = "Enter registration as on documents (e.g., KHI-3921)."
  } else if (!/^[A-Z0-9-]{3,16}$/.test(vrn)) {
    errors.vehicleRegistrationNumber = "Use letters, numbers and dash only."
  }

  if (!input.vehicleType || !input.vehicleType.trim()) {
    errors.vehicleType = "Please select vehicle type."
  }

  if (!input.fullName || input.fullName.trim().length < 3 || input.fullName.trim().length > 80) {
    errors.fullName = "Enter full name as per CNIC (3–80 characters)."
  } else if (!/^[a-zA-Z\s'.-]+$/.test(input.fullName.trim())) {
    errors.fullName = "Name may contain letters, spaces, apostrophes and hyphens only."
  }

  const cnic = digitsOnly(input.cnic || "")
  if (cnic.length !== 13) {
    errors.cnic = "Enter a valid 13-digit CNIC."
  }

  const mobile = digitsOnly(input.mobile || "")
  if (mobile.length !== 11 || !mobile.startsWith("03")) {
    errors.mobile = "Enter an 11-digit mobile starting with 03 (e.g., 03001234567)."
  }

  const email = normalizeEmail(input.email || "")
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) {
    errors.email = "Enter a valid email address."
  }

  // Optional fields length checks
  if (input.vehicleMake && input.vehicleMake.length > 60) errors.vehicleMake = "Make/model too long (max 60)."
  if (input.vehicleColor && input.vehicleColor.length > 30) errors.vehicleColor = "Color too long."
  if (input.area && input.area.length > 120) errors.area = "Location too long (max 120)."
  if (input.challanRef && input.challanRef.length > 60) errors.challanRef = "Reference too long (max 60)."
  if (input.notes && input.notes.length > 800) errors.notes = "Notes too long (max 800)."

  if (input.violationDate) {
    const d = new Date(input.violationDate)
    if (isNaN(d.getTime())) errors.violationDate = "Invalid date."
    else if (d > new Date()) errors.violationDate = "Violation date cannot be in the future."
    else if (d.getFullYear() < 2020) errors.violationDate = "Date too far in the past."
  }
  if (input.violationTime && !/^\d{2}:\d{2}$/.test(input.violationTime)) {
    errors.violationTime = "Invalid time (HH:MM)."
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

// For API responses — never expose full sensitive data
// Sensitive fields are masked or omitted for public endpoints; admin endpoints require auth
export function toPublicSafeResult(req: VerificationRequest): CreateRequestResult {
  return {
    requestId: req.requestId,
    status: req.status,
    createdAt: req.createdAt,
  }
}

export function toAdminSafeRecord(req: VerificationRequest) {
  return {
    ...req,
    // admin view still masks for display but has access via secure method
    cnicMasked: maskCNIC(req.cnic || ""),
    mobileMasked: maskMobile(req.mobile || ""),
    emailMasked: maskEmail(req.email),
  }
}
