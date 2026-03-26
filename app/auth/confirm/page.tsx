'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'

export default function AuthConfirmPage() {
  const router = useRouter()

  useEffect(() => {
    // Handle both hash-based tokens (OTP magic link) and code-based (PKCE)
    const handleAuth = async () => {
      // Check for hash fragment (access_token=... from magic link)
      const hash = window.location.hash
      if (hash && hash.includes('access_token')) {
        const { data, error } = await supabase.auth.getSession()
        if (data.session) {
          router.replace('/account/dashboard')
          return
        }
      }

      // Check for code param (PKCE flow)
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
          router.replace('/account/dashboard')
          return
        }
      }

      // Listen for auth state change (handles the hash token being processed)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          subscription.unsubscribe()
          router.replace('/account/dashboard')
        }
      })

      // Fallback — if nothing fires in 5s, go to login
      setTimeout(() => {
        router.replace('/account/login')
      }, 5000)
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
