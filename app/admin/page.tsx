import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, MapPin, Edit, Eye } from 'lucide-react'

export const dynamic = 'force-dynamic'

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  completed: 'bg-muted text-muted-foreground',
  planned: 'bg-blue-100 text-blue-800',
}

const statusLabels: Record<string, string> = {
  active: 'Aktywna',
  completed: 'Zakończona',
  planned: 'Planowana',
}

export default async function AdminDashboard() {
  const projects = await prisma.project.findMany({
    include: { units: { select: { status: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Inwestycje</h1>
          <p className="text-muted-foreground mt-1">Zarządzaj projektami deweloperskimi</p>
        </div>
        <Link href="/admin/projects/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Dodaj inwestycję
          </Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg">Brak inwestycji. Dodaj pierwszą!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const available = project.units.filter((u) => u.status === 'available').length
            const reserved = project.units.filter((u) => u.status === 'reserved').length
            const sold = project.units.filter((u) => u.status === 'sold').length
            const total = project.units.length

            return (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-serif">{project.name}</CardTitle>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[project.status] || statusColors.active}`}>
                      {statusLabels[project.status] || project.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {project.location}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-2">Działki ({total} łącznie)</p>
                    <div className="flex gap-2 flex-wrap">
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        {available} dostępnych
                      </Badge>
                      <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                        {reserved} zarezerwowanych
                      </Badge>
                      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                        {sold} sprzedanych
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/admin/projects/${project.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit className="h-3.5 w-3.5 mr-1.5" />
                        Edytuj
                      </Button>
                    </Link>
                    <Link href={`/projects/${project.slug}`} target="_blank">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
