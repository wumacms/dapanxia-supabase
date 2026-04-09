import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (typeof supabaseUrl !== 'string' || !supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

if (typeof supabaseKey !== 'string' || !supabaseKey) {
  throw new Error('Missing VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY environment variable');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
