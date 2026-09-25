/**
 * Service registry (client side) — the four public E-Challan services.
 *
 * One config drives: the "How It Works" cards, the public form pages,
 * the admin request table badge, the dynamic request detail and the
 * Verification Result options.
 *
 * Result lists mirror api/lib/services.ts (SERVICE_RESULTS). To change the
 * Blacklist / Block statuses later, edit BLACKLIST_BLOCK here and there.
 */
import { FileSearch, BadgeCheck, ClipboardCheck, ShieldAlert } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type RequestType = 'CHECK_CHALLAN' | 'CHALLAN_STATUS' | 'COMPLAINT_STATUS' | 'BLACKLIST_BLOCK'

export const REQUEST_TYPES: RequestType[] = ['CHECK_CHALLAN', 'CHALLAN_STATUS', 'COMPLAINT_STATUS', 'BLACKLIST_BLOCK']

export type FieldKey = 'fullName' | 'cnic' | 'phone' | 'email' | 'challanNumber' | 'complaintNumber' | 'vehicleNumber' | 'vehicleRegistration' | 'vehicleType'

/** Kept in sync with api/lib/validation.ts VEHICLE_TYPES. */
export const VEHICLE_TYPES = ['Car', 'Motorcycle', 'Rickshaw', 'Van / Pickup', 'Bus / Truck', 'Other']

export interface ServiceField {
  key: FieldKey
  label: string
  placeholder: string
  autoComplete?: string
  inputMode?: 'text' | 'numeric' | 'email' | 'tel'
  mono?: boolean
  hint?: string
  /** 'select' renders a dropdown using `options`; omitted/'text' renders a plain input. */
  type?: 'text' | 'select'
  options?: string[]
}

export interface ResultOption {
  value: string
  label: string
  /** Short label used on the compact option buttons in the admin panel. */
  short?: string
  /** Admin must write an explanation (goes to the user) before the result can be saved. */
  requiresNotes?: boolean
}

export interface ServiceDef {
  type: RequestType
  slug: string
  /** Card / page title */
  title: string
  /** Short label for the admin table badge */
  badge: string
  /** Card description on "How It Works" */
  cardDesc: string
  /** Intro under the form page heading */
  intro: string
  /** Two-part heading: plain + italic serif accent, matching the site's headings */
  heading: [string, string]
  icon: LucideIcon
  /** Order of the input fields on the public form. */
  fields: ServiceField[]
  /** Order of the fields on the admin request detail. */
  detail: FieldKey[]
  /** Result options offered in the admin Verification Result card. */
  results: ResultOption[]
  resultNotesHelp: string
  /** Tailwind classes for the small service tag. */
  tag: string
  /** Text used in the user-facing email: "your <emailSubject>" */
  emailSubject: string
}

const F: Record<FieldKey, ServiceField> = {
  fullName: { key: 'fullName', label: 'Full Name', placeholder: 'As per CNIC', autoComplete: 'name' },
  cnic: { key: 'cnic', label: 'CNIC', placeholder: '42201-1234567-1', autoComplete: 'off', inputMode: 'numeric', mono: true, hint: '13 digits — dashes are added for you.' },
  phone: { key: 'phone', label: 'Phone', placeholder: '0300-1234567', autoComplete: 'tel', inputMode: 'tel', mono: true, hint: 'Mobile number starting with 03.' },
  email: { key: 'email', label: 'Email', placeholder: 'you@example.com', autoComplete: 'email', inputMode: 'email', hint: 'The reply will be sent to this address.' },
  challanNumber: { key: 'challanNumber', label: 'Challan Number', placeholder: 'e.g., KHI-E-123456', autoComplete: 'off', mono: true },
  complaintNumber: { key: 'complaintNumber', label: 'Complaint Number', placeholder: 'e.g., CMP-2026-0001', autoComplete: 'off', mono: true },
  vehicleNumber: { key: 'vehicleNumber', label: 'Vehicle Number', placeholder: 'e.g., KHI-3921', autoComplete: 'off', mono: true, hint: 'As shown on the number plate.' },
  vehicleRegistration: { key: 'vehicleRegistration', label: 'Vehicle Registration / Number Plate', placeholder: 'e.g., KHI-3921', autoComplete: 'off', mono: true, hint: 'As shown on the number plate.' },
  vehicleType: { key: 'vehicleType', label: 'Vehicle Type', placeholder: 'Select vehicle type', type: 'select', options: VEHICLE_TYPES },
}

