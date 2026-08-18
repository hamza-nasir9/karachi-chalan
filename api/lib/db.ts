import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL || "";

// Global cache for serverless
let cached = (global as any).mongoose;
if (!cached) cached = (global as any).mongoose = { conn: null, promise: null };

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!MONGODB_URI) {
    console.warn("[DB] MONGODB_URI not set — using in-memory fallback. Set MONGODB_URI for persistence.");
    return null;
  }
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    }).then((m) => m);
  }
  try {
    cached.conn = await cached.promise;
    console.log("[DB] Connected to MongoDB");
    return cached.conn;
  } catch (e) {
    console.error("[DB] Connect failed", e);
    cached.promise = null;
    throw e;
  }
}

export function isDBConfigured() {
  return !!MONGODB_URI;
}
