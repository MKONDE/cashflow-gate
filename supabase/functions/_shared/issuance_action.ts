export type IssuanceAction =
  | { type: "create_request"; request_reference: string; requested_cfg_amount: string }
  | { type: "controller_approval"; request_id: string; reserve_reconciliation_id: string }
  | { type: "super_admin_approval"; request_id: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DECIMAL = /^(?:0|[1-9]\d{0,9})(?:\.\d{1,8})?$/;

export function parseIssuanceAction(value: unknown): IssuanceAction | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  if (input.action === "create_request") {
    if (typeof input.request_reference !== "string" || input.request_reference.trim().length < 1 || input.request_reference.trim().length > 100) return null;
    if (typeof input.requested_cfg_amount !== "string" || !DECIMAL.test(input.requested_cfg_amount)) return null;
    if (Number(input.requested_cfg_amount) <= 0 || Number(input.requested_cfg_amount) > 1_000_000_000) return null;
    return { type: "create_request", request_reference: input.request_reference.trim(), requested_cfg_amount: input.requested_cfg_amount };
  }
  if (input.action === "controller_approval") {
    if (typeof input.request_id !== "string" || !UUID.test(input.request_id)) return null;
    if (typeof input.reserve_reconciliation_id !== "string" || !UUID.test(input.reserve_reconciliation_id)) return null;
    return { type: "controller_approval", request_id: input.request_id, reserve_reconciliation_id: input.reserve_reconciliation_id };
  }
  if (input.action === "super_admin_approval") {
    if (typeof input.request_id !== "string" || !UUID.test(input.request_id)) return null;
    return { type: "super_admin_approval", request_id: input.request_id };
  }
  return null;
}
