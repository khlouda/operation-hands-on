import { NextRequest, NextResponse } from 'next/server'

// Routes that require login
const PROTECTED = ['/instructor', '/dashboard', '/session']
// Routes only for guests (redirect logged-in users away)
const GUEST_ONLY = ['/login', '/register']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // We use a simple cookie set at login time to avoid calling Firebase in middleware
  // (Firebase SDK can't run in Edge runtime)
  const authCookie = req.cookies.get('auth-token')?.value
  const isLoggedIn = Boolean(authCookie)
  const isProtected = PROTECTED.some(p => pathname.startsWith(p))
  const isGuestOnly = GUEST_ONLY.some(p => pathname.startsWith(p))

  if (isProtected && !isLoggedIn) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (isGuestOnly && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/instructor/:path*', '/dashboard/:path*', '/session/:path*', '/login', '/register'],
}
