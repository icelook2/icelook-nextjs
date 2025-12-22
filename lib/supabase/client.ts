import { createBrowserClient } from "@supabase/ssr";

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

export function createClient() {
 const { supabaseUrl, supabaseAnonKey } = getEnvVars();
 return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
