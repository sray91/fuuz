import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session && req.nextUrl.pathname.startsWith('/protected')) {
    return NextResponse.redirect(new URL('/signin', req.url))
  }

  return res
}

export const config = {
  matcher: ['/protected/:path*'],
}