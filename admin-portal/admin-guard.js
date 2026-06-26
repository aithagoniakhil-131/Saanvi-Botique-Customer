/**
 * Unified admin route protection for admin-portal pages.
 * Must load after admin-config.js
 */
(async function adminRouteGuard() {
  async function verifyAdminAccess() {
    if (sessionStorage.getItem("admin_session") === "authenticated") {
      return true;
    }

    if (!window.supabaseClient) {
      window.location.href = "../login.html";
      return false;
    }

    const {
      data: { session },
    } = await window.supabaseClient.auth.getSession();

    if (!session) {
      window.location.href = "../login.html";
      return false;
    }

    const { data: profile, error } = await window.supabaseClient
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (error || !profile || profile.role !== "admin") {
      await window.supabaseClient.auth.signOut();
      sessionStorage.removeItem("admin_session");
      window.location.href = "../login.html";
      return false;
    }

    sessionStorage.setItem("admin_session", "authenticated");
    return true;
  }

  window.verifyAdminAccess = verifyAdminAccess;

  window.adminLogout = async function adminLogout() {
    sessionStorage.clear();
    if (window.supabaseClient) {
      await window.supabaseClient.auth.signOut();
    }
    window.location.href = "../index.html";
  };

  // Backward-compatible alias used in some pages
  window.logout = window.adminLogout;

  const ok = await verifyAdminAccess();
  if (ok) {
    window.adminAuthenticated = true;
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        document.dispatchEvent(new CustomEvent("admin:authenticated"));
      });
    } else {
      document.dispatchEvent(new CustomEvent("admin:authenticated"));
    }
  }
})();
