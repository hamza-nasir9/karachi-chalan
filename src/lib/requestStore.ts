/**
 * Request Store — Deprecated in production
 * All persistence is MongoDB via POST /api/requests.
 * This shim remains only to avoid import breakage in legacy code.
 * Do not use for new development — use apiClient.submitVerificationRequest.
 */

import type { CreateRequestInput, CreateRequestResult } from "./requestModel";

export async function createRequest(_input: CreateRequestInput): Promise<CreateRequestResult> {
  throw new Error("Use apiClient.submitVerificationRequest — MongoDB is single source of truth");
}
export function listRequests(): any[] {
  return [];
}
export function getRequestById(_id: string): any | undefined {
  return undefined;
}
