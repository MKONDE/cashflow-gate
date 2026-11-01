(() => {
  const config=window.CFG_SUPABASE_CONFIG, loginCard=document.querySelector("#loginCard"), dashboard=document.querySelector("#dashboard"), loginMessage=document.querySelector("#loginMessage"), pageMessage=document.querySelector("#pageMessage");
  if(!config||!window.supabase?.createClient){loginMessage.textContent="Supabase public configuration is not available. Configure the approved authentication foundation first.";return;}
  const client=window.supabase.createClient(config.url,config.publishableKey);
  const fmt=(raw,digits=2)=>{const s=String(raw??"0"),negative=s.startsWith("-"),v=negative?s.slice(1):s,[whole,fraction=""]=v.split(".");const grouped=whole.replace(/\B(?=(\d{3})+(?!\d))/g,",");return (negative?"-":"")+grouped+(digits? "."+(fraction+"00000000").slice(0,digits):"");};
  const show=(id,value)=>{document.querySelector("#"+id).textContent=value??"—";};
  const cell=(tr,value)=>{const td=document.createElement("td");td.textContent=value??"—";tr.appendChild(td);};
  async function loadDashboard(){
    const {data,error}=await client.auth.getSession();if(error)throw error;const session=data.session;
    if(!session){loginCard.classList.remove("hidden");dashboard.classList.add("hidden");return;}
    const response=await fetch(config.url+"/functions/v1/cfg-treasury-read",{method:"GET",headers:{apikey:config.publishableKey,Authorization:"Bearer "+session.access_token},cache:"no-store"});
    const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.error||"Treasury access denied.");
    loginCard.classList.add("hidden");dashboard.classList.remove("hidden");
    show("viewerRole",payload.viewer_role.replaceAll("_"," "));show("platformState",payload.platform.operational_state);
    show("supplyCeiling",fmt(payload.platform.authorized_supply_ceiling,0)+" CFG");show("referenceValue","USD "+fmt(payload.platform.reference_value_usd));
    show("reserveValue","USD "+fmt(payload.reserve.net_eligible_reserve_usd));show("approvedRequests",fmt(payload.issuance.approved_request_cfg_total,2)+" CFG");show("pendingRequests",fmt(payload.issuance.pending_request_cfg_total,2)+" CFG");
    const s=payload.supply;show("issuedTotal",fmt(s.issued_total,2)+" CFG");show("outstandingSupply",fmt(s.outstanding_supply,2)+" CFG");show("redeemedTotal",fmt(s.redeemed_total,2)+" CFG");show("encumberedSupply",fmt(s.encumbered_supply,2)+" CFG");show("supplyUpdated",s.updated_at?"Supply counters updated: "+new Date(s.updated_at).toLocaleString():"No supply counter update recorded.");
    const r=payload.latest_reconciliation;if(r){show("reconStatus",r.status);show("reconNet","USD "+fmt(r.reserve_eligible_net_usd));show("reconOutstanding",fmt(r.outstanding_cfg,2)+" CFG");show("reconStale",fmt(r.stale_asset_count,0));show("reconUpdated",r.reconciliation_reference+" · "+new Date(r.created_at).toLocaleString());}else{show("reconStatus","NO SNAPSHOT");show("reconNet","—");show("reconOutstanding","—");show("reconStale","—");show("reconUpdated","A reconciliation has not yet been recorded.");}
    const ir=document.querySelector("#issuanceRows");ir.replaceChildren();for(const item of payload.issuance.requests){const tr=document.createElement("tr");cell(tr,item.request_reference);cell(tr,fmt(item.requested_cfg_amount,2));cell(tr,item.status);cell(tr,item.financial_controller_approved_at?new Date(item.financial_controller_approved_at).toLocaleString():"Not approved");cell(tr,item.super_admin_approved_at?new Date(item.super_admin_approved_at).toLocaleString():"Not approved");cell(tr,item.approval_expires_at?new Date(item.approval_expires_at).toLocaleString():"—");ir.appendChild(tr);}
    const rows=document.querySelector("#countryRows");rows.replaceChildren();for(const c of payload.countries){const tr=document.createElement("tr");[c.country_name+" ("+c.country_code+")",c.local_currency_code,c.operational_state,c.verified_checks+" / "+c.total_checks,c.real_money_enabled?"ENABLED":"DISABLED"].forEach(v=>cell(tr,v));rows.appendChild(tr);}
    show("updatedAt","Snapshot: "+new Date(payload.generated_at).toLocaleString()+" · Read-only · No transactions executed");
  }
  document.querySelector("#loginForm").addEventListener("submit",async e=>{e.preventDefault();const b=e.currentTarget.querySelector("button[type=submit]");b.disabled=true;try{const {error}=await client.auth.signInWithPassword({email:document.querySelector("#email").value.trim(),password:document.querySelector("#password").value});if(error)throw error;await loadDashboard();loginMessage.textContent="Signed in.";}catch(error){loginMessage.textContent=error.message||"Sign-in failed.";}finally{b.disabled=false;}});
  document.querySelector("#signOut").addEventListener("click",async()=>{const {error}=await client.auth.signOut();if(error)pageMessage.textContent=error.message;else await loadDashboard();});
  client.auth.onAuthStateChange(()=>setTimeout(()=>loadDashboard().catch(error=>{dashboard.classList.add("hidden");loginCard.classList.remove("hidden");loginMessage.textContent=error.message||"Treasury access is unavailable.";}),0));
  loadDashboard().catch(error=>{loginMessage.textContent=error.message||"Could not load dashboard.";});
})();