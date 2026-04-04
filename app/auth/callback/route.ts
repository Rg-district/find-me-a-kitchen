import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const tokenHash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')

  const redirectTo = new URL('/account/dashboard', requestUrl.origin)
  const errorRedirect = new URL('/account/login?error=auth_failed', requestUrl.origin)

  if (!code && !(tokenHash && type)) {
    return NextResponse.redirect(errorRedirect)
  }

  // Build response first — cookies get written to this response
  const response = NextResponse.redirect(redirectTo)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write to BOTH the request (for downstream) and the response (for browser)
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'magiclink' | 'email',
    })
    if (error) {
      console.error('verifyOtp error:', error.message)
      return NextResponse.redirect(errorRedirect)
    }
    return response
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('exchangeCodeForSession error:', error.message)
      return NextResponse.redirect(errorRedirect)
    }
    return response
  }

  return NextResponse.redirect(errorRedirect)
}
