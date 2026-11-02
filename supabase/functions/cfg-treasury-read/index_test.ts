import { sumNumeric8 } from "../_shared/decimal.ts";

Deno.test("sums NUMERIC(30,8) without IEEE-754 precision loss", () => {
  const result = sumNumeric8([
    "9007199254740993.00000001",
    "0.00000002",
    "6.99999997",
  ]);
  if (result !== "9007199254741000.00000000") {
    throw new Error(`Unexpected exact sum: ${result}`);
  }
});

Deno.test("handles empty and null values as exact zero", () => {
  if (sumNumeric8([]) !== "0.00000000") throw new Error("Empty sum mismatch");
  if (sumNumeric8([null, undefined, "0"]) !== "0.00000000") {
    throw new Error("Null sum mismatch");
  }
});

Deno.test("rejects values with more than eight decimal places", () => {
  let rejected = false;
  try { sumNumeric8(["1.000000001"]); } catch { rejected = true; }
  if (!rejected) throw new Error("Expected invalid precision to be rejected");
});

const rolePayload = {
  platform: { operational_state: "DEVELOPMENT" },
  issuance: {
    approved_request_cfg_total: "12.00000000",
    pending_request_cfg_total: "3.00000000",
    requests: [{ id: "private-request-1", requested_cfg_amount: "12" }]
  },
  audit_events: [{
    id: "event-1",
    actor_user_id: "user-secret",
    entity_id: "entity-secret",
    operation: "UPDATE",
    actor_db_role: "service_role"
  }]
};

Deno.test("TREASURY_VIEWER receives aggregates but no request records or audit events", async () => {
  const { scopeTreasuryReadPayload } = await import("../_shared/decimal.ts");
  const scoped = scopeTreasuryReadPayload("TREASURY_VIEWER", rolePayload);
  if (scoped.issuance.requests !== undefined) throw new Error("Viewer received individual issuance requests");
  if (scoped.audit_events !== undefined) throw new Error("Viewer received audit events");
  if (scoped.issuance.approved_request_cfg_total !== "12.00000000") throw new Error("Viewer aggregate missing");
});

Deno.test("FINANCIAL_CONTROLLER receives requests but audit actor/entity IDs are redacted", async () => {
  const { scopeTreasuryReadPayload } = await import("../_shared/decimal.ts");
  const scoped = scopeTreasuryReadPayload("FINANCIAL_CONTROLLER", rolePayload);
  if (scoped.issuance.requests?.length !== 1) throw new Error("Controller issuance records missing");
  const event = scoped.audit_events[0];
  if ("actor_user_id" in event || "entity_id" in event) throw new Error("Sensitive audit identifiers were not redacted");
  if (event.operation !== "UPDATE") throw new Error("Safe audit metadata was lost");
});

Deno.test("SUPER_ADMIN receives the complete read-only payload", async () => {
  const { scopeTreasuryReadPayload } = await import("../_shared/decimal.ts");
  const scoped = scopeTreasuryReadPayload("SUPER_ADMIN", rolePayload);
  if (scoped.issuance.requests?.length !== 1 || scoped.audit_events?.[0]?.actor_user_id !== "user-secret") {
    throw new Error("Super admin payload was unexpectedly restricted");
  }
});

Deno.test("unknown Treasury roles are rejected", async () => {
  const { scopeTreasuryReadPayload } = await import("../_shared/decimal.ts");
  let rejected = false;
  try { scopeTreasuryReadPayload("UNKNOWN_ROLE", rolePayload); } catch { rejected = true; }
  if (!rejected) throw new Error("Unknown role was accepted");
});
