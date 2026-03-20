'use client'

import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function AdminLogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <LogOut className="h-4 w-4" />
      Wyloguj
    </button>
  )
}
