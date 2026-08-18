import mongoose, { Schema, Document } from "mongoose";

export interface IEmailRecord extends Document {
  requestId: string;
  to: string;
  subject: string;
  body: string; // text
  html?: string | null;
  templateId?: string | null;
  resultType?: string | null;
  status: "SENT" | "FAILED";
  sentBy: string;
  messageId?: string | null;
  error?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const EmailRecordSchema = new Schema<IEmailRecord>({
  requestId: { type: String, required: true, index: true },
  to: { type: String, required: true },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  html: { type: String, default: null },
  templateId: { type: String, default: null },
  resultType: { type: String, default: null },
  status: { type: String, required: true, enum: ["SENT","FAILED"] },
  sentBy: { type: String, required: true },
  messageId: { type: String, default: null },
  error: { type: String, default: null },
}, { timestamps: true, collection: "email_records" });

EmailRecordSchema.index({ requestId: 1, createdAt: -1 });

export default (mongoose.models.EmailRecord as mongoose.Model<IEmailRecord>) ||
  mongoose.model<IEmailRecord>("EmailRecord", EmailRecordSchema);
