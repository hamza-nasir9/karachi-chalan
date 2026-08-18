import { connectDB, isDBConfigured } from "../lib/db";
import { requireAdmin } from "../lib/auth";
import VerificationRequest from "../models/VerificationRequest";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Token");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ success: false, error: { message: "Method not allowed" } });
  const admin = requireAdmin(req, res);
  if (!admin) return;
  if (!isDBConfigured()) {
    // No DB: return empty; client will fallback/seeding only happens client-side now — API returns empty to avoid PII leak simulation
    return res.status(200).json({ success: true, data: { items: [], total: 0, page: 1, pageSize: 10 } });
  }
  try {
    await connectDB();
    const { search = "", status = "ALL", page = "1", pageSize = "10", sort = "newest" } = req.query || {};
    const p = Math.max(1, parseInt(String(page), 10) || 1);
    const ps = Math.max(5, Math.min(50, parseInt(String(pageSize), 10) || 10));
    const filter: any = {};
    if (status && status !== "ALL") filter.status = String(status);
    if (search && String(search).trim()) {
      const q = String(search).trim();
      const digits = q.replace(/\D/g, "");
      const or: any[] = [
        { requestId: { $regex: q, $options: "i" } },
        { fullName: { $regex: q, $options: "i" } },
        { vehicleRegistrationNumber: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
      if (digits) {
        or.push({ mobile: { $regex: digits, $options: "i" } });
        or.push({ cnic: { $regex: digits, $options: "i" } });
      }
      filter.$or = or;
    }
    const sortDir = sort === "oldest" ? 1 : -1;
    const total = await VerificationRequest.countDocuments(filter);
    const items = await VerificationRequest.find(filter)
      .sort({ createdAt: sortDir })
      .skip((p - 1) * ps)
      .limit(ps)
      .lean();
    // Sensitive data is allowed here because admin is authenticated server-side; client will still mask by default
    return res.status(200).json({ success: true, data: { items, total, page: p, pageSize: ps } });
  } catch (e: any) {
    console.error("[Admin Requests] error", e);
    return res.status(500).json({ success: false, error: { message: "Failed to load requests" } });
  }
}
