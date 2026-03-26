'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'

export default function AuthConfirmPage() {
  const router = useRouter()
  const processed = useRef(false)

  useEffect(() => {
    if (processed.current) return
    processed.current = true

    const handleAuth = async () => {
      const url = new URL(window.location.href)
      const params = url.searchParams
      const hash = new URLSearchParams(window.location.hash.slice(1))

      // Method 1: token_hash + type (Supabase magic link format)
      const tokenHash = params.get('token_hash')
      const type = params.get('type') as 'magiclink' | 'email' | null

      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
        if (!error) {
          router.replace('/account/dashboard')
          return
        }
      }

      // Method 2: PKCE code exchange
      const code = params.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
          router.replace('/account/dashboard')
          return
        }
      }

      // Method 3: Hash-based access_token (implicit flow)
      const accessToken = hash.get('access_token')
      const refreshToken = hash.get('refresh_token')
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        if (!error) {
          router.replace('/account/dashboard')
          return
        }
      }

      // Method 4: Session already established — check and redirect
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.replace('/account/dashboard')
        return
      }

      // Listen for auth state change as final fallback
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          subscription.unsubscribe()
          router.replace('/account/dashboard')
        }
      })

      // Give up after 8s
      setTimeout(() => {
        subscription.unsubscribe()
        router.replace('/account/login')
      }, 8000)
    }

    handleAuth()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAF8F5' }}>
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Logging you in...</p>
      </div>
    </div>
  )
}
