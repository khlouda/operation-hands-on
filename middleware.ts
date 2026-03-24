import { NextRequest, NextResponse } from 'next/server'

// Routes that require login
const PROTECTED = ['/instructor', '/dashboard', '/session']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const authCookie = req.cookies.get('auth-token')?.value
  const isLoggedIn = Boolean(authCookie)
  const isProtected = PROTECTED.some(p => pathname.startsWith(p))

  if (isProtected && !isLoggedIn) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/instructor/:path*', '/dashboard/:path*', '/session/:path*'],
}
