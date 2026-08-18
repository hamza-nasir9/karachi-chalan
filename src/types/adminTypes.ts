export interface InternalNote {
  id: string;
  text: string;
  adminName: string;
  adminEmail: string;
  createdAt: string;
}
export interface VerificationResult {
  outcome: "CHALLAN_FOUND" | "NO_CHALLAN_FOUND" | "UNABLE_TO_VERIFY" | "MORE_INFORMATION_REQUIRED";
  challanNumber?: string;
  violation?: string;
  challanDate?: string;
  challanTime?: string;
  location?: string;
  fineAmount?: string;
  dueDate?: string;
  paymentStatus?: string;
  referencePsid?: string;
  notes?: string;
  updatedAt: string;
  updatedBy: string;
}
export interface EmailRecord {
  id: string;
  requestId: string;
  to: string;
  subject: string;
  body: string;
  html?: string | null;
  templateId?: string | null;
  resultType?: string | null;
  status: "SENT" | "FAILED";
  sentAt: string;
  sentBy: string;
  messageId?: string | null;
  demoMode?: boolean;
  error?: string | null;
}
