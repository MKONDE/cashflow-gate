import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = (Deno.env.get("CFG_ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

function corsHeaders(origin: string | null): HeadersInit {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
  if (origin && allowedOrigins.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

function reply(status: number, payload: Record<string, unknown>, origin: string | null) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  if (!origin || allowedOrigins.length === 0 || !allowedOrigins.includes(origin)) {
    return new Response(JSON.stringify({ error: "Origin is not allowed" }), {
      status: 403,
      headers: { "Content-Type": "application/json", "Vary": "Origin" },
    });
  }
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(origin) });
  }
  if (req.method !== "POST") {
    return reply(405, { error: "Method not allowed" }, origin);
  }
  if (!(req.headers.get("Content-Type") ?? "").toLowerCase().startsWith("application/json")) {
    return reply(415, { error: "Content-Type must be application/json" }, origin);
  }
  const contentLength = Number(req.headers.get("Content-Length") ?? "0");
  if (contentLength > 16_384) {
    return reply(413, { error: "Request body is too large" }, origin);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return reply(503, { error: "Practice service is not configured" }, origin);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return reply(401, { error: "Sign in is required" }, origin);

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  const user = authData?.user;

  if (authError || !user) return reply(401, { error: "Invalid or expired session" }, origin);
  if (!user.email_confirmed_at) {
    return reply(403, { error: "Verify your email before using Practice mode" }, origin);
  }

  let body: Record<string, unknown>;
  try {
    const rawBody = await req.text();
    if (new TextEncoder().encode(rawBody).byteLength > 16_384) {
      return reply(413, { error: "Request body is too large" }, origin);
    }
    body = JSON.parse(rawBody) as Record<string, unknown>;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return reply(400, { error: "Request body must be a JSON object" }, origin);
    }
  } catch {
    return reply(400, { error: "Request body must be valid JSON" }, origin);
  }

  const action = body.action;
  const marketSymbol = typeof body.market_symbol === "string"
    ? body.market_symbol.trim().toUpperCase()
    : "";
  const price = Number(body.price);
  const virtualUnits = Number(body.virtual_units);
  const idempotencyKey = typeof body.idempotency_key === "string"
    ? body.idempotency_key.trim()
    : "";
  const positionId = typeof body.position_id === "string" ? body.position_id : null;

  if (
    (action !== "buy" && action !== "close") ||
    !/^[A-Z0-9._-]{2,20}$/.test(marketSymbol) ||
    !Number.isFinite(price) || price <= 0 ||
    !Number.isFinite(virtualUnits) || virtualUnits <= 0 ||
    idempotencyKey.length < 8 || idempotencyKey.length > 128
  ) {
    return reply(400, { error: "Invalid practice trade details" }, origin);
  }

  if (action === "close" && !positionId) {
    return reply(400, { error: "Position ID is required to close a position" }, origin);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await adminClient.rpc("record_practice_trade", {
    p_user_id: user.id,
    p_action: action,
    p_market_symbol: marketSymbol,
    p_price: price,
    p_virtual_units: virtualUnits,
    p_position_id: positionId,
    p_idempotency_key: idempotencyKey,
  });

  if (error) {
    // Keep database details and identifiers out of the public response.
    const status = error.code === "P0002" ? 404 : error.code === "22023" ? 400 : error.code === "P0001" ? 429 : 500;
    return reply(status, {
      error: status === 404
        ? "Open practice position not found"
        : status === 400
        ? "Practice trade details were rejected"
        : status === 429
        ? "Practice activity limit reached. Please wait before trying again."
        : "Practice trade could not be saved",
    }, origin);
  }

  return reply(200, data ?? { ok: true }, origin);
});
