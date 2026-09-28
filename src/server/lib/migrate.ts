import VerificationRequest from "../models/VerificationRequest.js";
import { LEGACY_RESULT_STATUSES } from "./services.js";

/**
 * One-time, idempotent upgrade of records written before multi-service support.
 *
 *  - requestType missing            -> CHECK_CHALLAN (they were all challan checks)
 *  - status CHALLAN_FOUND / NO_CHALLAN_FOUND / UNABLE_TO_VERIFY /
 *    MORE_INFORMATION_REQUIRED      -> RESULT_READY (the result itself is kept in verification.outcome)
 *
 * Uses the native collection so it is not blocked by the new status enum.
 * Runs at most once per server instance, on the first admin request.
 */
let done = false;
let running: Promise<void> | null = null;

export function migrateLegacyRequests(): Promise<void> {
  if (done) return Promise.resolve();
  if (running) return running;
  running = (async () => {
    try {
      const col = VerificationRequest.collection;
      await col.updateMany({ requestType: { $exists: false } }, { $set: { requestType: "CHECK_CHALLAN" } });
      await col.updateMany({ status: { $in: LEGACY_RESULT_STATUSES } }, { $set: { status: "RESULT_READY" } });
      done = true;
    } catch (e) {
      console.error("[migrate] legacy request upgrade failed", e);
    } finally {
      running = null;
    }
  })();
  return running;
}
