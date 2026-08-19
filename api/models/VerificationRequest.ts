import mongoose, { Schema, Document } from "mongoose";

export type RequestStatus =
  | "NEW"
  | "IN_REVIEW"
  | "MORE_INFORMATION_REQUIRED"
  | "CHALLAN_FOUND"
  | "NO_CHALLAN_FOUND"
  | "UNABLE_TO_VERIFY"
  | "COMPLETED";

export interface IPrivateNote {
  id: string;
  text: string;
  adminName: string;
  adminEmail: string;
  createdAt: Date;
}

export interface IVerificationResult {
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
  updatedAt: Date;
  updatedBy: string;
}

export interface IStatusChange {
  from: string;
  to: string;
  changedAt: Date;
  changedBy: string;
  note?: string;
}

export interface IVerificationRequest extends Document {
  requestId: string;
  status: RequestStatus;
  vehicleRegistrationNumber: string;
  vehicleType: string;
  vehicleMake?: string;
  vehicleColor?: string;
  fullName: string;
  cnic: string;
  mobile: string;
  email: string;
  violationDate?: string | null;
  violationTime?: string | null;
  area?: string | null;
  challanRef?: string | null;
  notes?: string | null;
  verification?: IVerificationResult | null;
  privateNotes: IPrivateNote[];
  statusHistory: IStatusChange[];
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const PrivateNoteSchema = new Schema<IPrivateNote>({
  id: { type: String, required: true },
  text: { type: String, required: true },
  adminName: { type: String, required: true },
  adminEmail: { type: String, required: true },
  createdAt: { type: Date, required: true },
}, { _id: false });

const VerificationResultSchema = new Schema<IVerificationResult>({
  outcome: { type: String, required: true, enum: ["CHALLAN_FOUND","NO_CHALLAN_FOUND","UNABLE_TO_VERIFY","MORE_INFORMATION_REQUIRED"] },
  challanNumber: { type: String },
  violation: { type: String },
  challanDate: { type: String },
  challanTime: { type: String },
  location: { type: String },
  fineAmount: { type: String },
  dueDate: { type: String },
  paymentStatus: { type: String },
  referencePsid: { type: String },
  notes: { type: String },
  updatedAt: { type: Date, required: true },
  updatedBy: { type: String, required: true },
}, { _id: false });

const StatusChangeSchema = new Schema<IStatusChange>({
  from: { type: String, required: true },
  to: { type: String, required: true },
  changedAt: { type: Date, required: true },
  changedBy: { type: String, required: true },
  note: { type: String }
}, { _id: false });

const VerificationRequestSchema = new Schema<IVerificationRequest>({
  requestId: { type: String, required: true, unique: true, index: true },
  status: { type: String, required: true, enum: ["NEW","IN_REVIEW","MORE_INFORMATION_REQUIRED","CHALLAN_FOUND","NO_CHALLAN_FOUND","UNABLE_TO_VERIFY","COMPLETED"], default: "NEW", index: true },
  vehicleRegistrationNumber: { type: String, required: true, index: true },
  vehicleType: { type: String, required: true },
  vehicleMake: { type: String },
  vehicleColor: { type: String },
  fullName: { type: String, required: true },
  cnic: { type: String, required: true },
  mobile: { type: String, required: true },
  email: { type: String, required: true, index: true },
  violationDate: { type: String, default: null },
  violationTime: { type: String, default: null },
  area: { type: String, default: null },
  challanRef: { type: String, default: null },
  notes: { type: String, default: null },
  verification: { type: VerificationResultSchema, default: null },
  privateNotes: { type: [PrivateNoteSchema], default: [] },
  statusHistory: { type: [StatusChangeSchema], default: [] },
  completedAt: { type: Date, default: null },
}, {
  timestamps: true,
  collection: "verification_requests",
});

VerificationRequestSchema.index({ vehicleRegistrationNumber: 1, email: 1, cnic: 1, createdAt: 1 });
VerificationRequestSchema.index({ createdAt: -1 });

export default (mongoose.models.VerificationRequest as mongoose.Model<IVerificationRequest>) ||
  mongoose.model<IVerificationRequest>("VerificationRequest", VerificationRequestSchema);