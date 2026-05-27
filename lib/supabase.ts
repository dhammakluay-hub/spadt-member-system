import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Browser Supabase client — session is stored in COOKIES
 * so the Next.js proxy (middleware) can read it server-side.
 */
let _client: SupabaseClient | null = null;
export function getSupabase(): SupabaseClient {
  if (!_client) {
    _client = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        // Use implicit flow (token in URL hash) instead of PKCE.
        // Why: PKCE requires the code_verifier cookie to live in the SAME
        // browser/device that requested the link. Recovery emails are often
        // opened on a different device (Gmail mobile → desktop, or vice
        // versa), which makes PKCE fail with "invalid code verifier".
        // Implicit flow encodes everything in the URL fragment so the
        // recovery link works cross-device.
        flowType: "implicit",
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return _client;
}

/** Alias for convenience */
export const createClient = getSupabase;
