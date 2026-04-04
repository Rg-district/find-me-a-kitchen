'use client'

import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'

export default function AuthConfirmPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const attempted = useRef(false)

  useEffect(() => {
    if (attempted.current) return
    attempted.current = true

    async function handleAuth() {
      const code = searchParams.get('code')
      const token_hash = searchParams.get('token_hash')
      const type = searchParams.get('type')

      try {
        // Try PKCE code exchange first (client-side has the verifier)
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (!error) {
            router.replace('/account/dashboard')
            return
          }
          console.error('Code exchange failed:', error.message)
        }

        // Try token_hash OTP verify (doesn't need PKCE verifier)
        if (token_hash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as 'magiclink' | 'email',
          })
          if (!error) {
            router.replace('/account/dashboard')
            return
          }
          console.error('OTP verify failed:', error.message)
        }

        // Nothing worked
        router.replace('/account/login?error=auth_failed')
      } catch (err) {
        console.error('Auth confirm error:', err)
        router.replace('/account/login?error=auth_failed')
      }
    }

    handleAuth()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAF8F5' }}>
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Signing you in…</p>
      </div>
    </div>
  )
}
