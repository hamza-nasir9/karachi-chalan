import { getAuthUser } from "../lib/auth";
import { connectDB, isDBConfigured } from "../lib/db";
import AdminUser from "../models/AdminUser";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Token");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ success: false, error: { message: "Method not allowed" } });
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ success: false, error: { message: "Not authenticated" } });
  if (!isDBConfigured()) {
    return res.status(200).json({ success: true, data: { email: user.email, name: "Verification Admin" } });
  }
  try {
    await connectDB();
    const dbUser: any = await AdminUser.findOne({ email: user.email });
    if (!dbUser) return res.status(401).json({ success: false, error: { message: "User not found" } });
    return res.status(200).json({ success: true, data: { email: dbUser.email, name: dbUser.name } });
  } catch (e: any) {
    console.error("[Admin Me] error", e);
    return res.status(500).json({ success: false, error: { message: "Internal error" } });
  }
}
