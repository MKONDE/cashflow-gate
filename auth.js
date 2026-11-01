(() => {
  const cfg = window.CFG_SUPABASE_CONFIG;
  if (!cfg || !window.supabase?.createClient) {
    window.CFG_AUTH = { ready: false, error: "Supabase client did not load." };
    return;
  }
  const client = window.supabase.createClient(cfg.url, cfg.publishableKey);
  let currentSession = null;
  const status = (message, isError = false) => {
    const el = document.querySelector("#accountMessage");
    if (el) {
      el.textContent = message;
      el.classList.toggle("authError", isError);
    }
  };
  async function refreshSession() {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    currentSession = data.session;
    document.dispatchEvent(new CustomEvent("cfg-auth-change", {
      detail: { session: currentSession }
    }));
    const email = document.querySelector("#accountEmail");
    const signOut = document.querySelector("#signOut");
    const forms = document.querySelector("#authForms");
    if (email) email.textContent = currentSession?.user?.email || "Not signed in";
    if (signOut) signOut.hidden = !currentSession;
    if (forms) forms.hidden = !!currentSession;
    if (currentSession) status("Signed in. Practice records can be saved to your account.");
    return currentSession;
  }
  async function request(path, body) {
    const session = currentSession || await refreshSession();
    if (!session?.access_token) throw new Error("Please sign in first.");
    const response = await fetch(cfg.url + "/functions/v1/practice-trade", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": cfg.publishableKey,
        "Authorization": "Bearer " + session.access_token
      },
      body: JSON.stringify(body)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Practice request failed.");
    return result;
  }
  window.CFG_AUTH = {
    ready: true,
    client,
    get session() { return currentSession; },
    refreshSession,
    async signUp(email, password, displayName) {
      const { data, error } = await client.auth.signUp({
        email, password,
        options: {
          data: { display_name: displayName },
          emailRedirectTo: window.location.origin
        }
      });
      if (error) throw error;
      if (!data.session) return "Account created. Check your email and verify it before signing in.";
      await refreshSession();
      return "Account created and signed in.";
    },
    async signIn(email, password) {
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await refreshSession();
      return "Signed in successfully.";
    },
    async resetPassword(email) {
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin
      });
      if (error) throw error;
      return "Password reset link sent if the email address is registered.";
    },
    async signOut() {
      const { error } = await client.auth.signOut();
      if (error) throw error;
      await refreshSession();
      return "Signed out.";
    },
    recordTrade: body => request("practice-trade", body),
    async loadPractice() {
      const session = currentSession || await refreshSession();
      if (!session) return null;
      const [positions, events] = await Promise.all([
        client.from("practice_positions").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }),
        client.from("practice_events").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(50)
      ]);
      if (positions.error) throw positions.error;
      if (events.error) throw events.error;
      return { positions: positions.data || [], events: events.data || [] };
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#authForms");
    const mode = document.querySelector("#authMode");
    const name = document.querySelector("#displayName");
    const signUpOnly = document.querySelectorAll(".signUpOnly");
    const setMode = () => {
      const signup = mode?.value === "signup";
      signUpOnly.forEach(el => el.hidden = !signup);
      const submit = document.querySelector("#authSubmit");
      if (submit) submit.textContent = signup ? "Create account" : "Sign in";
    };
    mode?.addEventListener("change", setMode);
    setMode();
    form?.addEventListener("submit", async event => {
      event.preventDefault();
      const email = document.querySelector("#authEmail").value.trim();
      const password = document.querySelector("#authPassword").value;
      const displayName = name?.value.trim() || "";
      const submit = document.querySelector("#authSubmit");
      submit.disabled = true;
      try {
        const message = mode.value === "signup"
          ? await window.CFG_AUTH.signUp(email, password, displayName)
          : await window.CFG_AUTH.signIn(email, password);
        status(message);
      } catch (error) {
        status(error.message || "Authentication failed.", true);
      } finally {
        submit.disabled = false;
      }
    });
    document.querySelector("#forgotPassword")?.addEventListener("click", async () => {
      const email = document.querySelector("#authEmail").value.trim();
      if (!email) return status("Enter your email address first.", true);
      try { status(await window.CFG_AUTH.resetPassword(email)); }
      catch (error) { status(error.message || "Could not send reset link.", true); }
    });
    document.querySelector("#signOut")?.addEventListener("click", async () => {
      try { status(await window.CFG_AUTH.signOut()); }
      catch (error) { status(error.message || "Could not sign out.", true); }
    });
    client.auth.onAuthStateChange(() => {
      setTimeout(() => refreshSession().catch(error => status(error.message, true)), 0);
    });
    refreshSession().catch(error => status(error.message, true));
  });
})();