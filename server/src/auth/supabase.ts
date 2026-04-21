import { createClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';

// ── Server-side Supabase client (service role) ────────────────────────────────
// Used for admin operations: create/delete users, bypass RLS, etc.

export const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

// ── Verify a JWT from Supabase Auth ──────────────────────────────────────────

export async function verifySupabaseToken(token: string) {
  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    return null;
  }

  return data.user;
}
