import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getCurrentRole } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Building, FileText, AlertCircle, CheckCircle2, Eye, Pencil } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CompaniesPage() {
  const role = await getCurrentRole()
  const isManager = role === 'manager'
  const companies = await prisma.company.findMany({
    include: {
      _count: { select: { units: true } },
      units: {
        select: { project: { select: { name: true } } },
        distinct: ['projectId'],
      },
    },
    orderBy: { name: 'asc' },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Firmy deweloperskie</h1>
          <p className="text-muted-foreground mt-1">Zarządzaj firmami i raportami dane.gov.pl</p>
        </div>
        {!isManager && (
          <Link href="/admin/companies/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Dodaj firmę
            </Button>
          </Link>
        )}
      </div>

      {companies.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Brak firm. Dodaj pierwszą!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => {
            const projectNames = [...new Set(company.units.map(u => u.project.name))]
            return (
              <Card key={company.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-serif">{company.name}</CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground">NIP: {company.nip}</p>
                  {company.regon && (
                    <p className="text-xs text-muted-foreground/80">REGON: {company.regon}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-2">
                      Inwestycje ({projectNames.length}) &middot; Działki ({company._count.units})
                    </p>
                    <div className="flex gap-1 flex-wrap">
                      {projectNames.map(name => (
                        <Badge key={name} variant="secondary" className="text-xs">
                          {name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    {company.extIdent ? (
                      <div className="flex items-center gap-1.5 text-xs">
                        <FileText className="h-3.5 w-3.5 text-blue-500" />
                        <span className="text-muted-foreground">dane.gov.pl: skonfigurowane</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span>dane.gov.pl: nieskonfigurowane</span>
                      </div>
                    )}
                    {company.lastXmlGeneratedAt && (
                      <div className="flex items-center gap-1.5 text-xs mt-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        <span className="text-muted-foreground">
                          Ostatni raport: {company.lastXmlGeneratedAt.toLocaleDateString('pl-PL')}
                        </span>
                      </div>
                    )}
                    {company.lastXmlError && (
                      <div className="flex items-center gap-1.5 text-xs mt-1">
                        <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                        <span className="text-destructive truncate">{company.lastXmlError}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/admin/companies/${company.id}/view`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                        Podgląd
                      </Button>
                    </Link>
                    {!isManager && (
                      <Link href={`/admin/companies/${company.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Pencil className="h-3.5 w-3.5 mr-1.5" />
                          Edytuj
                        </Button>
                      </Link>
                    )}
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
