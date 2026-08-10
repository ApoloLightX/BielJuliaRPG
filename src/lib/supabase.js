import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://xjbkvifjslllqdkwkymv.supabase.co";

const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "";

export const supabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase = createClient(
  supabaseUrl,
  supabaseKey || "missing-public-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
