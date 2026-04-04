// Separate auth client using implicit flow
// @supabase/ssr's createBrowserClient forces PKCE which breaks cross-browser magic links
// This client is used ONLY for signInWithOtp — session reading uses the SSR client
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vmuprcheuqnawtlzdyds.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'implicit',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})
