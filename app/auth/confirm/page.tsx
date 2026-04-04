'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseAuth } from '@/lib/supabase-auth'

export default function AuthConfirmPage() {
  const router = useRouter()
  const attempted = useRef(false)

  useEffect(() => {
    if (attempted.current) return
    attempted.current = true

    async function handleAuth() {
      // Implicit flow: Supabase appends #access_token=...&refresh_token=...&type=magiclink to the redirect URL
      // The supabaseAuth client with detectSessionInUrl:true handles this automatically
      // We just need to wait for it and check the session

      // Give the client a moment to process the URL hash
      await new Promise(resolve => setTimeout(resolve, 500))

      const { data: { session }, error } = await supabaseAuth.auth.getSession()

      if (session && !error) {
        // Session established — go to dashboard
        router.replace('/account/dashboard')
        return
      }

      // If hash processing failed, try manual extraction as fallback
      if (typeof window !== 'undefined' && window.location.hash) {
        const hash = new URLSearchParams(window.location.hash.slice(1))
        const accessToken = hash.get('access_token')
        const refreshToken = hash.get('refresh_token')

        if (accessToken && refreshToken) {
          const { error: setError } = await supabaseAuth.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (!setError) {
            router.replace('/account/dashboard')
            return
          }
        }
      }

      // Nothing worked
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