const pick = (...keys: FieldKey[]) => keys.map(k => F[k])

export const SERVICES: Record<RequestType, ServiceDef> = {
  CHECK_CHALLAN: {
    type: 'CHECK_CHALLAN',
    slug: 'check-challan',
    title: 'Check Challan',
    badge: 'Check Challan',
    cardDesc: 'Ask our team to check whether a challan exists against your details. The reply comes to your email.',
    intro: 'Share your CNIC and challan number. Our team verifies the records and emails you the outcome.',
    heading: ['Check', 'Challan'],
    icon: FileSearch,
    fields: pick('fullName', 'cnic', 'vehicleRegistration', 'vehicleType', 'challanNumber', 'phone', 'email'),
    detail: ['fullName', 'email', 'cnic', 'phone', 'vehicleRegistration', 'vehicleType', 'challanNumber'],
    results: [
      { value: 'CHALLAN_FOUND', label: 'Challan Found', short: 'Challan Found' },
      { value: 'NO_CHALLAN_FOUND', label: 'No Challan Found', short: 'No Challan Found', requiresNotes: true },
      { value: 'UNABLE_TO_VERIFY', label: 'Unable to Verify', short: 'Unable to Verify', requiresNotes: true },
      { value: 'MORE_INFORMATION_REQUIRED', label: 'More Information Required', short: 'More Info Required', requiresNotes: true },
    ],
    resultNotesHelp: 'Sent verbatim to the user — keep it clear.',
    tag: 'bg-blue-50 text-blue-700 border-blue-200',
    emailSubject: 'challan check',
  },
  CHALLAN_STATUS: {
    type: 'CHALLAN_STATUS',
    slug: 'challan-status',
    title: 'Challan Paid / Unpaid / Waived',
    badge: 'Challan Status',
    cardDesc: 'Find out whether a challan is marked paid, unpaid or waived. We confirm it by email.',
    intro: 'Enter the challan number and your details. We check its payment position and email you the result.',
    heading: ['Challan', 'Status'],
    icon: BadgeCheck,
    fields: pick('challanNumber', 'fullName', 'email', 'phone', 'cnic'),
    detail: ['challanNumber', 'fullName', 'email', 'phone', 'cnic'],
    results: [
      { value: 'PAID', label: 'Paid' },
      { value: 'UNPAID', label: 'Unpaid' },
      { value: 'WAIVED', label: 'Waived' },
    ],
    resultNotesHelp: 'Optional — added to the email if you want to give the user more detail.',
    tag: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    emailSubject: 'challan status request',
  },
  COMPLAINT_STATUS: {
    type: 'COMPLAINT_STATUS',
    slug: 'complaint-status',
    title: 'Check Complaint Status',
    badge: 'Complaint Status',
    cardDesc: 'Already lodged a complaint against a challan? We check where it stands and email you the update.',
    intro: 'Enter your challan and complaint numbers. We check the complaint and email you its current status.',
    heading: ['Complaint', 'Status'],
    icon: ClipboardCheck,
    fields: pick('fullName', 'phone', 'email', 'challanNumber', 'complaintNumber'),
    detail: ['fullName', 'phone', 'email', 'challanNumber', 'complaintNumber'],
    results: [
      { value: 'STILL_PENDING', label: 'Still Pending' },
      { value: 'REJECTED', label: 'Rejected' },
      { value: 'ACCEPTED', label: 'Accepted' },
    ],
    resultNotesHelp: 'Optional — added to the email if you want to give the user more detail.',
    tag: 'bg-amber-50 text-amber-700 border-amber-200',
    emailSubject: 'complaint status request',
  },
  BLACKLIST_BLOCK: {
    type: 'BLACKLIST_BLOCK',
    slug: 'blacklist-block',
    title: 'Check Blacklist / Block',
    badge: 'Blacklist / Block',
    cardDesc: 'Ask whether a vehicle is blacklisted or blocked. Our team checks and replies to your email.',
    intro: 'Enter the vehicle number and your contact details. We verify the vehicle and email you the outcome.',
    heading: ['Blacklist /', 'Block Check'],
    icon: ShieldAlert,
    fields: pick('fullName', 'vehicleNumber', 'phone', 'email'),
    detail: ['fullName', 'vehicleNumber', 'phone', 'email'],
    // Placeholder statuses — replace with the exact blacklist / block statuses when they are confirmed.
    results: [
      { value: 'NOT_BLACKLISTED', label: 'Not Blacklisted' },
      { value: 'BLACKLISTED', label: 'Blacklisted' },
      { value: 'BLOCKED', label: 'Blocked' },
      { value: 'UNABLE_TO_VERIFY', label: 'Unable to Verify', requiresNotes: true },
      { value: 'MORE_INFORMATION_REQUIRED', label: 'More Information Required', short: 'More Info Required', requiresNotes: true },
    ],
    resultNotesHelp: 'Optional for a clear result — added to the email if you want to give the user more detail.',
    tag: 'bg-red-50 text-red-700 border-red-200',
    emailSubject: 'blacklist / block check',
  },
}

