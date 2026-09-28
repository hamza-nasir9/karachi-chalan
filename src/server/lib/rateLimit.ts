const store: Map<string, { count: number; reset: number }> = new Map();

export function rateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  let entry = store.get(key);
  if (!entry || now > entry.reset) {
    entry = { count: 0, reset: now + windowMs };
    store.set(key, entry);
  }
  entry.count += 1;
  const allowed = entry.count <= limit;
  const remaining = Math.max(0, limit - entry.count);
  const retryAfterMs = entry.reset - now;
  // cleanup occasionally
  if (store.size > 5000) {
    for (const [k, v] of store) if (now > v.reset) store.delete(k);
  }
  return { allowed, remaining, retryAfterMs };
}

export function getClientIp(req: any): string {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}
