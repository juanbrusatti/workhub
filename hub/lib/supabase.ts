import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase public environment variables")
}

let supabaseAdminClient: SupabaseClient | null = null

export const getSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  })
}

export const getSupabaseAdminClient = () => {
  if (typeof window !== "undefined") {
    throw new Error("Supabase admin client is only available on the server")
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase service role key")
  }

  if (!supabaseAdminClient) {
    supabaseAdminClient = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })
  }

  return supabaseAdminClient
}
