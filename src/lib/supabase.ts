import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY

// Debug logging
// console.log('Environment check:')
// console.log('Supabase URL:', supabaseUrl)
// console.log('Anon Key exists:', !!supabaseAnonKey)
// console.log('All env vars:', import.meta.env)

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables!')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)