export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ?? "https://ocviyqiwdxtrcjvfnyhv.supabase.co";

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jdml5cWl3ZHh0cmNqdmZueWh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDk0NzIsImV4cCI6MjA3NDM4NTQ3Mn0.VtNQGnupV71rXI7QcL9m9eavNe8y5y4DSdDAzb_k22Q";

export const getSupabaseServiceHeaders = () => ({
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
});
