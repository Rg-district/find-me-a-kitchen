import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vmuprcheuqnawtlzdyds.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Use createBrowserClient so sessions are stored in cookies,
// keeping them consistent with server-side SSR (middleware + route handlers).
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
