'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, Trash2, RefreshCw, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'

type CompanyUnit = {
  id: string
  label: string
  buildingLabel: string | null
  status: string
  area: number | null
  price: number | null
  project: { id: string; name: string; slug: string }
}

type AllUnit = {
  id: string
  label: string
  buildingLabel: string | null
  status: string
  area: number | null
  price: number | null
  companyId: string | null
  project: { id: string; name: string }
  company: { id: string; name: string } | null
}

type Company = {
  id: string
  name: string
  slug: string
  legalForm: string | null
  nip: string
  krs: string | null
  ceidg: string | null
  regon: string
  [key: string]: unknown
  lastXmlGeneratedAt: string | null
  lastXmlError: string | null
  units?: CompanyUnit[]
}

function Field({ label, name, value, onChange, placeholder }: {
  label: string
  name: string
  value: string
  onChange: (name: string, value: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
      <Input
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

function groupUnits(units: CompanyUnit[]) {
  const byProject = new Map<string, { project: { id: string; name: string; slug: string }; buildings: Map<string, CompanyUnit[]> }>()
  for (const u of units) {
    if (!byProject.has(u.project.id)) {
      byProject.set(u.project.id, { project: u.project, buildings: new Map() })
    }
    const bldg = u.buildingLabel || '—'
    const entry = byProject.get(u.project.id)!
    if (!entry.buildings.has(bldg)) entry.buildings.set(bldg, [])
    entry.buildings.get(bldg)!.push(u)
  }
  return byProject
}

export default function CompanyEditPage() {
  const router = useRouter()
  const params = useParams()
  const pathname = usePathname()
  // /admin/companies/new re-exports this component, so there's no [id] segment
  // and params.id is undefined. Detect via pathname instead.
  const isNew = pathname?.endsWith('/companies/new') ?? false
  const id = isNew ? '' : (params.id as string)

  const [form, setForm] = useState<Record<string, string>>({
    name: '', slug: '', legalForm: '', nip: '', krs: '', ceidg: '', regon: '',
    addrVoivodeship: '', addrCounty: '', addrMunicipality: '', addrCity: '',
    addrStreet: '', addrBuildingNr: '', addrUnitNr: '', addrPostalCode: '',
    salesVoivodeship: '', salesCounty: '', salesMunicipality: '', salesCity: '',
    salesStreet: '', salesBuildingNr: '', salesUnitNr: '', salesPostalCode: '',
    salesAdditional: '', salesContact: '',
    contactEmail: '', contactPhone: '', contactFax: '', contactPerson: '', websiteUrl: '',
    extIdent: '', xmlBasePath: '', csvBasePath: '',
  })
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [lastGenerated, setLastGenerated] = useState<string | null>(null)
  const [lastError, setLastError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [assignedUnitIds, setAssignedUnitIds] = useState<Set<string>>(new Set())
  const [forcedUnitIds, setForcedUnitIds] = useState<Set<string>>(new Set())
  const [assignedUnits, setAssignedUnits] = useState<CompanyUnit[]>([])
  const [allUnits, setAllUnits] = useState<AllUnit[]>([])
  const [expandedProject, setExpandedProject] = useState<string | null>(null)
  const [showSelector, setShowSelector] = useState(false)

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/admin/companies/${id}`)
        .then(r => r.json())
        .then((data: Company) => {
          const f: Record<string, string> = {}
          for (const key of Object.keys(form)) {
            const v = data[key]
            f[key] = typeof v === 'string' ? v : ''
          }
          setForm(f)
          setLastGenerated(data.lastXmlGeneratedAt)
          setLastError(data.lastXmlError)
          if (data.units) {
            setAssignedUnits(data.units)
            setAssignedUnitIds(new Set(data.units.map(u => u.id)))
            setForcedUnitIds(new Set())
          }
        })

      fetch('/api/admin/units')
        .then(r => r.json())
        .then((data: AllUnit[]) => setAllUnits(data))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isNew])

  const onChange = (name: string, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const toggleUnit = (unitId: string) => {
    setAssignedUnitIds(prev => {
      const next = new Set(prev)
      if (next.has(unitId)) {
        next.delete(unitId)
        setAssignedUnits(units => units.filter(u => u.id !== unitId))
      } else {
        next.add(unitId)
        const unit = allUnits.find(u => u.id === unitId)
        if (unit) {
          setAssignedUnits(units => [...units, {
            id: unit.id, label: unit.label, buildingLabel: unit.buildingLabel,
            status: unit.status, area: unit.area, price: unit.price,
            project: unit.project as CompanyUnit['project'],
          }])
        }
      }
      return next
    })
  }

  const takeoverProject = (projectId: string) => {
    const projectUnits = allUnits.filter(u => u.project.id === projectId)
    const newAssigned = new Set(assignedUnitIds)
    const newForced = new Set(forcedUnitIds)
    const newAssignedUnits = [...assignedUnits]
    for (const u of projectUnits) {
      newAssigned.add(u.id)
      if (u.companyId && u.companyId !== id) {
        newForced.add(u.id)
      }
      if (!assignedUnits.find(a => a.id === u.id)) {
        newAssignedUnits.push({
          id: u.id, label: u.label, buildingLabel: u.buildingLabel,
          status: u.status, area: u.area, price: u.price,
          project: u.project as CompanyUnit['project'],
        })
      }
    }
    setAssignedUnitIds(newAssigned)
    setForcedUnitIds(newForced)
    setAssignedUnits(newAssignedUnits)
  }

  const toggleBuilding = (projectId: string, buildingLabel: string, unitIds: string[]) => {
    const allAssigned = unitIds.every(uid => assignedUnitIds.has(uid))
    if (allAssigned) {
      unitIds.forEach(uid => {
        assignedUnitIds.delete(uid)
      })
      setAssignedUnitIds(new Set(assignedUnitIds))
      setAssignedUnits(units => units.filter(u => !unitIds.includes(u.id)))
    } else {
      const newIds = new Set(assignedUnitIds)
      const newUnits = [...assignedUnits]
      for (const uid of unitIds) {
        if (!newIds.has(uid)) {
          newIds.add(uid)
          const unit = allUnits.find(u => u.id === uid)
          if (unit) {
            newUnits.push({
              id: unit.id, label: unit.label, buildingLabel: unit.buildingLabel,
              status: unit.status, area: unit.area, price: unit.price,
              project: unit.project as CompanyUnit['project'],
            })
          }
        }
      }
      setAssignedUnitIds(newIds)
      setAssignedUnits(newUnits)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const url = isNew ? '/api/admin/companies' : `/api/admin/companies/${id}`
      const method = isNew ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          unitIds: [...assignedUnitIds],
          forceUnitIds: [...forcedUnitIds],
        }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to save')
      }
      const data = await res.json()
      if (isNew) {
        router.push(`/admin/companies/${data.id}`)
      } else {
        if (data.units) {
          setAssignedUnits(data.units)
          setAssignedUnitIds(new Set(data.units.map((u: CompanyUnit) => u.id)))
          setForcedUnitIds(new Set())
        }
        setMessage('Zapisano')
      }
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Błąd zapisu')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Czy na pewno chcesz usunąć tę firmę?')) return
    await fetch(`/api/admin/companies/${id}`, { method: 'DELETE' })
    router.push('/admin/companies')
  }

  const handleGenerate = async () => {
    setGenerating(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/companies/${id}/generate`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      setLastGenerated(new Date().toISOString())
      setLastError(null)
      setMessage('Raporty wygenerowane pomyślnie')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Generation failed'
      setLastError(msg)
      setMessage(`Błąd: ${msg}`)
    } finally {
      setGenerating(false)
    }
  }

  const availableByProject = new Map<string, { name: string; buildings: Map<string, AllUnit[]> }>()
  for (const u of allUnits) {
    if (!availableByProject.has(u.project.id)) {
      availableByProject.set(u.project.id, { name: u.project.name, buildings: new Map() })
    }
    const bldg = u.buildingLabel || '—'
    const entry = availableByProject.get(u.project.id)!
    if (!entry.buildings.has(bldg)) entry.buildings.set(bldg, [])
    entry.buildings.get(bldg)!.push(u)
  }

  const grouped = groupUnits(assignedUnits)

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/companies">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Powrót
          </Button>
        </Link>
        <h1 className="text-2xl font-serif font-bold text-foreground">
          {isNew ? 'Nowa firma' : 'Edytuj firmę'}
        </h1>
      </div>

      {message && (
        <div className={`mb-4 px-4 py-2 rounded text-sm ${message.startsWith('Błąd') ? 'bg-destructive/10 text-destructive' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dane podstawowe</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nazwa firmy" name="name" value={form.name} onChange={onChange} placeholder="Nowa Wola House sp. z o. o." />
            <Field label="Slug (URL)" name="slug" value={form.slug} onChange={onChange} placeholder="nowa-wola-house" />
            <Field label="Forma prawna" name="legalForm" value={form.legalForm} onChange={onChange} placeholder="SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ" />
            <Field label="NIP" name="nip" value={form.nip} onChange={onChange} placeholder="0000000000" />
            <Field label="KRS" name="krs" value={form.krs} onChange={onChange} />
            <Field label="CEiDG" name="ceidg" value={form.ceidg} onChange={onChange} />
            <Field label="REGON" name="regon" value={form.regon} onChange={onChange} placeholder="000000000" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Adres siedziby</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Field label="Województwo" name="addrVoivodeship" value={form.addrVoivodeship} onChange={onChange} />
            <Field label="Powiat" name="addrCounty" value={form.addrCounty} onChange={onChange} />
            <Field label="Gmina" name="addrMunicipality" value={form.addrMunicipality} onChange={onChange} />
            <Field label="Miejscowość" name="addrCity" value={form.addrCity} onChange={onChange} />
            <Field label="Ulica" name="addrStreet" value={form.addrStreet} onChange={onChange} />
            <Field label="Nr domu" name="addrBuildingNr" value={form.addrBuildingNr} onChange={onChange} />
            <Field label="Nr lokalu" name="addrUnitNr" value={form.addrUnitNr} onChange={onChange} />
            <Field label="Kod pocztowy" name="addrPostalCode" value={form.addrPostalCode} onChange={onChange} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Adres biura sprzedaży</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Field label="Województwo" name="salesVoivodeship" value={form.salesVoivodeship} onChange={onChange} />
            <Field label="Powiat" name="salesCounty" value={form.salesCounty} onChange={onChange} />
            <Field label="Gmina" name="salesMunicipality" value={form.salesMunicipality} onChange={onChange} />
            <Field label="Miejscowość" name="salesCity" value={form.salesCity} onChange={onChange} />
            <Field label="Ulica" name="salesStreet" value={form.salesStreet} onChange={onChange} />
            <Field label="Nr domu" name="salesBuildingNr" value={form.salesBuildingNr} onChange={onChange} />
            <Field label="Nr lokalu" name="salesUnitNr" value={form.salesUnitNr} onChange={onChange} />
            <Field label="Kod pocztowy" name="salesPostalCode" value={form.salesPostalCode} onChange={onChange} />
            <div className="md:col-span-2">
              <Field label="Dodatkowe miejsce sprzedaży" name="salesAdditional" value={form.salesAdditional} onChange={onChange} />
            </div>
            <div className="md:col-span-2">
              <Field label="Sposób kontaktu" name="salesContact" value={form.salesContact} onChange={onChange} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kontakt</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="E-mail" name="contactEmail" value={form.contactEmail} onChange={onChange} />
            <Field label="Telefon" name="contactPhone" value={form.contactPhone} onChange={onChange} />
            <Field label="Faks" name="contactFax" value={form.contactFax} onChange={onChange} />
            <Field label="Osoba kontaktowa" name="contactPerson" value={form.contactPerson} onChange={onChange} />
            <div className="md:col-span-2">
              <Field label="Strona WWW" name="websiteUrl" value={form.websiteUrl} onChange={onChange} />
            </div>
          </CardContent>
        </Card>

        {!isNew && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Przypisane działki</span>
                <span className="text-sm font-normal text-muted-foreground">{assignedUnitIds.size} działek</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[...grouped.entries()].map(([projectId, { project, buildings }]) => (
                <div key={projectId} className="border border-border rounded-lg">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40"
                    onClick={() => setExpandedProject(expandedProject === projectId ? null : projectId)}
                  >
                    <div className="flex items-center gap-2">
                      {expandedProject === projectId ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      <span className="font-medium text-sm">{project.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({[...buildings.values()].reduce((sum, units) => sum + units.length, 0)} działek)
                      </span>
                    </div>
                  </button>
                  {expandedProject === projectId && (
                    <div className="border-t border-border px-4 py-3 bg-muted/30 space-y-2">
                      {[...buildings.entries()].map(([bldg, units]) => (
                        <div key={bldg}>
                          <div className="text-xs font-medium text-muted-foreground mb-1">
                            Budynek: {bldg}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
                            {units.map(u => (
                              <div key={u.id} className="flex items-center justify-between text-xs bg-card rounded px-2 py-1 border border-border">
                                <span>{u.label}</span>
                                <span className={`ml-1 ${u.status === 'available' ? 'text-green-600' : u.status === 'reserved' ? 'text-yellow-600' : 'text-red-600'}`}>
                                  {u.price ? `${(u.price / 1000).toFixed(0)}k` : '—'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {assignedUnitIds.size === 0 && !showSelector && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Brak przypisanych działek. Przypisz działki aby generować raporty CSV.
                </p>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSelector(!showSelector)}
              >
                {showSelector ? 'Ukryj selektor' : 'Przypisz / usuń działki'}
              </Button>

              {showSelector && (
                <div className="border border-border rounded-lg p-4 bg-muted/30 space-y-4 max-h-[500px] overflow-y-auto">
                  <p className="text-xs text-muted-foreground">Zaznacz działki przypisane do tej firmy. Możesz zaznaczyć cały budynek.</p>
                  {[...availableByProject.entries()].map(([projectId, { name, buildings }]) => {
                    const projectUnits = allUnits.filter(u => u.project.id === projectId)
                    const otherCompanyCount = projectUnits.filter(u => u.companyId && u.companyId !== id && !assignedUnitIds.has(u.id)).length
                    return (
                    <div key={projectId}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-sm">{name}</div>
                        {otherCompanyCount > 0 && (
                          <button
                            type="button"
                            className="text-xs text-destructive border border-destructive/40 rounded px-2 py-0.5 hover:bg-destructive/10"
                            onClick={() => takeoverProject(projectId)}
                          >
                            Przejmij projekt ({otherCompanyCount} zajętych)
                          </button>
                        )}
                      </div>
                      {[...buildings.entries()].map(([bldg, units]) => {
                        const allChecked = units.every(u => assignedUnitIds.has(u.id))
                        const someChecked = units.some(u => assignedUnitIds.has(u.id))
                        return (
                          <div key={bldg} className="ml-3 mb-3">
                            <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={allChecked}
                                ref={el => { if (el) el.indeterminate = someChecked && !allChecked }}
                                onChange={() => toggleBuilding(projectId, bldg, units.map(u => u.id))}
                                className="rounded"
                              />
                              Budynek: {bldg} ({units.length} działek)
                              {units.some(u => u.companyId && u.companyId !== id) && (
                                <span className="text-orange-500 ml-1">(częściowo zajęty)</span>
                              )}
                            </label>
                            <div className="ml-5 grid grid-cols-2 md:grid-cols-4 gap-1">
                              {units.map(u => {
                                const otherCompany = u.companyId && u.companyId !== id && !assignedUnitIds.has(u.id)
                                return (
                                  <label
                                    key={u.id}
                                    className={`flex items-center gap-1.5 text-xs bg-card rounded px-2 py-1 border border-border cursor-pointer ${otherCompany ? 'opacity-50' : ''}`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={assignedUnitIds.has(u.id)}
                                      onChange={() => toggleUnit(u.id)}
                                      disabled={!!otherCompany}
                                      className="rounded"
                                    />
                                    <span>{u.label}</span>
                                    {u.price && <span className="text-muted-foreground ml-auto">{(u.price / 1000).toFixed(0)}k</span>}
                                    {otherCompany && u.company && (
                                      <span className="text-orange-500 text-[10px]">({u.company.name.substring(0, 10)}...)</span>
                                    )}
                                  </label>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Konfiguracja dane.gov.pl</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Identyfikator zewnętrzny (extIdent)" name="extIdent" value={form.extIdent} onChange={onChange} placeholder="DEWA-xxxxxxxx-xxxx-xxxx-xxxx" />
              <Field label="Ścieżka XML" name="xmlBasePath" value={form.xmlBasePath} onChange={onChange} placeholder="/wp-content/uploads/raporty/slug-dataset" />
              <div className="md:col-span-2">
                <Field label="Ścieżka CSV" name="csvBasePath" value={form.csvBasePath} onChange={onChange} placeholder="/wp-content/uploads/raporty/mieszkania-slug" />
              </div>
            </div>

            {!isNew && form.extIdent && (
              <div className="border-t border-border pt-4 mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Generowanie raportów</p>
                    {lastGenerated && (
                      <p className="text-xs text-muted-foreground">
                        Ostatnio: {new Date(lastGenerated).toLocaleString('pl-PL')}
                      </p>
                    )}
                    {lastError && (
                      <p className="text-xs text-destructive mt-1">{lastError}</p>
                    )}
                  </div>
                  <Button
                    onClick={handleGenerate}
                    disabled={generating}
                    variant="outline"
                    size="sm"
                  >
                    {generating ? (
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-1.5" />
                    )}
                    Generuj teraz
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1.5" />
            )}
            Zapisz
          </Button>
          {!isNew && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-1.5" />
              Usuń
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
