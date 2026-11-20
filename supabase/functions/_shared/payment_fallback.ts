export type AttemptOutcome =
  | "PRE_DISPATCH_FAILURE"
  | "DECLINED_FINAL"
  | "ACCEPTED_PENDING"
  | "AMBIGUOUS"
  | "SETTLED"
  | "FAILED_FINAL";

export interface ProviderCandidate {
  provider_id: string;
  provider_code: string;
  priority: number;
  supports_idempotency: boolean;
  supports_status_lookup: boolean;
}

/**
 * A provider adapter must explicitly classify an outcome.
 * Never infer a final decline from a timeout, network error, generic 5xx,
 * or an unparsed provider response.
 */
export function isSafeToFallback(outcome: AttemptOutcome | null | undefined): boolean {
  return outcome === "PRE_DISPATCH_FAILURE" || outcome === "DECLINED_FINAL";
}

export function orderSafeCandidates<T extends ProviderCandidate>(candidates: T[]): T[] {
  return [...candidates]
    .filter((candidate) => candidate.supports_idempotency && candidate.supports_status_lookup)
    .sort((a, b) => a.priority - b.priority || a.provider_code.localeCompare(b.provider_code));
}

export function classifyTransportOutcome(input: {
  requestDispatched: boolean;
  timedOut?: boolean;
  transportLost?: boolean;
}): AttemptOutcome {
  if (!input.requestDispatched) return "PRE_DISPATCH_FAILURE";
  if (input.timedOut || input.transportLost) return "AMBIGUOUS";
  // A response received is not proof of settlement. The provider adapter
  // must map it to DECLINED_FINAL or ACCEPTED_PENDING after contract validation.
  return "AMBIGUOUS";
}
