import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function reply(status: number, payload: Record<string, unknown>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return reply(405, { error: "Method not allowed" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return reply(503, { error: "Practice service is not configured" });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return reply(401, { error: "Sign in is required" });

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  const user = authData?.user;

  if (authError || !user) return reply(401, { error: "Invalid or expired session" });
  if (!user.email_confirmed_at) {
    return reply(403, { error: "Verify your email before using Practice mode" });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return reply(400, { error: "Request body must be valid JSON" });
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
    return reply(400, { error: "Invalid practice trade details" });
  }

  if (action === "close" && !positionId) {
    return reply(400, { error: "Position ID is required to close a position" });
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
    const status = error.code === "P0002" ? 404 : error.code === "22023" ? 400 : 500;
    return reply(status, {
      error: status === 404
        ? "Open practice position not found"
        : status === 400
        ? "Practice trade details were rejected"
        : "Practice trade could not be saved",
    });
  }

  return reply(200, data ?? { ok: true });
});
