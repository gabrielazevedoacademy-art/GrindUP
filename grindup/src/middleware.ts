import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import ADMIN_EMAILS from '@/lib/admin'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isRoot = pathname === '/'
  const isProtected = pathname.startsWith('/dashboard') || pathname.startsWith('/admin')
  const isAuthPage = pathname === '/login' || pathname === '/cadastro'

  if (isRoot) {
    if (user) return NextResponse.redirect(new URL('/dashboard', request.url))
    return supabaseResponse
  }

  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Admin routes: require email in ADMIN_EMAILS
  if (pathname.startsWith('/admin') && user) {
    if (!ADMIN_EMAILS.includes(user.email ?? '')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  if (isAuthPage && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
