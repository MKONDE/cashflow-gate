import { sumNumeric8 } from "./decimal.ts";

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
