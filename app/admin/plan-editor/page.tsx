import PlanEditor from '@/components/admin/plan-editor'
import Link from 'next/link'
import { ArrowLeft, Map } from 'lucide-react'

export const metadata = { title: 'Edytor Planu — Panel Administracyjny' }

export default function PlanEditorPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" />
          Panel
        </Link>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2">
          <Map className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />
          <h1 className="text-2xl font-serif font-bold text-foreground">Edytor Planu Sytuacyjnego</h1>
        </div>
      </div>
      <PlanEditor />
    </div>
  )
}
