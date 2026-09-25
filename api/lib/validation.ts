import type { RequestType } from "./services.js";

export function sanitizeString(s: any, max: number): string {
  if (typeof s !== "string") return "";
  // strip control chars and trim
  let v = s.replace(/[<>]/g, "").trim();
  // collapse whitespace
  v = v.replace(/\s+/g, " ");
  if (v.length > max) v = v.slice(0, max);
  return v;
}
export function sanitizeEmail(s: any): string {
  if (typeof s !== "string") return "";
  return s.trim().toLowerCase().slice(0, 120);
}
export function digitsOnly(s: any): string { return String(s||"").replace(/\D/g, ""); }
export function normalizeVehicle(v: any): string { return String(v||"").trim().toUpperCase().replace(/\s+/g, "").replace(/[^A-Z0-9-]/g, "").slice(0, 16); }

/** Kept in sync with src/lib/services.ts VEHICLE_TYPES. */
export const VEHICLE_TYPES = ["Car", "Motorcycle", "Rickshaw", "Van / Pickup", "Bus / Truck", "Other"];

export interface FieldErrors { [k:string]: string }

export function validatePublicInput(body: any): { valid: boolean; errors: FieldErrors; cleaned?: any } {
  const errors: FieldErrors = {};
  const vehicleRegistrationNumber = normalizeVehicle(body.vehicleRegistrationNumber || "");
  if (!vehicleRegistrationNumber || vehicleRegistrationNumber.length < 3 || vehicleRegistrationNumber.length > 16) errors.vehicleRegistrationNumber = "Enter registration as on documents (e.g., KHI-3921).";
  else if (!/^[A-Z0-9-]{3,16}$/.test(vehicleRegistrationNumber)) errors.vehicleRegistrationNumber = "Use letters, numbers and dash only.";

  const vehicleType = sanitizeString(body.vehicleType || "", 40);
  if (!vehicleType) errors.vehicleType = "Please select vehicle type.";

  const fullName = sanitizeString(body.fullName || "", 80);
  if (!fullName || fullName.length < 3) errors.fullName = "Enter full name as per CNIC (3–80 characters).";
  else if (!/^[a-zA-Z\s'.-]+$/.test(fullName)) errors.fullName = "Name may contain letters, spaces, apostrophes and hyphens only.";

  const cnic = digitsOnly(body.cnic || "");
  if (cnic.length !== 13) errors.cnic = "Enter a valid 13-digit CNIC.";

  const mobile = digitsOnly(body.mobile || "");
  if (mobile.length !== 11 || !mobile.startsWith("03")) errors.mobile = "Enter an 11-digit mobile starting with 03.";

  const email = sanitizeEmail(body.email || "");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) errors.email = "Enter a valid email address.";

  const vehicleMake = sanitizeString(body.vehicleMake || "", 60);
  const vehicleColor = sanitizeString(body.vehicleColor || "", 30);
  const area = sanitizeString(body.area || "", 120);
  const challanRef = sanitizeString(body.challanRef || "", 60);
  const notes = sanitizeString(body.notes || "", 800);

  let violationDate: string | null = null;
  if (body.violationDate) {
    const d = new Date(body.violationDate);
    if (isNaN(d.getTime())) errors.violationDate = "Invalid date.";
    else if (d > new Date()) errors.violationDate = "Violation date cannot be in the future.";
    else if (d.getFullYear() < 2020) errors.violationDate = "Date too far in the past.";
    else violationDate = body.violationDate;
  }
  let violationTime: string | null = null;
  if (body.violationTime) {
    if (!/^\d{2}:\d{2}$/.test(body.violationTime)) errors.violationTime = "Invalid time (HH:MM).";
    else violationTime = body.violationTime;
  }

  if (Object.keys(errors).length) return { valid: false, errors };
  return {
    valid: true, errors,
    cleaned: {
      vehicleRegistrationNumber,
      vehicleType: vehicleType,
      vehicleMake: vehicleMake || undefined,
      vehicleColor: vehicleColor || undefined,
      fullName,
      cnic, mobile, email,
      violationDate, violationTime,
      area: area || null,
      challanRef: challanRef || null,
      notes: notes || null,
    }
  };
}

// ---------------------------------------------------------------------------
// Service requests (Check Challan / Challan Status / Complaint Status / Blacklist)
// ---------------------------------------------------------------------------

/** Field names each public service accepts. Everything else in the body is ignored. */
export const SERVICE_FIELDS: Record<RequestType, string[]> = {
  CHECK_CHALLAN: ["fullName", "cnic", "vehicleRegistration", "vehicleType", "challanNumber", "phone", "email"],
  CHALLAN_STATUS: ["challanNumber", "fullName", "email", "phone", "cnic"],
  COMPLAINT_STATUS: ["fullName", "phone", "email", "challanNumber", "complaintNumber"],
  BLACKLIST_BLOCK: ["fullName", "vehicleNumber", "phone", "email"],
};

/** 0092 / +92 / 92 prefixes -> local 0XXXXXXXXXX form, digits only. */
export function normalizePhone(v: any): string {
  let d = digitsOnly(v);
  if (d.startsWith("0092")) d = "0" + d.slice(4);
  else if (d.startsWith("92") && d.length === 12) d = "0" + d.slice(2);
  return d;
}

function cleanReference(v: any, max: number): string {
  return sanitizeString(v, max).toUpperCase();
}

export interface ServiceInputResult {
  valid: boolean;
  errors: FieldErrors;
  /** Sanitised submitted fields (only those the service accepts). */
  formData?: Record<string, string>;
  /** Key used to detect a duplicate open request for the same subject. */
  dedupeKey?: string;
}

export function validateServiceInput(type: RequestType, body: any): ServiceInputResult {
  const errors: FieldErrors = {};
  const out: Record<string, string> = {};
  const fields = SERVICE_FIELDS[type];

  for (const f of fields) {
    switch (f) {
      case "fullName": {
        const v = sanitizeString(body.fullName, 80);
        if (!v || v.length < 3) errors.fullName = "Enter your full name (3–80 characters).";
        else if (!/^[a-zA-Z\s'.-]+$/.test(v)) errors.fullName = "Name may contain letters, spaces, apostrophes and hyphens only.";
        out.fullName = v;
        break;
      }
      case "cnic": {
        const v = digitsOnly(body.cnic);
        if (v.length !== 13) errors.cnic = "Enter a valid 13-digit CNIC (e.g., 42201-1234567-1).";
        out.cnic = v;
        break;
      }
      case "phone": {
        const v = normalizePhone(body.phone);
        if (v.length !== 11 || !v.startsWith("03")) errors.phone = "Enter an 11-digit mobile number starting with 03 (e.g., 0300-1234567).";
        out.phone = v;
        break;
      }
      case "email": {
        const v = sanitizeEmail(body.email);
        if (!v || v.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) errors.email = "Enter a valid email address where we can send the reply.";
        out.email = v;
        break;
      }
      case "challanNumber": {
        const v = cleanReference(body.challanNumber, 40);
        if (!v) errors.challanNumber = "Challan number is required.";
        else if (v.length < 3) errors.challanNumber = "Challan number looks too short.";
        else if (!/^[A-Z0-9][A-Z0-9\s\-\/]*$/.test(v)) errors.challanNumber = "Use letters, numbers, dash or slash only.";
        out.challanNumber = v;
        break;
      }
      case "complaintNumber": {
        const v = cleanReference(body.complaintNumber, 40);
        if (!v) errors.complaintNumber = "Complaint number is required.";
        else if (v.length < 3) errors.complaintNumber = "Complaint number looks too short.";
        else if (!/^[A-Z0-9][A-Z0-9\s\-\/]*$/.test(v)) errors.complaintNumber = "Use letters, numbers, dash or slash only.";
        out.complaintNumber = v;
        break;
      }
      case "vehicleNumber": {
        const v = normalizeVehicle(body.vehicleNumber);
        if (!v) errors.vehicleNumber = "Vehicle number is required (e.g., KHI-3921).";
        else if (v.length < 3 || v.length > 16) errors.vehicleNumber = "Enter the registration number as shown on the number plate.";
        out.vehicleNumber = v;
        break;
      }
      case "vehicleRegistration": {
        const v = normalizeVehicle(body.vehicleRegistration);
        if (!v) errors.vehicleRegistration = "Vehicle registration / number plate is required (e.g., KHI-3921).";
        else if (v.length < 3 || v.length > 16) errors.vehicleRegistration = "Enter the registration number as shown on the number plate.";
        out.vehicleRegistration = v;
        break;
      }
      case "vehicleType": {
        const v = sanitizeString(body.vehicleType, 20);
        if (!VEHICLE_TYPES.includes(v)) errors.vehicleType = "Select a valid vehicle type.";
        out.vehicleType = v;
        break;
      }
    }
  }

  if (Object.keys(errors).length) return { valid: false, errors };

  const subject =
    type === "COMPLAINT_STATUS" ? out.complaintNumber :
    type === "BLACKLIST_BLOCK" ? out.vehicleNumber :
    out.challanNumber;
  return { valid: true, errors, formData: out, dedupeKey: `${type}|${out.email}|${subject}` };
}
