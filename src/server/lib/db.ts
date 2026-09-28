import mongoose from "mongoose";

/**
 * MongoDB connection (Mongoose), cached across warm serverless invocations.
 *
 * The connection string is read from the environment at call time — never
 * hard-coded. Set MONGODB_URI in `.env` locally and in
 * Vercel → Project Settings → Environment Variables for deployments.
 * (MONGO_URL is accepted as a fallback name.)
 */
function getMongoUri(): string {
  return (process.env.MONGODB_URI || process.env.MONGO_URL || "").trim();
}

type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const g = globalThis as unknown as { __ecvMongoose?: Cache };
const cached: Cache = g.__ecvMongoose || (g.__ecvMongoose = { conn: null, promise: null });

export function isDBConfigured(): boolean {
  return !!getMongoUri();
}

export async function connectDB(): Promise<typeof mongoose> {
  const uri = getMongoUri();
  if (!uri) throw new Error("MONGODB_URI is not set");
  // Reuse a live connection (readyState 1 = connected).
  if (cached.conn && mongoose.connection.readyState === 1) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000,
      maxPoolSize: 5,
    });
  }
  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e: any) {
    cached.promise = null;
    cached.conn = null;
    // Log the reason only — never the connection string (it contains credentials).
    console.error("[DB] Connect failed:", e?.message || e);
    throw e;
  }
}
