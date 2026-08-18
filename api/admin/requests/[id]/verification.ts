import { connectDB, isDBConfigured } from "../../../lib/db";
import { requireAdmin } from "../../../lib/auth";
import VerificationRequest from "../../../models/VerificationRequest";

function sanitize(v: any, max: number): string | undefined {
  if (v == null || v === "") return undefined;
  let s = String(v).trim().replace(/[<>]/g, "").slice(0, max);
  return s || undefined;
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Token");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, error: { message: "Method not allowed" } });
  const admin = requireAdmin(req, res);
  if (!admin) return;
  if (!isDBConfigured()) return res.status(503).json({ success: false, error: { message: "Database not configured" } });
  const id = req.query.id as string;
  let body: any = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const outcome = String(body.outcome || "").trim();
  const validOutcomes = ["CHALLAN_FOUND","NO_CHALLAN_FOUND","UNABLE_TO_VERIFY","MORE_INFORMATION_REQUIRED"];
  if (!validOutcomes.includes(outcome)) {
    return res.status(400).json({ success: false, error: { message: "Invalid outcome. Choose: " + validOutcomes.join(", ") } });
  }
  // Validate per outcome
  if (outcome === "CHALLAN_FOUND") {
    const challanNumber = String(body.challanNumber || "").trim();
    if (!challanNumber || challanNumber.length < 4) return res.status(400).json({ success: false, error: { message: "Challan Number is required for Challan Found (≥4 chars)." } });
    if (challanNumber.length > 40) return res.status(400).json({ success: false, error: { message: "Challan Number too long." } });
    const fine = String(body.fineAmount || "").trim();
    if (fine && isNaN(Number(fine.replace(/[,Rs.\s]/g,"")))) return res.status(400).json({ success: false, error: { message: "Fine Amount must be a number." } });
  } else {
    const notes = String(body.notes || "").trim();
    if (!notes) {
      const msg = outcome === "MORE_INFORMATION_REQUIRED" ? "Describe what information is required." : outcome === "UNABLE_TO_VERIFY" ? "Provide the reason you were unable to verify." : "Add notes / explanation.";
      return res.status(400).json({ success: false, error: { message: msg } });
    }
    if (notes.length < 10) return res.status(400).json({ success: false, error: { message: "Provide a more detailed explanation (≥10 characters)." } });
    if (notes.length > 2000) return res.status(400).json({ success: false, error: { message: "Notes too long (max 2000)." } });
  }

  try {
    await connectDB();
    const doc: any = await VerificationRequest.findOne({ requestId: id });
    if (!doc) return res.status(404).json({ success: false, error: { message: "Request not found" } });
    // Build verification
    const verification: any = {
      outcome,
      challanNumber: sanitize(body.challanNumber, 40),
      violation: sanitize(body.violation, 120),
      challanDate: sanitize(body.challanDate, 20),
      challanTime: sanitize(body.challanTime, 10),
      location: sanitize(body.location, 120),
      fineAmount: sanitize(body.fineAmount, 20),
      dueDate: sanitize(body.dueDate, 20),
      paymentStatus: sanitize(body.paymentStatus, 20),
      referencePsid: sanitize(body.referencePsid, 60),
      notes: sanitize(body.notes, 2000),
      updatedAt: new Date(),
      updatedBy: admin.email,
    };
    const from = doc.status;
    doc.verification = verification;
    doc.status = outcome as any;
    doc.statusHistory.push({ from, to: outcome, changedAt: new Date(), changedBy: admin.email });
    await doc.save();
    return res.status(200).json({
      success: true,
      data: { requestId: doc.requestId, status: doc.status, verification: doc.verification, updatedAt: doc.updatedAt },
    });
  } catch (e: any) {
    console.error("[Admin Verification] error", e);
    return res.status(500).json({ success: false, error: { message: "Failed to save verification result" } });
  }
}
