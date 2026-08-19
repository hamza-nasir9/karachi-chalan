import mongoose, { Schema, Document } from "mongoose";

export interface IEmailRecord extends Document {
  to: string;
  subject: string;
  type: string;
  sentAt: Date;
  messageId?: string | null;
  requestId?: string;
  body?: string;
  html?: string | null;
  templateId?: string | null;
  resultType?: string;
  status?: string;
  sentBy?: string;
  error?: string;
}

const EmailRecordSchema = new Schema<IEmailRecord>({
  to: { type: String, required: true },
  subject: { type: String, required: true },
  type: { type: String, default: "manual" },
  sentAt: { type: Date, default: Date.now },
  messageId: { type: String },
  requestId: { type: String, index: true },
  body: { type: String },
  html: { type: String },
  templateId: { type: String },
  resultType: { type: String },
  status: { type: String, default: "SENT" },
  sentBy: { type: String },
  error: { type: String },
}, { timestamps: true, collection: "email_records" });

EmailRecordSchema.index({ requestId: 1, createdAt: -1 });

export default (mongoose.models.EmailRecord as mongoose.Model<IEmailRecord>) ||
  mongoose.model<IEmailRecord>("EmailRecord", EmailRecordSchema);
