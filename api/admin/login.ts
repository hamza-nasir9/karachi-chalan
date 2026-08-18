import { connectDB, isDBConfigured } from "../lib/db";
import AdminUser from "../models/AdminUser";
import { signToken, setAuthCookie, hashPassword } from "../lib/auth";
import { rateLimit, getClientIp } from "../lib/rateLimit";

const DEFAULT_ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin@karachiechallan.pk").toLowerCase();
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123";
const DEFAULT_ADMIN_NAME = process.env.ADMIN_NAME || "Verification Admin";

async function ensureDefaultAdmin() {
  if (!isDBConfigured()) return;
  try {
    await connectDB();
    const exists = await AdminUser.findOne({ email: DEFAULT_ADMIN_EMAIL });
    if (!exists) {
      const { hashPassword: hp } = await import("../lib/auth");
      const hash = await hp(DEFAULT_ADMIN_PASSWORD);
      await AdminUser.create({ email: DEFAULT_ADMIN_EMAIL, passwordHash: hash, name: DEFAULT_ADMIN_NAME });
      console.log(`[Admin] Seeded default admin ${DEFAULT_ADMIN_EMAIL}`);
    }
  } catch (e) {
    console.error("[Admin] ensureDefaultAdmin failed", e);
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, error: { message: "Method not allowed" } });

  const ip = getClientIp(req);
  const rl = rateLimit(`admin_login:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.allowed) {
    res.setHeader("Retry-After", String(Math.ceil(rl.retryAfterMs / 1000)));
    return res.status(429).json({ success: false, error: { code: "RATE_LIMITED", message: "Too many login attempts. Please try again in a few minutes." } });
  }

  let body: any = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!email || !password) return res.status(400).json({ success: false, error: { message: "Email and password are required." } });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ success: false, error: { message: "Enter a valid email." } });

  // If DB not configured, allow demo credential check (fallback for preview)
  if (!isDBConfigured()) {
    console.warn("[Admin Login] No DB — using demo credential check");
    if (email === DEFAULT_ADMIN_EMAIL && password === DEFAULT_ADMIN_PASSWORD) {
      const token = signToken({ email: DEFAULT_ADMIN_EMAIL, id: "demo" });
      setAuthCookie(res, token);
      return res.status(200).json({ success: true, data: { email: DEFAULT_ADMIN_EMAIL, name: DEFAULT_ADMIN_NAME } });
    }
    return res.status(401).json({ success: false, error: { message: "Invalid email or password." } });
  }

  try {
    await connectDB();
    await ensureDefaultAdmin();
    const user: any = await AdminUser.findOne({ email });
    if (!user) return res.status(401).json({ success: false, error: { message: "Invalid email or password." } });
    const { comparePassword } = await import("../lib/auth");
    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) return res.status(401).json({ success: false, error: { message: "Invalid email or password." } });
    const token = signToken({ email: user.email, id: String(user._id) });
    setAuthCookie(res, token);
    return res.status(200).json({ success: true, data: { email: user.email, name: user.name } });
  } catch (e: any) {
    console.error("[Admin Login] error", e);
    return res.status(500).json({ success: false, error: { message: "Internal error. Please try again." } });
  }
}
