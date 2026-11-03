import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = (Deno.env.get("CFG_ALLOWED_ORIGINS") ?? "")
  .split(",").map((value) => value.trim()).filter(Boolean);

function response(status: number, payload: Record<string, unknown>, origin?: string | null) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store, max-age=0",
    "Pragma": "no-cache",
    "Vary": "Origin",
  };
  if (origin && allowedOrigins.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Headers"] = "authorization, apikey, content-type";
    headers["Access-Control-Allow-Methods"] = "GET, OPTIONS";
  }
  return new Response(JSON.stringify(payload), { status, headers });
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  if (origin && !allowedOrigins.includes(origin)) {
    return response(403, { error: "Origin is not allow-listed" });
  }
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin ?? "",
        "Access-Control-Allow-Headers": "authorization, apikey, content-type",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Vary": "Origin",
      },
    });
  }
  if (req.method !== "GET") return response(405, { error: "Method not allowed" }, origin);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return response(503, { error: "Treasury read service is not configured" }, origin);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return response(401, { error: "Sign in is required" }, origin);

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  const user = authData?.user;
  if (authError || !user) return response(401, { error: "Invalid or expired session" }, origin);
  if (!user.email_confirmed_at) {
    return response(403, { error: "Verified email is required" }, origin);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: role, error: roleError } = await admin
    .from("cfg_admin_roles")
    .select("role_name,is_active,expires_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (roleError) return response(503, { error: "Treasury authorization lookup failed" }, origin);
  if (!role?.is_active || (role.expires_at && new Date(role.expires_at).getTime() <= Date.now())) {
    return response(403, { error: "Treasury dashboard access is not authorized" }, origin);
  }

  const [controlResult, reserveResult, issuanceResult, countriesResult, readinessResult] = await Promise.all([
    admin.from("cfg_platform_control").select("operational_state,authorized_supply_ceiling,reference_value_usd,required_reserve_ratio,real_money_enabled").eq("singleton_id", 1).single(),
    admin.from("cfg_reserve_assets").select("verified_usd_value,verification_status,reserve_eligible,funding_source,verified_at"),
    admin.from("cfg_issuance_requests").select("requested_cfg_amount,required_reserve_usd,status"),
    admin.from("cfg_countries").select("country_code,country_name,local_currency_code,operational_state,real_money_enabled"),
    admin.from("cfg_country_readiness_checks").select("country_code,check_code,status,expires_at"),
  ]);

  if (controlResult.error || reserveResult.error || issuanceResult.error || countriesResult.error || readinessResult.error) {
    return response(503, { error: "Treasury data is unavailable; check migration status" }, origin);
  }

  const verifiedReserveUsd = (reserveResult.data ?? []).reduce((sum, asset) => {
    const current = !asset.verified_at || new Date(asset.verified_at).getTime() <= Date.now();
    const eligible = asset.verification_status === "VERIFIED" && asset.reserve_eligible === true &&
      ["COMPANY_CAPITAL", "OPERATING_SURPLUS"].includes(asset.funding_source) && current;
    return sum + (eligible ? Number(asset.verified_usd_value ?? 0) : 0);
  }, 0);

  const issuance = issuanceResult.data ?? [];
  const approvedCfgRequests = issuance.filter((item) => item.status === "APPROVED")
    .reduce((sum, item) => sum + Number(item.requested_cfg_amount), 0);
  const pendingCfgRequests = issuance.filter((item) =>
    ["DRAFT", "PENDING_CONTROLLER", "PENDING_SUPER_ADMIN"].includes(item.status))
    .reduce((sum, item) => sum + Number(item.requested_cfg_amount), 0);

  const countries = (countriesResult.data ?? []).map((country) => {
    const checks = (readinessResult.data ?? []).filter((item) => item.country_code === country.country_code);
    const verified = checks.filter((item) => item.status === "VERIFIED" &&
      (!item.expires_at || new Date(item.expires_at).getTime() > Date.now())).length;
    return {
      country_code: country.country_code,
      country_name: country.country_name,
      local_currency_code: country.local_currency_code,
      operational_state: country.operational_state,
      verified_checks: verified,
      total_checks: 14,
      real_money_enabled: country.real_money_enabled,
    };
  });

  return response(200, {
    generated_at: new Date().toISOString(),
    viewer_role: role.role_name,
    platform: controlResult.data,
    reserve: {
      verified_eligible_reserve_usd: verifiedReserveUsd,
      verified_asset_count: (reserveResult.data ?? []).filter((asset) =>
        asset.verification_status === "VERIFIED" && asset.reserve_eligible === true &&
        ["COMPANY_CAPITAL", "OPERATING_SURPLUS"].includes(asset.funding_source)).length,
    },
    issuance: {
      approved_request_cfg_total: approvedCfgRequests,
      pending_request_cfg_total: pendingCfgRequests,
      note: "Approved requests are not proof of issued supply; issuance execution is not implemented.",
    },
    countries,
    safety: {
      real_money_apis_enabled: false,
      customer_deposits_enabled: false,
      withdrawals_enabled: false,
      cfg_issuance_enabled: false,
      redemptions_enabled: false,
      investment_payouts_enabled: false,
      custody_enabled: false,
      payment_integrations_enabled: false,
    },
  }, origin);
});
