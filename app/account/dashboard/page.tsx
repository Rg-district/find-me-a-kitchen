import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  // Next.js 14: cookies() is synchronous
  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            try { cookieStore.set(name, value, options) } catch { /* read-only in Server Components */ }
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/account/login')
  }

  // Fetch FMAK profile
  let { data: fmakUser } = await supabase
    .from('fmak_users')
    .select('*')
    .eq('email', user.email?.toLowerCase() ?? '')
    .single()

  if (!fmakUser) {
    // Auto-create minimal profile
    const { data: newUser } = await supabase
      .from('fmak_users')
      .insert({
        email: user.email?.toLowerCase() ?? '',
        name: (user.email ?? '').split('@')[0],
        location: 'UK',
        account_type: 'seeker',
        wants_alerts: false,
      })
      .select()
      .single()
    fmakUser = newUser
  }

  if (!fmakUser) {
    redirect('/account')
  }

  const { data: savedMatches } = await supabase
    .from('saved_matches')
    .select('*')
    .eq('user_id', fmakUser.id)
    .order('created_at', { ascending: false })
    .limit(10)

  return <DashboardClient user={fmakUser} savedMatches={savedMatches ?? []} />
}
