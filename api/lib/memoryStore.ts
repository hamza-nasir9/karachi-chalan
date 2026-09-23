// Shared in-memory fallback for preview when MONGODB_URI is not set.
// In production with MONGODB_URI configured, this is never used — MongoDB is the single source of truth.
// Using globalThis so it persists across serverless invocations in the same instance.
type MemRequest = any;
type MemEmail = any;

const g: any = globalThis as any;
if (!g.__ECV_MEM_REQUESTS__) g.__ECV_MEM_REQUESTS__ = [] as MemRequest[];
if (!g.__ECV_MEM_EMAILS__) g.__ECV_MEM_EMAILS__ = [] as MemEmail[];
if (g.__ECV_MEM_COUNTER__ == null) g.__ECV_MEM_COUNTER__ = 1244;

export function getMemRequests(): MemRequest[] { return g.__ECV_MEM_REQUESTS__ as MemRequest[]; }
export function getMemEmails(): MemEmail[] { return g.__ECV_MEM_EMAILS__ as MemEmail[]; }
export function nextMemRequestId(): string {
  g.__ECV_MEM_COUNTER__ += 1;
  const year = new Date().getFullYear();
  return `ECV-${year}-${String(g.__ECV_MEM_COUNTER__).padStart(6, "0")}`;
}
export function pushMemRequest(doc: any) { getMemRequests().unshift(doc); if (getMemRequests().length > 500) getMemRequests().length = 500; }
export function pushMemEmail(doc: any) { getMemEmails().unshift(doc); if (getMemEmails().length > 500) getMemEmails().length = 500; }
