import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { sumNumeric8 } from "../_shared/decimal.ts";

const allowedOrigins = (Deno.env.get("CFG_ALLOWED_ORIGINS") ?? "").split(",").map((v) => v.trim()).filter(Boolean);
function subtractNumeric8(left: string, right: string): string {
  const toUnits = (v: string) => {
    if (!/^-?\d+(\.\d{1,8})?$/.test(v)) throw new Error("Invalid NUMERIC(30,8) value");
    const neg = v.startsWith("-"); const s = neg ? v.slice(1) : v;
    const [w, f = ""] = s.split(".");
    const n = BigInt(w) * 100000000n + BigInt((f + "00000000").slice(0, 8));
    return neg ? -n : n;
  };
  const n = toUnits(left) - toUnits(right), neg = n < 0n, a = neg ? -n : n;
  return `${neg ? "-" : ""}${a / 100000000n}.${(a % 100000000n).toString().padStart(8, "0")}`;
}

function scopeTreasuryReadPayload(role: string, source: Record<string, any>) {
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

function response(status: number, payload: Record<string, unknown>, origin?: string | null) {
  const headers: Record<string,string> = {"Content-Type":"application/json","Cache-Control":"no-store, max-age=0","Pragma":"no-cache","Vary":"Origin"};
  if (origin && allowedOrigins.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Headers"] = "authorization, apikey, content-type";
    headers["Access-Control-Allow-Methods"] = "GET, OPTIONS";
  }
  return new Response(JSON.stringify(payload), {status,headers});
}
Deno.serve(async (req: Request) => {
  const origin=req.headers.get("Origin");
  if (origin && !allowedOrigins.includes(origin)) return response(403,{error:"Origin is not allow-listed"},origin);
  if (req.method==="OPTIONS") return new Response("ok",{status:204,headers:{"Access-Control-Allow-Origin":origin??"","Access-Control-Allow-Headers":"authorization, apikey, content-type","Access-Control-Allow-Methods":"GET, OPTIONS","Vary":"Origin"}});
  if (req.method!=="GET") return response(405,{error:"Method not allowed"},origin);
  const url=Deno.env.get("SUPABASE_URL"), anon=Deno.env.get("SUPABASE_ANON_KEY"), service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url||!anon||!service) return response(503,{error:"Treasury read service is not configured"},origin);
  const authHeader=req.headers.get("Authorization")??"", token=authHeader.startsWith("Bearer ")?authHeader.slice(7):"";
  if (!token) return response(401,{error:"Sign in is required"},origin);
  const auth=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:authData,error:authError}=await auth.auth.getUser(token), user=authData?.user;
  if (authError||!user) return response(401,{error:"Invalid or expired session"},origin);
  if (!user.email_confirmed_at) return response(403,{error:"Verified email is required"},origin);
  const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:role,error:roleError}=await admin.from("cfg_admin_roles").select("role_name,is_active,expires_at").eq("user_id",user.id).maybeSingle();
  if (roleError) return response(503,{error:"Treasury authorization lookup failed"},origin);
  if (!role?.is_active||(role.expires_at&&new Date(role.expires_at).getTime()<=Date.now())) return response(403,{error:"Treasury dashboard access is not authorized"},origin);
  if (!["SUPER_ADMIN","FINANCIAL_CONTROLLER","TREASURY_VIEWER"].includes(role.role_name)) return response(403,{error:"Treasury role is not recognized"},origin);
  const [control,reserves,requests,countries,readiness,supply,reconciliations,auditEvents]=await Promise.all([
    admin.from("cfg_platform_control").select("operational_state,authorized_supply_ceiling,reference_value_usd,required_reserve_ratio,real_money_enabled").eq("singleton_id",1).single(),
    admin.from("cfg_reserve_assets").select("verified_usd_value,verification_status,reserve_eligible,funding_source,asset_type,verified_at,evidence_observed_at,evidence_valid_until,encumbered_usd_value"),
    admin.from("cfg_issuance_requests").select("id,request_reference,requested_cfg_amount,required_reserve_usd,status,financial_controller_id,financial_controller_approved_at,super_admin_id,super_admin_approved_at,approval_expires_at,created_at").order("created_at",{ascending:false}).limit(50),
    admin.from("cfg_countries").select("country_code,country_name,local_currency_code,operational_state,real_money_enabled"),
    admin.from("cfg_country_readiness_checks").select("country_code,check_code,status,expires_at"),
    admin.from("cfg_supply_position").select("issued_total,outstanding_supply,redeemed_total,encumbered_supply,updated_at").eq("singleton_id",1).maybeSingle(),
    admin.from("cfg_reserve_reconciliations").select("reconciliation_reference,status,reserve_gross_usd,reserve_encumbered_usd,reserve_eligible_net_usd,outstanding_cfg,required_reserve_usd,coverage_ratio,reserve_asset_count,stale_asset_count,created_at").order("created_at",{ascending:false}).limit(1),
    admin.from("cfg_treasury_audit_events").select("id,entity_table,entity_id,operation,actor_user_id,actor_db_role,occurred_at").order("occurred_at",{ascending:false}).limit(100)
  ]);
  if ([control,reserves,requests,countries,readiness,supply,reconciliations,auditEvents].some((r)=>r.error)) return response(503,{error:"Treasury data is unavailable; verify that all approved Treasury migrations are present."},origin);
  const now=Date.now();
  const eligible=(reserves.data??[]).filter((a)=>a.verification_status==="VERIFIED"&&a.reserve_eligible===true&&["COMPANY_CAPITAL","OPERATING_SURPLUS"].includes(a.funding_source)&&["BANK_CASH","BANK_DEPOSIT","SHORT_TERM_GOVERNMENT_SECURITY"].includes(a.asset_type)&&a.verified_at&&new Date(a.verified_at).getTime()<=now&&a.evidence_observed_at&&new Date(a.evidence_observed_at).getTime()<=now&&new Date(a.evidence_observed_at).getTime()>=now-7*86400000&&(!a.evidence_valid_until||new Date(a.evidence_valid_until).getTime()>now));
  const reserveGross=sumNumeric8(eligible.map(a=>a.verified_usd_value));
  const reserveEncumbered=sumNumeric8(eligible.map(a=>a.encumbered_usd_value));
  const issuance=requests.data??[];
  const approved=sumNumeric8(issuance.filter(i=>i.status==="APPROVED"&&(!i.approval_expires_at||new Date(i.approval_expires_at).getTime()>now)).map(i=>i.requested_cfg_amount));
  const pending=sumNumeric8(issuance.filter(i=>["DRAFT","PENDING_CONTROLLER","PENDING_SUPER_ADMIN"].includes(i.status)).map(i=>i.requested_cfg_amount));
  const countryRows=(countries.data??[]).map(c=>{
    const checks=(readiness.data??[]).filter(x=>x.country_code===c.country_code);
    const verified=checks.filter(x=>x.status==="VERIFIED"&&(!x.expires_at||new Date(x.expires_at).getTime()>now)).length;
    return {...c,verified_checks:verified,total_checks:14};
  });
  const payload={
    generated_at:new Date().toISOString(),viewer_role:role.role_name,platform:control.data,
    reserve:{verified_eligible_reserve_usd:reserveGross,encumbered_usd:reserveEncumbered,net_eligible_reserve_usd:subtractNumeric8(reserveGross,reserveEncumbered),verified_asset_count:eligible.length,evidence_window_days:7},
    supply:supply.data??{issued_total:"0",outstanding_supply:"0",redeemed_total:"0",encumbered_supply:"0",updated_at:null},
    issuance:{approved_request_cfg_total:approved,pending_request_cfg_total:pending,requests:issuance,note:"Approved requests are not issued CFG. Issuance execution remains disabled."},
    latest_reconciliation:(reconciliations.data??[])[0]??null,countries:countryRows,audit_events:auditEvents.data??[],
    safety:{real_money_apis_enabled:false,customer_deposits_enabled:false,withdrawals_enabled:false,cfg_issuance_enabled:false,redemptions_enabled:false,investment_payouts_enabled:false,custody_enabled:false,payment_integrations_enabled:false}
  };
  return response(200,scopeTreasuryReadPayload(role.role_name,payload),origin);
});