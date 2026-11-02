import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { parseIssuanceAction } from "../_shared/issuance_action.ts";
const allowedOrigins=(Deno.env.get("CFG_ALLOWED_ORIGINS")??"").split(",").map(v=>v.trim()).filter(Boolean);
function respond(status:number,payload:Record<string,unknown>,origin?:string|null){
 const headers:Record<string,string>={"Content-Type":"application/json","Cache-Control":"no-store, max-age=0","Pragma":"no-cache","Vary":"Origin"};
 if(origin&&allowedOrigins.includes(origin)){headers["Access-Control-Allow-Origin"]=origin;headers["Access-Control-Allow-Headers"]="authorization, apikey, content-type";headers["Access-Control-Allow-Methods"]="POST, OPTIONS";}
 return new Response(JSON.stringify(payload),{status,headers});
}
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("Origin");
 if(origin&&!allowedOrigins.includes(origin))return respond(403,{error:"Origin is not allow-listed"},origin);
 if(req.method==="OPTIONS")return new Response("ok",{status:204,headers:{"Access-Control-Allow-Origin":origin??"","Access-Control-Allow-Headers":"authorization, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin"}});
 if(req.method!=="POST")return respond(405,{error:"Method not allowed"},origin);
 const url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!url||!anon||!service)return respond(503,{error:"Issuance action service is not configured"},origin);
 const authHeader=req.headers.get("Authorization")??"",token=authHeader.startsWith("Bearer ")?authHeader.slice(7).trim():"";
 if(!token)return respond(401,{error:"Sign in is required"},origin);
 let body:unknown;
 try{const raw=await req.text();if(raw.length>16384)return respond(413,{error:"Request body is too large"},origin);body=JSON.parse(raw);}
 catch{return respond(400,{error:"A valid JSON body is required"},origin);}
 const action=parseIssuanceAction(body);
 if(!action)return respond(400,{error:"Unsupported or invalid issuance action"},origin);
 const auth=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:authData,error:authError}=await auth.auth.getUser(token),user=authData?.user;
 if(authError||!user)return respond(401,{error:"Invalid or expired session"},origin);
 if(!user.email_confirmed_at)return respond(403,{error:"Verified email is required"},origin);
 const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
 const requiredRole=action.type==="controller_approval"?"FINANCIAL_CONTROLLER":action.type==="super_admin_approval"?"SUPER_ADMIN":null;
 const {data:roleRows,error:roleError}=await admin.from("cfg_admin_roles").select("role_name,is_active,expires_at").eq("user_id",user.id).eq("is_active",true).in("role_name",action.type==="create_request"?["FINANCIAL_CONTROLLER","SUPER_ADMIN"]:[requiredRole!]);
 if(roleError)return respond(503,{error:"Treasury authorization lookup failed"},origin);
 const now=Date.now(),active=(roleRows??[]).filter(r=>!r.expires_at||new Date(r.expires_at).getTime()>now);
 const authorized=action.type==="create_request"?active.some(r=>["FINANCIAL_CONTROLLER","SUPER_ADMIN"].includes(r.role_name)):active.some(r=>r.role_name===requiredRole);
 if(!authorized)return respond(403,{error:"Your account does not have the required active Treasury role"},origin);
 let rpcName:string,rpcArgs:Record<string,unknown>;
 if(action.type==="create_request"){rpcName="cfg_create_issuance_request";rpcArgs={p_request_reference:action.request_reference,p_requested_cfg_amount:action.requested_cfg_amount,p_actor_user_id:user.id};}
 else if(action.type==="controller_approval"){rpcName="cfg_submit_issuance_controller_approval";rpcArgs={p_request_id:action.request_id,p_controller_user_id:user.id,p_reserve_reconciliation_id:action.reserve_reconciliation_id};}
 else{rpcName="cfg_submit_issuance_super_admin_approval";rpcArgs={p_request_id:action.request_id,p_super_admin_user_id:user.id};}
 const {data,error}=await admin.rpc(rpcName,rpcArgs);
 if(error){console.error("CFG issuance action RPC failed",{action:action.type,code:error.code});return respond(409,{error:"Issuance action was rejected by Treasury controls"},origin);}
 return respond(200,{ok:true,action:action.type,request_id:data},origin);
});
