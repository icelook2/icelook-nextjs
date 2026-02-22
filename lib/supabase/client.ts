import { createBrowserClient } from "@supabase/ssr";

function getEnvVars() {
  const supabaseUrl = process.env.NEXT_PUBLIC_IL_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_IL_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_IL_SUPABASE_URL. Set it in .env.local for Next.js dev/build and in .dev.vars (or Wrangler vars/secrets) for Cloudflare preview/deploy.",
    );
  }

  if (!supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_IL_SUPABASE_ANON_KEY. Set it in .env.local for Next.js dev/build and in .dev.vars (or Wrangler vars/secrets) for Cloudflare preview/deploy.",
    );
  }

  return { supabaseUrl, supabaseAnonKey };
}

export function createClient() {
  const { supabaseUrl, supabaseAnonKey } = getEnvVars();
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
