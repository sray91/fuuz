import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL or Anon Key is missing. Please check your environment variables.')
}

export const createBrowserSupabaseClientInstance = () =>
  createPagesBrowserClient({
    supabaseUrl,
    supabaseKey: supabaseAnonKey,
  })