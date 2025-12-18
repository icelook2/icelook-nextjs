import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getEnvVars() {
  const supabaseUrl = process.env.NEXT_PUBLIC_IL_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_IL_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_IL_SUPABASE_URL environment variable");
  }

  if (!supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_IL_SUPABASE_ANON_KEY environment variable",
    );
  }

  return { supabaseUrl, supabaseAnonKey };
}

export async function createClient() {
  const { supabaseUrl, supabaseAnonKey } = getEnvVars();
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      },
    },
  });
}
