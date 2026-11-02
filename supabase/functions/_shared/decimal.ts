// Exact fixed-scale arithmetic for PostgreSQL NUMERIC(30,8) values.
// Do not use Number for monetary or CFG supply aggregation.
export function sumNumeric8(values: Array<string | number | null | undefined>): string {
  const total = values.reduce((sum, raw) => {
    const value = String(raw ?? "0");
    if (!/^-?\d+(\.\d{1,8})?$/.test(value)) {
      throw new Error("Invalid NUMERIC(30,8) value returned by database");
    }
    const negative = value.startsWith("-");
    const unsigned = negative ? value.slice(1) : value;
    const [whole, fraction = ""] = unsigned.split(".");
    const scaled = BigInt(whole) * 100000000n + BigInt((fraction + "00000000").slice(0, 8));
    return sum + (negative ? -scaled : scaled);
  }, 0n);
  const negative = total < 0n;
  const absolute = negative ? -total : total;
  const whole = absolute / 100000000n;
  const fraction = (absolute % 100000000n).toString().padStart(8, "0");
  return `${negative ? "-" : ""}${whole.toString()}.${fraction}`;
}

export function scopeTreasuryReadPayload(role: string, source: Record<string, any>) {
  const payload = structuredClone(source);
  if (role === "TREASURY_VIEWER") {
    payload.issuance = {
      approved_request_cfg_total: payload.issuance?.approved_request_cfg_total ?? "0",
      pending_request_cfg_total: payload.issuance?.pending_request_cfg_total ?? "0",
      note: "Aggregate issuance totals only; individual requests are restricted."
    };
    delete payload.audit_events;
  } else if (role === "FINANCIAL_CONTROLLER") {
    payload.audit_events = (payload.audit_events ?? []).map((event: Record<string, unknown>) => {
      const { actor_user_id: _actor, entity_id: _entity, ...safe } = event;
      return safe;
    });
  } else if (role !== "SUPER_ADMIN") {
    throw new Error("Treasury role is not recognized");
  }
  return payload;
}
