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
    return res.status(200).json({ success: true, data: { total: 0, new: 0, inReview: 0, completed: 0, challanFound: 0, noChallanFound: 0, note: "DB not configured — in-memory stats not available via API" } });
  }
  try {
    await connectDB();
    const [total, neu, inReview, completed, challanFound, noChallanFound] = await Promise.all([
      VerificationRequest.countDocuments({}),
      VerificationRequest.countDocuments({ status: "NEW" }),
      VerificationRequest.countDocuments({ status: "IN_REVIEW" }),
      VerificationRequest.countDocuments({ status: "COMPLETED" }),
      VerificationRequest.countDocuments({ status: "CHALLAN_FOUND" }),
      VerificationRequest.countDocuments({ status: "NO_CHALLAN_FOUND" }),
    ]);
    return res.status(200).json({ success: true, data: { total, new: neu, inReview, completed, challanFound, noChallanFound } });
  } catch (e: any) {
    console.error("[Admin Stats] error", e);
    return res.status(500).json({ success: false, error: { message: "Failed to load stats" } });
  }
}
