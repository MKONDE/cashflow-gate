import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { orderSafeCandidates } from "../_shared/payment_fallback.ts";

const allowedOrigins = (Deno.env.get("CFG_ALLOWED_ORIGINS") ?? "")
  .split(",").map((value) => value.trim()).filter(Boolean);

function json(status: number, payload: Record<string, unknown>, origin?: string | null) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store, max-age=0",
    "Pragma": "no-cache",
    "Vary": "Origin",
  };
  if (origin && allowedOrigins.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Headers"] = "authorization, apikey, content-type";
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
  }
  return new Response(JSON.stringify(payload), { status, headers });
}

function validInput(value: unknown): value is {
  country_code: string;
  rail_code: string;
  currency_code: string;
  direction: "INBOUND" | "OUTBOUND";
} {
  if (!value || typeof value !== "object") return false;
  const input = value as Record<string, unknown>;
  return typeof input.country_code === "string" && /^[A-Z]{2}$/.test(input.country_code) &&
    typeof input.rail_code === "string" && /^[A-Z][A-Z0-9_]{1,31}$/.test(input.rail_code) &&
    typeof input.currency_code === "string" && /^[A-Z]{3}$/.test(input.currency_code) &&
    (input.direction === "INBOUND" || input.direction === "OUTBOUND");
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  if (origin && !allowedOrigins.includes(origin)) {
    return json(403, { error: "Origin is not allow-listed" });
  }
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin ?? "",
        "Access-Control-Allow-Headers": "authorization, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Vary": "Origin",
      },
    });
  }
  if (req.method !== "POST") return json(405, { error: "Method not allowed" }, origin);
  if (!req.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return json(415, { error: "application/json is required" }, origin);
  }

  const bodyText = await req.text();
  if (new TextEncoder().encode(bodyText).byteLength > 4096) {
    return json(413, { error: "Request body is too large" }, origin);
  }
  let body: unknown;
  try { body = JSON.parse(bodyText); } catch {
    return json(400, { error: "Invalid JSON" }, origin);
  }
  if (!validInput(body)) return json(400, { error: "Invalid country, rail, currency or direction" }, origin);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json(503, { error: "Payment route preview is not configured" }, origin);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return json(401, { error: "Sign in is required" }, origin);

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  const user = authData?.user;
  if (authError || !user) return json(401, { error: "Invalid or expired session" }, origin);
  if (!user.email_confirmed_at) return json(403, { error: "Verified email is required" }, origin);

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: role, error: roleError } = await admin
    .from("cfg_admin_roles")
    .select("role_name,is_active,expires_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (roleError) return json(503, { error: "Payment route authorization lookup failed" }, origin);
  if (!role?.is_active || !["SUPER_ADMIN", "FINANCIAL_CONTROLLER", "TREASURY_VIEWER"].includes(role.role_name) ||
      (role.expires_at && new Date(role.expires_at).getTime() <= Date.now())) {
    return json(403, { error: "Payment route preview is not authorized" }, origin);
  }

  const { data, error } = await admin.rpc("cfg_list_payment_route_candidates", {
    p_country_code: body.country_code,
    p_rail_code: body.rail_code,
    p_currency_code: body.currency_code,
    p_direction: body.direction,
  });
  if (error) return json(503, { error: "Country compliance or sandbox route configuration is unavailable" }, origin);

  const candidates = orderSafeCandidates((data ?? []).map((item: Record<string, unknown>) => ({
    provider_id: String(item.provider_id),
    provider_code: String(item.provider_code),
    display_name: String(item.display_name),
    priority: Number(item.priority),
    supports_idempotency: item.supports_idempotency === true,
    supports_status_lookup: item.supports_status_lookup === true,
  })));

  return json(200, {
    route_mode: "SANDBOX_PREVIEW_ONLY",
    payment_attempted: false,
    money_moved: false,
    live_payments_enabled: false,
    country_code: body.country_code,
    rail_code: body.rail_code,
    currency_code: body.currency_code,
    direction: body.direction,
    candidates,
    fallback_rule: "Fallback is allowed only after a confirmed pre-dispatch failure or provider-confirmed final decline. Timeout, transport loss after dispatch, accepted/pending, or unknown outcomes stop automatic fallback.",
    note: candidates.length
      ? "These are eligible sandbox route candidates only. No provider was contacted."
      : "No compliant sandbox route is currently configured. No provider was contacted.",
  }, origin);
});
