import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const token = await getToken({ req })

  if (!token) {
    const url = req.nextUrl.clone()
    url.pathname = '/'
    url.searchParams.set('toast', 'login')
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

// Protect every app route except the homepage and NextAuth API
export const config = {
  matcher: [
    '/analysis/:path*',
    '/results/:path*',
    '/history/:path*',
    '/report/:path*',
    '/guide/:path*',
    '/formats/:path*',
  ],
}
