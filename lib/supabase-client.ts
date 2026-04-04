import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vmuprcheuqnawtlzdyds.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// flowType: 'implicit' — magic links work across any browser/device
// PKCE requires code_verifier stored in the originating browser, which breaks
// when users open email links in a different browser or device
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'implicit',
  },
})
