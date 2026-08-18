import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { parse, serialize } from "cookie";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me-please-32-chars-minimum";
const COOKIE_NAME = "ecv_admin_token";
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8h

export function signToken(payload: object): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });
}

export function verifyToken(token: string): any {
  try { return jwt.verify(token, JWT_SECRET); } catch { return null; }
}

export function getTokenFromReq(req: any): string | null {
  // HttpOnly cookie first, then Authorization header fallback
  const cookies = parse(req.headers.cookie || "");
  if (cookies[COOKIE_NAME]) return cookies[COOKIE_NAME];
  const auth = req.headers.authorization || "";
  if (auth.startsWith("Bearer ")) return auth.slice(7);
  // also support x-admin-token for dev
  if (req.headers["x-admin-token"]) return req.headers["x-admin-token"];
  return null;
}

export function getAuthUser(req: any): { email: string; id?: string } | null {
  const token = getTokenFromReq(req);
  if (!token) return null;
  const decoded: any = verifyToken(token);
  if (!decoded) return null;
  return { email: decoded.email, id: decoded.id };
}

export function setAuthCookie(res: any, token: string) {
  const isProd = process.env.NODE_ENV === "production";
  res.setHeader("Set-Cookie", serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  }));
}

export function clearAuthCookie(res: any) {
  const isProd = process.env.NODE_ENV === "production";
  res.setHeader("Set-Cookie", serialize(COOKIE_NAME, "", {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  }));
}

export async function hashPassword(pw: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(pw, salt);
}
export async function comparePassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}

export function requireAdmin(req: any, res: any): { email: string } | null {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required. Please sign in." } });
    return null;
  }
  return user;
}
