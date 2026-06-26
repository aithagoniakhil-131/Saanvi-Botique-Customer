/**
 * Shared Supabase client configuration for Saanvi Boutique storefront.
 * Must load after @supabase/supabase-js CDN script.
 */
(function initStorefrontSupabase() {
  const SUPABASE_URL = "https://oemyhcypthjkuglixpso.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lbXloY3lwdGhqa3VnbGl4cHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNzY1NzIsImV4cCI6MjA5Nzc1MjU3Mn0.yUNMbk7bOch_bzG5ohDbPKI2F3_g36hXBjgM4YzYTk8";

  if (!window.supabase) {
    console.error("Supabase JS must be loaded before supabase-config.js");
    return;
  }

  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  // Alias for global accessibility
  window.supabase = window.supabaseClient;
})();
