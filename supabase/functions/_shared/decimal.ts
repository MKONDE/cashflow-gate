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
