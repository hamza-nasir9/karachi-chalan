/**
 * Admin Auth — Production (MongoDB + HttpOnly cookie)
 * Source of truth is server-side JWT in HttpOnly cookie, NOT localStorage.
 * localStorage is only used as UI cache, never for auth decisions.
 * In production, every admin API is protected server-side via getAuthUser(req).
 */

export interface AdminUser {
  email: string;
  name: string;
}

// UI cache keys (not source of truth)
const USER_CACHE_KEY = "ecv_admin_user_cache_v2";

export function getCachedAdminUser(): AdminUser | null {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}
function setCachedUser(user: AdminUser | null) {
  try {
    if (user) localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_CACHE_KEY);
  } catch {}
}

// Legacy helper kept for compatibility but deprecated — use checkAuth()
export function isAuthenticated(): boolean {
  // DEPRECATED: synchronous local check is not source of truth.
  // For quick UI, check cache; real check is server-side via /api/admin/me.
  // We keep it for RequireAdmin fast path, but RequireAdmin also does async verification.
  try {
    return !!localStorage.getItem(USER_CACHE_KEY);
  } catch { return false; }
}
export function getAdminUser(): AdminUser | null {
  return getCachedAdminUser();
}

// Production login — hits server, sets HttpOnly cookie
export async function login(email: string, password: string): Promise<{ ok: boolean; error?: string; user?: AdminUser }> {
  const e = email.trim().toLowerCase();
  const p = password;
  if (!e || !p) return { ok: false, error: "Email and password are required." };
  try {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: e, password: p }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      return { ok: false, error: json?.error?.message || "Invalid email or password." };
    }
    const user: AdminUser = json.data;
    setCachedUser(user);
    return { ok: true, user };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Network error. Please try again." };
  }
}

// Server-side logout — clears HttpOnly cookie
export async function logout(): Promise<void> {
  try {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
  } catch {}
  setCachedUser(null);
  // Clear legacy keys if present
  try {
    localStorage.removeItem("ecv_admin_token_v1");
    localStorage.removeItem("ecv_admin_user_v1");
    localStorage.removeItem("ecv_admin_token_v2");
  } catch {}
}

// Server-side auth check — single source of truth
export async function checkAuth(): Promise<{ authenticated: boolean; user?: AdminUser; error?: string }> {
  try {
    const res = await fetch("/api/admin/me", { credentials: "include" });
    const json = await res.json().catch(() => null);
    if (res.ok && json?.success) {
      const user: AdminUser = json.data;
      setCachedUser(user);
      return { authenticated: true, user };
    }
    setCachedUser(null);
    return { authenticated: false, error: json?.error?.message || "Not authenticated" };
  } catch (err: any) {
    return { authenticated: false, error: err?.message || "Network error" };
  }
}

// Synchronous helper for displaying cached name (not for auth decisions)
export const ADMIN_CREDENTIALS = {
  email: "admin@karachiechallan.pk",
  password: "Admin@123", // only for demo fallback when DB not configured
};
