import Link from 'next/link'
import { Building2, LayoutDashboard } from 'lucide-react'
import { AdminLogoutButton } from '@/components/admin/logout-button'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-secondary/30">
      <nav className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-6">
              <Link href="/admin" className="flex items-center gap-2 font-semibold text-foreground font-serif">
                <Building2 className="h-5 w-5 text-primary" />
                Panel Administracyjny
              </Link>
              <Link href="/admin" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <LayoutDashboard className="h-4 w-4" />
                Inwestycje
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
                ← Strona główna
              </Link>
              <AdminLogoutButton />
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
