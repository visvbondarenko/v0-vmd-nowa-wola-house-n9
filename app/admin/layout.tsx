import Link from 'next/link'
import { Building2, LayoutDashboard, Building, Newspaper, MapPin, Users, Home as HomeIcon } from 'lucide-react'
import { AdminLogoutButton } from '@/components/admin/logout-button'
import { getCurrentRole } from '@/lib/auth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const role = await getCurrentRole()
  const isAuthenticated = role !== null
  const isManager = role === 'manager'

  return (
    <div className="min-h-screen bg-secondary/30">
      <nav className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-6">
              <Link
                href={isManager ? '/admin/units' : '/admin'}
                className="flex items-center gap-2 font-semibold text-foreground font-serif"
              >
                <Building2 className="h-5 w-5 text-primary" />
                Panel Administracyjny
                {isManager && (
                  <span className="text-xs font-normal text-muted-foreground ml-1">(manager)</span>
                )}
              </Link>
              {isAuthenticated && !isManager && (
                <Link href="/admin" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                  <LayoutDashboard className="h-4 w-4" />
                  Inwestycje
                </Link>
              )}
              {isAuthenticated && isManager && (
                <Link href="/admin/units" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                  <HomeIcon className="h-4 w-4" />
                  Działki
                </Link>
              )}
              {isAuthenticated && (
                <Link href="/admin/companies" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                  <Building className="h-4 w-4" />
                  Firmy
                </Link>
              )}
              {isAuthenticated && !isManager && (
                <>
                  <Link href="/admin/news" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                    <Newspaper className="h-4 w-4" />
                    Aktualności
                  </Link>
                  <Link href="/admin/about" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                    <MapPin className="h-4 w-4" />
                    O firmie
                  </Link>
                  <Link href="/admin/team" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                    <Users className="h-4 w-4" />
                    Zespół
                  </Link>
                </>
              )}
            </div>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
                ← Strona główna
              </Link>
              {isAuthenticated && <AdminLogoutButton />}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
