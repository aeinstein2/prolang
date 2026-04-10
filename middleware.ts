import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { UserRole } from '@/types'

const ROLE_ROUTES: Record<string, UserRole[]> = {
  '/admin': ['staff_admin'],
  '/translate': ['translator', 'staff_admin'],
  '/review': ['reviewer', 'staff_admin'],
  '/dashboard': ['customer', 'staff_admin', 'translator', 'reviewer'],
  '/jobs': ['customer', 'staff_admin', 'translator', 'reviewer'],
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Redirect unauthenticated users to login for protected routes
  const isProtectedRoute = Object.keys(ROLE_ROUTES).some(route =>
    pathname.startsWith(route)
  )

  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Role-based access control
  if (user && isProtectedRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role as UserRole | undefined

    for (const [route, allowedRoles] of Object.entries(ROLE_ROUTES)) {
      if (pathname.startsWith(route) && role && !allowedRoles.includes(role)) {
        // Redirect to appropriate dashboard based on role
        const redirectUrl = new URL(getRoleHomepage(role), request.url)
        return NextResponse.redirect(redirectUrl)
      }
    }
  }

  // Redirect authenticated users away from auth pages
  if (user && (pathname === '/auth/login' || pathname === '/auth/signup')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role as UserRole | undefined
    return NextResponse.redirect(new URL(getRoleHomepage(role || 'customer'), request.url))
  }

  return supabaseResponse
}

function getRoleHomepage(role: UserRole): string {
  switch (role) {
    case 'staff_admin':
      return '/admin'
    case 'translator':
      return '/dashboard'
    case 'reviewer':
      return '/dashboard'
    case 'customer':
    default:
      return '/dashboard'
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
