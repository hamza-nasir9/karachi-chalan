import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IAdminUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  role: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const AdminUserSchema = new Schema<IAdminUser>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, default: 'admin' }
}, { timestamps: true, collection: "admin_users" });

// ✅ FIX: pre('save') with async/await and no next parameter
AdminUserSchema.pre('save', async function() {
  if (!this.isModified('passwordHash')) return;
  
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

// ✅ Compare password method
AdminUserSchema.methods.comparePassword = async function(password: string): Promise<boolean> {
  if (!this.passwordHash) return false;
  return bcrypt.compare(password, this.passwordHash);
};

export default (mongoose.models.AdminUser as mongoose.Model<IAdminUser>) ||
  mongoose.model<IAdminUser>("AdminUser", AdminUserSchema);