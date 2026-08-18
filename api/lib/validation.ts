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
