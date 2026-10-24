/**
 * Shared Supabase client for all admin-portal pages.
 * Must load after @supabase/supabase-js CDN script.
 */
(function initAdminSupabase() {
  const SUPABASE_URL = "https://lotbotypgykkovckrzah.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvdGJvdHlwZ3lra292Y2tyemFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4NDk0MzQsImV4cCI6MjEwODQyNTQzNH0.5uMYuNXh_oBp54ljr666bSf5Qjk7CqYK2WQ8bSHKTX8";

  if (!window.supabase) {
    console.error("Supabase JS must be loaded before admin-config.js");
    return;
  }

  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  // Alias used by some admin pages
  window.supabase = window.supabaseClient;
})();