export const SERVICE_LIST: ServiceDef[] = REQUEST_TYPES.map(t => SERVICES[t])

export function serviceBySlug(slug?: string): ServiceDef | undefined {
  return SERVICE_LIST.find(s => s.slug === slug)
}

export function getService(type?: string | null): ServiceDef {
  return SERVICES[(type as RequestType)] || SERVICES.CHECK_CHALLAN
}

const RESULT_LABELS: Record<string, string> = {}
for (const s of SERVICE_LIST) for (const r of s.results) RESULT_LABELS[r.value] = RESULT_LABELS[r.value] || r.label

export function resultLabel(value?: string | null): string {
  if (!value) return ''
  return RESULT_LABELS[value] || value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

/** Colour for a result chip. Unknown values (added later) fall back to neutral. */
export function resultBadge(value?: string | null): string {
  switch (value) {
    case 'CHALLAN_FOUND': case 'PAID': case 'ACCEPTED': case 'NOT_BLACKLISTED':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'UNPAID': case 'REJECTED': case 'BLACKLISTED': case 'BLOCKED': case 'UNABLE_TO_VERIFY':
      return 'bg-red-50 text-red-700 border-red-200'
    case 'STILL_PENDING': case 'MORE_INFORMATION_REQUIRED':
      return 'bg-orange-50 text-orange-700 border-orange-200'
    default: // NO_CHALLAN_FOUND, WAIVED and anything added later
      return 'bg-slate-50 text-slate-700 border-slate-200'
  }
}

// ─── formatting + validation shared by the public forms ───

export function formatCNIC(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 13)
  if (d.length <= 5) return d
  if (d.length <= 12) return `${d.slice(0, 5)}-${d.slice(5)}`
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`
}

export function formatPhone(v: string) {
  let d = v.replace(/\D/g, '')
  if (d.startsWith('0092')) d = '0' + d.slice(4)
  else if (d.startsWith('92') && d.length > 10) d = '0' + d.slice(2)
  d = d.slice(0, 11)
  if (d.length <= 4) return d
  return `${d.slice(0, 4)}-${d.slice(4)}`
}

/** Mirrors validateServiceInput on the server (the server remains the source of truth). */
export function validateServiceForm(service: ServiceDef, values: Record<string, string>): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const f of service.fields) {
    const raw = (values[f.key] || '').trim()
    switch (f.key) {
      case 'fullName':
        if (!raw || raw.length < 3) errors.fullName = 'Enter your full name (3–80 characters).'
        else if (raw.length > 80) errors.fullName = 'Name is too long (max 80).'
        else if (!/^[a-zA-Z\s'.-]+$/.test(raw)) errors.fullName = 'Name may contain letters, spaces, apostrophes and hyphens only.'
        break
      case 'cnic':
        if (raw.replace(/\D/g, '').length !== 13) errors.cnic = 'Enter a valid 13-digit CNIC (e.g., 42201-1234567-1).'
        break
      case 'phone': {
        const d = raw.replace(/\D/g, '')
        if (d.length !== 11 || !d.startsWith('03')) errors.phone = 'Enter an 11-digit mobile number starting with 03 (e.g., 0300-1234567).'
        break
      }
      case 'email':
        if (!raw || raw.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) errors.email = 'Enter a valid email address where we can send the reply.'
        break
      case 'challanNumber':
        if (!raw) errors.challanNumber = 'Challan number is required.'
        else if (raw.length < 3) errors.challanNumber = 'Challan number looks too short.'
        else if (!/^[A-Za-z0-9][A-Za-z0-9\s\-/]*$/.test(raw)) errors.challanNumber = 'Use letters, numbers, dash or slash only.'
        break
      case 'complaintNumber':
        if (!raw) errors.complaintNumber = 'Complaint number is required.'
        else if (raw.length < 3) errors.complaintNumber = 'Complaint number looks too short.'
        else if (!/^[A-Za-z0-9][A-Za-z0-9\s\-/]*$/.test(raw)) errors.complaintNumber = 'Use letters, numbers, dash or slash only.'
        break
      case 'vehicleNumber': {
        const v = raw.toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9-]/g, '')
        if (!v) errors.vehicleNumber = 'Vehicle number is required (e.g., KHI-3921).'
        else if (v.length < 3 || v.length > 16) errors.vehicleNumber = 'Enter the registration number as shown on the number plate.'
        break
      }
      case 'vehicleRegistration': {
        const v = raw.toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9-]/g, '')
        if (!v) errors.vehicleRegistration = 'Vehicle registration / number plate is required (e.g., KHI-3921).'
        else if (v.length < 3 || v.length > 16) errors.vehicleRegistration = 'Enter the registration number as shown on the number plate.'
        break
      }
      case 'vehicleType':
        if (!VEHICLE_TYPES.includes(raw)) errors.vehicleType = 'Select a vehicle type.'
        break
    }
  }
  return errors
}

interface RequestLike {
  fullName?: string
  email?: string
  cnic?: string
  mobile?: string
  challanRef?: string | null
  vehicleRegistrationNumber?: string
  vehicleType?: string
  formData?: Record<string, string>
}

/** Read a submitted field from a stored request (top-level mirrors + formData + legacy fields). */
export function getRequestField(request: RequestLike | null | undefined, key: FieldKey): string {
  const fd = request?.formData || {}
  switch (key) {
    case 'fullName': return request?.fullName || fd.fullName || ''
    case 'email': return request?.email || fd.email || ''
    case 'cnic': return request?.cnic || fd.cnic || ''
    case 'phone': return request?.mobile || fd.phone || ''
    case 'challanNumber': return fd.challanNumber || request?.challanRef || ''
    case 'complaintNumber': return fd.complaintNumber || ''
    case 'vehicleNumber': return fd.vehicleNumber || request?.vehicleRegistrationNumber || ''
    case 'vehicleRegistration': return fd.vehicleRegistration || request?.vehicleRegistrationNumber || ''
    case 'vehicleType': return fd.vehicleType || request?.vehicleType || ''
  }
}
