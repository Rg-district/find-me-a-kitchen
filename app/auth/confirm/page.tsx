'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'

export default function AuthConfirmPage() {
  const router = useRouter()
  const attempted = useRef(false)

  useEffect(() => {
    if (attempted.current) return
    attempted.current = true

    async function handleAuth() {
      // Implicit flow: Supabase puts tokens in the URL hash (#access_token=...&refresh_token=...)
      if (typeof window !== 'undefined' && window.location.hash) {
        const hash = new URLSearchParams(window.location.hash.slice(1))
        const accessToken = hash.get('access_token')
        const refreshToken = hash.get('refresh_token')
        const type = hash.get('type')

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (!error) {
            // Clean URL then go to dashboard
            window.history.replaceState(null, '', '/auth/confirm')
            router.replace('/account/dashboard')
            return
          }
        }
      }

      // Fallback: check if already signed in
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        router.replace('/account/dashboard')
        return
      }

      router.replace('/account/login?error=link_expired')
    }

    handleAuth()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAF8F5' }}>
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Signing you in…</p>
      </div>
    </div>
  )
}
