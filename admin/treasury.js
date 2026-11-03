(() => {
  const config = window.CFG_SUPABASE_CONFIG;
  const loginCard = document.querySelector("#loginCard");
  const dashboard = document.querySelector("#dashboard");
  const loginMessage = document.querySelector("#loginMessage");
  const pageMessage = document.querySelector("#pageMessage");
  if (!config || !window.supabase?.createClient) {
    loginMessage.textContent = "Supabase public configuration is not available. Merge/configure the Practice authentication foundation first.";
    return;
  }
  const client = window.supabase.createClient(config.url, config.publishableKey);
  const fmt = (value, digits = 2) => new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits, maximumFractionDigits: digits
  }).format(Number(value || 0));
  const show = (id, value) => { document.querySelector("#" + id).textContent = value; };

  async function loadDashboard() {
    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError) throw sessionError;
    const session = sessionData.session;
    if (!session) {
      loginCard.classList.remove("hidden");
      dashboard.classList.add("hidden");
      return;
    }
    const response = await fetch(config.url + "/functions/v1/cfg-treasury-read", {
      method: "GET",
      headers: {
        "apikey": config.publishableKey,
        "Authorization": "Bearer " + session.access_token
      },
      cache: "no-store"
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Treasury access denied.");
    loginCard.classList.add("hidden");
    dashboard.classList.remove("hidden");
    show("viewerRole", data.viewer_role.replaceAll("_", " "));
    show("platformState", data.platform.operational_state);
    show("supplyCeiling", fmt(data.platform.authorized_supply_ceiling, 0) + " CFG");
    show("referenceValue", "USD " + fmt(data.platform.reference_value_usd));
    show("reserveValue", "USD " + fmt(data.reserve.verified_eligible_reserve_usd));
    show("approvedRequests", fmt(data.issuance.approved_request_cfg_total, 0) + " CFG");
    show("pendingRequests", fmt(data.issuance.pending_request_cfg_total, 0) + " CFG");
    const rows = document.querySelector("#countryRows");
    rows.replaceChildren();
    for (const country of data.countries) {
      const tr = document.createElement("tr");
      const values = [
        country.country_name + " (" + country.country_code + ")",
        country.local_currency_code,
        country.operational_state,
        country.verified_checks + " / " + country.total_checks,
        country.real_money_enabled ? "DISABLED BY GLOBAL GATE" : "DISABLED"
      ];
      for (const value of values) {
        const td = document.createElement("td");
        td.textContent = value;
        tr.appendChild(td);
      }
      rows.appendChild(tr);
    }
    show("updatedAt", "Snapshot: " + new Date(data.generated_at).toLocaleString() + " · Read-only · No transactions executed");
  }

  document.querySelector("#loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = event.currentTarget.querySelector("button[type=submit]");
    button.disabled = true;
    try {
      const { error } = await client.auth.signInWithPassword({
        email: document.querySelector("#email").value.trim(),
        password: document.querySelector("#password").value
      });
      if (error) throw error;
      await loadDashboard();
      loginMessage.textContent = "Signed in.";
    } catch (error) {
      loginMessage.textContent = error.message || "Sign-in failed.";
    } finally {
      button.disabled = false;
    }
  });
  document.querySelector("#signOut").addEventListener("click", async () => {
    const { error } = await client.auth.signOut();
    if (error) pageMessage.textContent = error.message;
    else await loadDashboard();
  });
  client.auth.onAuthStateChange(() => {
    setTimeout(() => loadDashboard().catch(error => {
      dashboard.classList.add("hidden");
      loginCard.classList.remove("hidden");
      loginMessage.textContent = error.message || "Treasury access is not available.";
    }), 0);
  });
  loadDashboard().catch(error => { loginMessage.textContent = error.message || "Could not load dashboard."; });
})();
