import {
  classifyTransportOutcome,
  isSafeToFallback,
  orderSafeCandidates,
} from "./payment_fallback.ts";

Deno.test("fallback is allowed only after definitive no-charge outcomes", () => {
  if (!isSafeToFallback("PRE_DISPATCH_FAILURE")) throw new Error("pre-dispatch failure should permit fallback");
  if (!isSafeToFallback("DECLINED_FINAL")) throw new Error("confirmed final decline should permit fallback");
  for (const outcome of ["ACCEPTED_PENDING", "AMBIGUOUS", "SETTLED", "FAILED_FINAL"] as const) {
    if (isSafeToFallback(outcome)) throw new Error(`${outcome} must block fallback`);
  }
  if (isSafeToFallback(null)) throw new Error("missing outcome must fail closed");
});

Deno.test("dispatched timeouts and lost transport are ambiguous, never fallback-safe", () => {
  const timeout = classifyTransportOutcome({ requestDispatched: true, timedOut: true });
  const lost = classifyTransportOutcome({ requestDispatched: true, transportLost: true });
  const notSent = classifyTransportOutcome({ requestDispatched: false });
  if (timeout !== "AMBIGUOUS" || lost !== "AMBIGUOUS") throw new Error("ambiguous transport result misclassified");
  if (notSent !== "PRE_DISPATCH_FAILURE") throw new Error("pre-dispatch failure misclassified");
  if (isSafeToFallback(timeout) || isSafeToFallback(lost)) throw new Error("ambiguous result must stop fallback");
});

Deno.test("provider candidates are filtered and ordered deterministically", () => {
  const ordered = orderSafeCandidates([
    { provider_id: "b", provider_code: "BETA", priority: 2, supports_idempotency: true, supports_status_lookup: true },
    { provider_id: "x", provider_code: "NO_LOOKUP", priority: 0, supports_idempotency: true, supports_status_lookup: false },
    { provider_id: "a", provider_code: "ALPHA", priority: 2, supports_idempotency: true, supports_status_lookup: true },
  ]);
  if (ordered.length !== 2 || ordered[0].provider_code !== "ALPHA" || ordered[1].provider_code !== "BETA") {
    throw new Error("candidate ordering/filtering failed");
  }
});
