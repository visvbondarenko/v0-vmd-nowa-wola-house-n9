'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Save, Trash2, Plus, ExternalLink, RotateCcw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { HouseTypesManager } from '@/components/admin/house-types-manager'
import AdminPlanEditor from '@/components/admin/admin-plan-editor'
import { AdminPlanViewEditor } from '@/components/admin/admin-plan-view-editor'

type Unit = {
  id: string
  svgElementId: string
  label: string
  status: string
  stage: string | null
  area: number | null
  gardenArea: number | null
  floor: string | null
  rooms: number | null
  floors: number | null
  buildingLabel: string | null
  price: number | null
  description: string | null
  houseTypeId: string | null
}

type Project = {
  id: string
  name: string
  slug: string
  location: string
  description: string | null
  svgContent: string | null
  imageUrl: string | null
  planImageUrl: string | null
  status: string
  units: Unit[]
  houseTypes: Array<{
    id: string
    name: string
    totalArea: number | null
    floorPlans: Array<{
      id: string
      name: string
      area: number | null
      image3dUrl: string | null
      image2dUrl: string | null
      rooms: Array<{ id: string; name: string; area: number | null; number: number | null }>
    }>
  }>
}

export default function EditProjectPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showAddUnit, setShowAddUnit] = useState(false)
  const [newUnit, setNewUnit] = useState({
    svgElementId: '', label: '', status: 'available',
    area: '', rooms: '', floors: '', price: '', description: '',
    stage: '', gardenArea: '', floor: '', houseTypeId: ''
  })
  const [addingUnit, setAddingUnit] = useState(false)

  const fetchProject = useCallback(async () => {
    const res = await fetch(`/api/admin/projects/${id}`)
    if (res.ok) {
      const data = await res.json()
      setProject(data)
    }
    setLoading(false)
  }, [id])

  useEffect(() => { fetchProject() }, [fetchProject])

  const handleSaveDetails = async () => {
    if (!project) return
    setSaving(true)
    setError('')
    const res = await fetch(`/api/admin/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: project.name,
        slug: project.slug,
        location: project.location,
        description: project.description,
        status: project.status,
        imageUrl: project.imageUrl,
      }),
    })
    if (res.ok) {
      setSuccess('Zapisano!')
      setTimeout(() => setSuccess(''), 3000)
    } else {
      setError('Błąd zapisu')
    }
    setSaving(false)
  }

  const handleUnitStatusChange = async (unitId: string, status: string) => {
    await fetch(`/api/admin/units/${unitId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setProject((p) =>
      p ? { ...p, units: p.units.map((u) => u.id === unitId ? { ...u, status } : u) } : p
    )
  }

  const handleDeleteUnit = async (unitId: string) => {
    if (!confirm('Usuń tę działkę?')) return
    await fetch(`/api/admin/units/${unitId}`, { method: 'DELETE' })
    setProject((p) =>
      p ? { ...p, units: p.units.filter((u) => u.id !== unitId) } : p
    )
  }

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingUnit(true)
    const res = await fetch('/api/admin/units', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: id,
        svgElementId: newUnit.svgElementId,
        label: newUnit.label || newUnit.svgElementId,
        status: newUnit.status,
        area: newUnit.area ? parseFloat(newUnit.area) : null,
        rooms: newUnit.rooms ? parseInt(newUnit.rooms) : null,
        floors: newUnit.floors ? parseInt(newUnit.floors) : null,
        price: newUnit.price ? parseInt(newUnit.price) : null,
        description: newUnit.description || null,
        stage: newUnit.stage || null,
        gardenArea: newUnit.gardenArea ? parseFloat(newUnit.gardenArea) : null,
        floor: newUnit.floor || null,
        houseTypeId: newUnit.houseTypeId || null,
      }),
    })
    if (res.ok) {
      await fetchProject()
      setShowAddUnit(false)
      setNewUnit({ svgElementId: '', label: '', status: 'available', area: '', rooms: '', floors: '', price: '', description: '', stage: '', gardenArea: '', floor: '', houseTypeId: '' })
    }
    setAddingUnit(false)
  }

  const handleDeleteProject = async () => {
    if (!confirm(`Usuń projekt "${project?.name}"? Tej operacji nie można cofnąć.`)) return
    if (!confirm(`Potwierdź ponownie: trwale usuń projekt "${project?.name}" wraz ze wszystkimi działkami i danymi?`)) return
    await fetch(`/api/admin/projects/${id}`, { method: 'DELETE' })
    router.push('/admin')
  }

  const handleUnitFieldUpdate = async (unitId: string, field: string, value: string | number | null) => {
    await fetch(`/api/admin/units/${unitId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    })
  }

  if (loading) return <div className="flex items-center justify-center py-20 text-muted-foreground">Ładowanie...</div>
  if (!project) return <div className="text-center py-20 text-muted-foreground">Nie znaleziono projektu</div>

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Powrót
          </Button>
        </Link>
        <h1 className="text-3xl font-serif font-bold text-foreground">{project.name}</h1>
        <Link href={`/projects/${project.slug}`} target="_blank">
          <Button variant="outline" size="sm">
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            Podgląd publiczny
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto text-destructive border-destructive/20 hover:bg-destructive/10"
          onClick={handleDeleteProject}
        >
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          Usuń projekt
        </Button>
      </div>

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}
      {error && (
        <div className="mb-4 bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Informacje podstawowe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nazwa</Label>
                  <Input
                    value={project.name}
                    onChange={(e) => setProject((p) => p ? { ...p, name: e.target.value } : p)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug URL</Label>
                  <Input
                    value={project.slug}
                    onChange={(e) => setProject((p) => p ? { ...p, slug: e.target.value } : p)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Lokalizacja</Label>
                <Input
                  value={project.location}
                  onChange={(e) => setProject((p) => p ? { ...p, location: e.target.value } : p)}
                />
              </div>
              <div className="space-y-2">
                <Label>URL zdjęcia</Label>
                <Input
                  value={project.imageUrl || ''}
                  onChange={(e) => setProject((p) => p ? { ...p, imageUrl: e.target.value } : p)}
                />
              </div>
              <div className="space-y-2">
                <Label>Opis</Label>
                <Textarea
                  value={project.description || ''}
                  onChange={(e) => setProject((p) => p ? { ...p, description: e.target.value } : p)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Status</CardTitle></CardHeader>
            <CardContent>
              <Select
                value={project.status}
                onValueChange={(v) => setProject((p) => p ? { ...p, status: v } : p)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktywna</SelectItem>
                  <SelectItem value="planned">Planowana</SelectItem>
                  <SelectItem value="completed">Zakończona</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {project.units.filter((u) => u.status === 'available').length}
                  </div>
                  <div className="text-xs text-muted-foreground">Dostępne</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {project.units.filter((u) => u.status === 'reserved').length}
                  </div>
                  <div className="text-xs text-muted-foreground">Rezerwacja</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {project.units.filter((u) => u.status === 'sold').length}
                  </div>
                  <div className="text-xs text-muted-foreground">Sprzedane</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleSaveDetails}
            className="w-full"
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Zapisywanie...' : 'Zapisz zmiany'}
          </Button>
        </div>
      </div>

      {/* Interactive Plan Editor */}
      <div className="mb-6">
        <AdminPlanEditor
          projectId={id}
          planImageUrl={project.planImageUrl}
          initialUnits={project.units}
          initialSvgContent={project.svgContent}
          houseTypes={project.houseTypes.map(ht => ({ id: ht.id, name: ht.name }))}
          onPlanImageChange={(url) => setProject((p) => p ? { ...p, planImageUrl: url } : p)}
        />
      </div>

      {/* Plan View Editor */}
      <div className="mb-6">
        <AdminPlanViewEditor
          projectId={id}
          mainPlanUnits={project.units.map(u => ({ id: u.id, label: u.label, svgElementId: u.svgElementId }))}
        />
      </div>

      {/* Units Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Działki ({project.units.length})</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive/20 hover:bg-destructive/10"
                onClick={async () => {
                  if (!confirm('Usuń wszystkie działki, typy domów i plan z tego projektu?')) return
                  await fetch(`/api/admin/projects/${id}/reset`, { method: 'POST' })
                  await fetchProject()
                }}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Wyczyść dane
              </Button>
              <Button
                onClick={() => setShowAddUnit(true)}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Dodaj działkę
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {project.units.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Brak działek. Wgraj SVG i kliknij &quot;Wykryj elementy&quot; lub dodaj ręcznie.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Etykieta</TableHead>
                    <TableHead>ID SVG</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pow. m²</TableHead>
                    <TableHead>Ogród m²</TableHead>
                    <TableHead>Pokoje</TableHead>
                    <TableHead>Piętra</TableHead>
                    <TableHead>Piętro</TableHead>
                    <TableHead>Etap</TableHead>
                    <TableHead>Cena PLN</TableHead>
                    <TableHead className="text-right">Akcje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {project.units.map((unit) => (
                    <TableRow key={unit.id}>
                      <TableCell className="font-medium">{unit.label}</TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">{unit.svgElementId}</TableCell>
                      <TableCell>
                        <Select
                          value={unit.status}
                          onValueChange={(v) => handleUnitStatusChange(unit.id, v)}
                        >
                          <SelectTrigger className="w-36 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">Dostępna</SelectItem>
                            <SelectItem value="reserved">Rezerwacja</SelectItem>
                            <SelectItem value="sold">Sprzedana</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          defaultValue={unit.area ?? ''}
                          className="w-20 h-8"
                          onBlur={(e) => handleUnitFieldUpdate(unit.id, 'area', e.target.value ? parseFloat(e.target.value) : null)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          defaultValue={unit.gardenArea ?? ''}
                          className="w-20 h-8"
                          onBlur={(e) => handleUnitFieldUpdate(unit.id, 'gardenArea', e.target.value ? parseFloat(e.target.value) : null)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          defaultValue={unit.rooms ?? ''}
                          className="w-16 h-8"
                          onBlur={(e) => handleUnitFieldUpdate(unit.id, 'rooms', e.target.value ? parseInt(e.target.value) : null)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          defaultValue={unit.floors ?? ''}
                          className="w-16 h-8"
                          onBlur={(e) => handleUnitFieldUpdate(unit.id, 'floors', e.target.value ? parseInt(e.target.value) : null)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          defaultValue={unit.floor ?? ''}
                          className="w-20 h-8"
                          onBlur={(e) => handleUnitFieldUpdate(unit.id, 'floor', e.target.value || null)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          defaultValue={unit.stage ?? ''}
                          className="w-20 h-8"
                          onBlur={(e) => handleUnitFieldUpdate(unit.id, 'stage', e.target.value || null)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          defaultValue={unit.price ?? ''}
                          className="w-28 h-8"
                          onBlur={(e) => handleUnitFieldUpdate(unit.id, 'price', e.target.value ? parseInt(e.target.value) : null)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteUnit(unit.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* House Types Manager */}
      {project.houseTypes !== undefined && (
        <div className="mt-6">
          <HouseTypesManager projectId={id} initialHouseTypes={project.houseTypes} />
        </div>
      )}

      {/* Add Unit Dialog */}
      <Dialog open={showAddUnit} onOpenChange={setShowAddUnit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dodaj działkę</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddUnit}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>ID elementu SVG *</Label>
                <Input
                  value={newUnit.svgElementId}
                  onChange={(e) => setNewUnit((p) => ({ ...p, svgElementId: e.target.value }))}
                  placeholder="np. A1"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Etykieta</Label>
                <Input
                  value={newUnit.label}
                  onChange={(e) => setNewUnit((p) => ({ ...p, label: e.target.value }))}
                  placeholder="np. A1"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={newUnit.status}
                  onValueChange={(v) => setNewUnit((p) => ({ ...p, status: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Dostępna</SelectItem>
                    <SelectItem value="reserved">Rezerwacja</SelectItem>
                    <SelectItem value="sold">Sprzedana</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Powierzchnia m²</Label>
                <Input
                  type="number"
                  value={newUnit.area}
                  onChange={(e) => setNewUnit((p) => ({ ...p, area: e.target.value }))}
                  placeholder="150"
                />
              </div>
              <div className="space-y-2">
                <Label>Pokoje</Label>
                <Input
                  type="number"
                  value={newUnit.rooms}
                  onChange={(e) => setNewUnit((p) => ({ ...p, rooms: e.target.value }))}
                  placeholder="4"
                />
              </div>
              <div className="space-y-2">
                <Label>Piętra</Label>
                <Input
                  type="number"
                  value={newUnit.floors}
                  onChange={(e) => setNewUnit((p) => ({ ...p, floors: e.target.value }))}
                  placeholder="2"
                />
              </div>
              <div className="space-y-2">
                <Label>Ogród m²</Label>
                <Input
                  type="number"
                  value={newUnit.gardenArea}
                  onChange={(e) => setNewUnit((p) => ({ ...p, gardenArea: e.target.value }))}
                  placeholder="50"
                />
              </div>
              <div className="space-y-2">
                <Label>Piętro</Label>
                <Input
                  value={newUnit.floor}
                  onChange={(e) => setNewUnit((p) => ({ ...p, floor: e.target.value }))}
                  placeholder="np. Parter"
                />
              </div>
              <div className="space-y-2">
                <Label>Etap</Label>
                <Input
                  value={newUnit.stage}
                  onChange={(e) => setNewUnit((p) => ({ ...p, stage: e.target.value }))}
                  placeholder="np. 1"
                />
              </div>
              {project.houseTypes.length > 0 && (
                <div className="col-span-2 space-y-2">
                  <Label>Typ domu</Label>
                  <Select
                    value={newUnit.houseTypeId}
                    onValueChange={(v) => setNewUnit((p) => ({ ...p, houseTypeId: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz typ domu" />
                    </SelectTrigger>
                    <SelectContent>
                      {project.houseTypes.map((ht) => (
                        <SelectItem key={ht.id} value={ht.id}>{ht.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="col-span-2 space-y-2">
                <Label>Cena PLN</Label>
                <Input
                  type="number"
                  value={newUnit.price}
                  onChange={(e) => setNewUnit((p) => ({ ...p, price: e.target.value }))}
                  placeholder="750000"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Opis</Label>
                <Textarea
                  value={newUnit.description}
                  onChange={(e) => setNewUnit((p) => ({ ...p, description: e.target.value }))}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddUnit(false)}>
                Anuluj
              </Button>
              <Button type="submit" disabled={addingUnit}>
                {addingUnit ? 'Dodawanie...' : 'Dodaj'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
