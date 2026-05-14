import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSessionRole, SESSION_COOKIE_NAME, type Role } from '@/lib/auth'

// Paths under /admin or /api/admin that must remain reachable without a valid
// session — otherwise the user could never log in or out.
const PUBLIC_ADMIN_PATHS = new Set<string>([
  '/admin/login',
  '/api/admin/auth/login',
  '/api/admin/auth/logout',
])

// Manager-allowed API prefixes. Specific methods are further restricted at
// the handler level (e.g. companies POST/PATCH/DELETE are admin-only).
const MANAGER_API_PREFIXES = [
  '/api/admin/units',
  '/api/admin/companies',
]

function isManagerAllowedPagePath(pathname: string): boolean {
  // Manager landing — units list/edit
  if (pathname === '/admin/units' || pathname.startsWith('/admin/units/')) return true
  // Companies list (read-only)
  if (pathname === '/admin/companies') return true
  // Allow only /admin/companies/<id>/view (read-only view) — block create/edit.
  const viewMatch = pathname.match(/^\/admin\/companies\/[^/]+\/view(\/.*)?$/)
  if (viewMatch) return true
  return false
}

function isManagerAllowedApiPath(pathname: string): boolean {
  return MANAGER_API_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))
}

function denyForRole(request: NextRequest, role: Role | null) {
  const { pathname } = request.nextUrl
  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      { error: role ? 'Forbidden' : 'Unauthorized' },
      { status: role ? 403 : 401 }
    )
  }
  if (!role) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/admin/login'
    loginUrl.search = ''
    loginUrl.searchParams.set('from', pathname + (request.nextUrl.search || ''))
    return NextResponse.redirect(loginUrl)
  }
  // Authenticated but lacking permission — bounce to manager landing.
  const url = request.nextUrl.clone()
  url.pathname = '/admin/units'
  url.search = ''
  return NextResponse.redirect(url)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Legacy dane.gov.pl URL rewrites ──────────────────────────────────────
  // dane.gov.pl polls these public paths daily. vercel.json rewrites cover
  // the common shapes, but the doubled extension `.xml.md5` and any path
  // quirks land here as a safety net. Runs before the admin gate.
  if (pathname.startsWith('/wp-content/uploads/raporty/') || pathname.startsWith('/raporty/')) {
    const prefix = pathname.startsWith('/wp-content/uploads/raporty/')
      ? '/wp-content/uploads/raporty/'
      : '/raporty/'
    const filename = pathname.slice(prefix.length)

    const md5Match = filename.match(/^(.+)-dataset\.md5$/)
    if (md5Match) {
      return NextResponse.rewrite(new URL(`/api/dane-gov/${md5Match[1]}?type=md5`, request.url))
    }
    const xmlMatch = filename.match(/^(.+)-dataset\.xml$/)
    if (xmlMatch) {
      return NextResponse.rewrite(new URL(`/api/dane-gov/${xmlMatch[1]}?type=xml`, request.url))
    }
    const csvMatch = filename.match(/^mieszkania-(.+)-(\d{4}-\d{2}-\d{2})\.csv$/)
    if (csvMatch) {
      return NextResponse.rewrite(
        new URL(`/api/dane-gov/${csvMatch[1]}?type=csv&date=${csvMatch[2]}`, request.url)
      )
    }
    return NextResponse.next()
  }

  if (PUBLIC_ADMIN_PATHS.has(pathname)) return NextResponse.next()

  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
    const role = await getSessionRole(token)
    if (!role) return denyForRole(request, null)

    if (role === 'admin') return NextResponse.next()

    // Manager: restrict to allow-listed paths.
    const allowed = pathname.startsWith('/api/')
      ? isManagerAllowedApiPath(pathname)
      : isManagerAllowedPagePath(pathname)
    if (!allowed) return denyForRole(request, role)

    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/wp-content/uploads/raporty/:path*',
    '/raporty/:path*',
  ],
}
