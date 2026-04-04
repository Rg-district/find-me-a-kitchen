import { NextRequest, NextResponse } from 'next/server'

// This route just passes the code/token to the client-side handler
// PKCE code exchange MUST happen client-side (browser has the code_verifier)
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')

  if (error) {
    return NextResponse.redirect(
      new URL(`/account/login?error=${encodeURIComponent(error_description || error)}`, requestUrl.origin)
    )
  }

  // Redirect to client-side handler that has access to PKCE code_verifier
  const params = new URLSearchParams()
  if (code) params.set('code', code)
  if (token_hash) params.set('token_hash', token_hash)
  if (type) params.set('type', type)

  return NextResponse.redirect(
    new URL(`/auth/confirm?${params.toString()}`, requestUrl.origin)
  )
}
