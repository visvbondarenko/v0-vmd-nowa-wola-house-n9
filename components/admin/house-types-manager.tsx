'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Trash2, Upload, Image as ImageIcon, ChevronDown, ChevronRight } from 'lucide-react'

type Room = {
  id: string
  name: string
  area: number | null
  number: number | null
}

type FloorPlan = {
  id: string
  name: string
  area: number | null
  image3dUrl: string | null
  image2dUrl: string | null
  rooms: Room[]
}

type HouseType = {
  id: string
  name: string
  totalArea: number | null
  floorPlans: FloorPlan[]
}

interface Props {
  projectId: string
  initialHouseTypes: HouseType[]
}

async function uploadImage(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
  if (!res.ok) throw new Error('Upload failed')
  const { url } = await res.json()
  return url
}

export function HouseTypesManager({ projectId, initialHouseTypes }: Props) {
  const [houseTypes, setHouseTypes] = useState<HouseType[]>(initialHouseTypes)
  const [expandedType, setExpandedType] = useState<string | null>(null)
  const [showAddType, setShowAddType] = useState(false)
  const [showAddFloor, setShowAddFloor] = useState<string | null>(null)
  const [showAddRoom, setShowAddRoom] = useState<string | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)

  const [newType, setNewType] = useState({ name: '', totalArea: '' })
  const handleAddType = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/admin/house-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        name: newType.name,
        totalArea: newType.totalArea ? parseFloat(newType.totalArea) : null,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      setHouseTypes((prev) => [...prev, data])
      setShowAddType(false)
      setNewType({ name: '', totalArea: '' })
    }
  }

  const handleDeleteType = async (id: string) => {
    if (!confirm('Usuń typ domu i wszystkie jego plany?')) return
    await fetch(`/api/admin/house-types/${id}`, { method: 'DELETE' })
    setHouseTypes((prev) => prev.filter((t) => t.id !== id))
  }

  const [newFloor, setNewFloor] = useState({ name: '', area: '' })
  const handleAddFloor = async (e: React.FormEvent, houseTypeId: string) => {
    e.preventDefault()
    const res = await fetch('/api/admin/floor-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        houseTypeId,
        name: newFloor.name,
        area: newFloor.area ? parseFloat(newFloor.area) : null,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      setHouseTypes((prev) =>
        prev.map((t) =>
          t.id === houseTypeId
            ? { ...t, floorPlans: [...t.floorPlans, data] }
            : t
        )
      )
      setShowAddFloor(null)
      setNewFloor({ name: '', area: '' })
    }
  }

  const handleDeleteFloor = async (houseTypeId: string, floorId: string) => {
    if (!confirm('Usuń to piętro?')) return
    await fetch(`/api/admin/floor-plans/${floorId}`, { method: 'DELETE' })
    setHouseTypes((prev) =>
      prev.map((t) =>
        t.id === houseTypeId
          ? { ...t, floorPlans: t.floorPlans.filter((f) => f.id !== floorId) }
          : t
      )
    )
  }

  const handleImageUpload = async (
    floorPlanId: string,
    houseTypeId: string,
    field: 'image3dUrl' | 'image2dUrl',
    file: File
  ) => {
    setUploading(`${floorPlanId}-${field}`)
    try {
      const url = await uploadImage(file)
      await fetch(`/api/admin/floor-plans/${floorPlanId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: url }),
      })
      setHouseTypes((prev) =>
        prev.map((t) =>
          t.id === houseTypeId
            ? {
                ...t,
                floorPlans: t.floorPlans.map((f) =>
                  f.id === floorPlanId ? { ...f, [field]: url } : f
                ),
              }
            : t
        )
      )
    } catch {
      alert('Błąd uploadu')
    }
    setUploading(null)
  }

  const [newRoom, setNewRoom] = useState({ name: '', area: '', number: '' })
  const handleAddRoom = async (e: React.FormEvent, floorPlanId: string, houseTypeId: string) => {
    e.preventDefault()
    const res = await fetch('/api/admin/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        floorPlanId,
        name: newRoom.name,
        area: newRoom.area ? parseFloat(newRoom.area) : null,
        number: newRoom.number ? parseInt(newRoom.number) : null,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      setHouseTypes((prev) =>
        prev.map((t) =>
          t.id === houseTypeId
            ? {
                ...t,
                floorPlans: t.floorPlans.map((f) =>
                  f.id === floorPlanId ? { ...f, rooms: [...f.rooms, data] } : f
                ),
              }
            : t
        )
      )
      setShowAddRoom(null)
      setNewRoom({ name: '', area: '', number: '' })
    }
  }

  const handleDeleteRoom = async (floorPlanId: string, houseTypeId: string, roomId: string) => {
    await fetch(`/api/admin/rooms/${roomId}`, { method: 'DELETE' })
    setHouseTypes((prev) =>
      prev.map((t) =>
        t.id === houseTypeId
          ? {
              ...t,
              floorPlans: t.floorPlans.map((f) =>
                f.id === floorPlanId
                  ? { ...f, rooms: f.rooms.filter((r) => r.id !== roomId) }
                  : f
              ),
            }
          : t
      )
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Typy domów ({houseTypes.length})</CardTitle>
          <Button size="sm" onClick={() => setShowAddType(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Dodaj typ
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {houseTypes.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground text-sm">
            Brak typów domów. Dodaj pierwszy typ.
          </p>
        ) : (
          <div className="space-y-3">
            {houseTypes.map((type) => (
              <div key={type.id} className="border border-border rounded-lg overflow-hidden">
                {/* Type header */}
                <div
                  className="flex items-center justify-between p-4 bg-muted/50 cursor-pointer hover:bg-muted"
                  onClick={() => setExpandedType(expandedType === type.id ? null : type.id)}
                >
                  <div className="flex items-center gap-3">
                    {expandedType === type.id ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="font-medium">{type.name}</span>
                    {type.totalArea && (
                      <span className="text-sm text-muted-foreground">{type.totalArea} m² łącznie</span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {type.floorPlans.length} {type.floorPlans.length === 1 ? 'kondygnacja' : 'kondygnacje'}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); handleDeleteType(type.id) }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Expanded content */}
                {expandedType === type.id && (
                  <div className="p-4 space-y-4">
                    {type.floorPlans.map((floor) => (
                      <div key={floor.id} className="border border-border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-sm">{floor.name}</h4>
                          <div className="flex items-center gap-2">
                            {floor.area && (
                              <span className="text-xs text-muted-foreground">{floor.area} m²</span>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive h-7 w-7 p-0"
                              onClick={() => handleDeleteFloor(type.id, floor.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Image uploads */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          {(['image3dUrl', 'image2dUrl'] as const).map((field) => (
                            <div key={field}>
                              <p className="text-xs text-muted-foreground mb-1">
                                {field === 'image3dUrl' ? 'Wizualizacja 3D' : 'Rzut 2D'}
                              </p>
                              {floor[field] ? (
                                <div className="relative group">
                                  <img
                                    src={floor[field]!}
                                    alt={field}
                                    className="w-full h-24 object-cover rounded border border-border"
                                  />
                                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 cursor-pointer rounded transition-opacity">
                                    <Upload className="h-5 w-5 text-white" />
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const f = e.target.files?.[0]
                                        if (f) handleImageUpload(floor.id, type.id, field, f)
                                      }}
                                    />
                                  </label>
                                </div>
                              ) : (
                                <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-border rounded cursor-pointer hover:bg-muted/50 transition-colors">
                                  {uploading === `${floor.id}-${field}` ? (
                                    <span className="text-xs text-muted-foreground">Uploading...</span>
                                  ) : (
                                    <>
                                      <ImageIcon className="h-6 w-6 text-muted-foreground/50 mb-1" />
                                      <span className="text-xs text-muted-foreground">Kliknij aby dodać</span>
                                    </>
                                  )}
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const f = e.target.files?.[0]
                                      if (f) handleImageUpload(floor.id, type.id, field, f)
                                    }}
                                  />
                                </label>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Rooms table */}
                        {floor.rooms.length > 0 && (
                          <Table className="mb-2">
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-xs">Pomieszczenie</TableHead>
                                <TableHead className="text-xs">Pow. m²</TableHead>
                                <TableHead className="w-8" />
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {floor.rooms.map((room) => (
                                <TableRow key={room.id}>
                                  <TableCell className="text-sm">{room.name}</TableCell>
                                  <TableCell className="text-sm">{room.area ?? '—'}</TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 text-destructive/60 hover:text-destructive"
                                      onClick={() => handleDeleteRoom(floor.id, type.id, room.id)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => setShowAddRoom(floor.id)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Dodaj pomieszczenie
                        </Button>

                        <Dialog open={showAddRoom === floor.id} onOpenChange={(o) => !o && setShowAddRoom(null)}>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Dodaj pomieszczenie — {floor.name}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={(e) => handleAddRoom(e, floor.id, type.id)}>
                              <div className="grid grid-cols-2 gap-4 py-4">
                                <div className="col-span-2 space-y-2">
                                  <Label>Nazwa pomieszczenia *</Label>
                                  <Input
                                    value={newRoom.name}
                                    onChange={(e) => setNewRoom((p) => ({ ...p, name: e.target.value }))}
                                    placeholder="np. Salon z aneksem"
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Powierzchnia m²</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={newRoom.area}
                                    onChange={(e) => setNewRoom((p) => ({ ...p, area: e.target.value }))}
                                    placeholder="32.5"
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setShowAddRoom(null)}>
                                  Anuluj
                                </Button>
                                <Button type="submit">Dodaj</Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>
                    ))}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddFloor(type.id)}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-1.5" />
                      Dodaj kondygnację
                    </Button>

                    <Dialog open={showAddFloor === type.id} onOpenChange={(o) => !o && setShowAddFloor(null)}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Dodaj kondygnację — {type.name}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={(e) => handleAddFloor(e, type.id)}>
                          <div className="grid grid-cols-2 gap-4 py-4">
                            <div className="col-span-2 space-y-2">
                              <Label>Nazwa *</Label>
                              <Input
                                value={newFloor.name}
                                onChange={(e) => setNewFloor((p) => ({ ...p, name: e.target.value }))}
                                placeholder="np. Parter, Piętro"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Powierzchnia m²</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={newFloor.area}
                                onChange={(e) => setNewFloor((p) => ({ ...p, area: e.target.value }))}
                                placeholder="75.0"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowAddFloor(null)}>
                              Anuluj
                            </Button>
                            <Button type="submit">Dodaj</Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add House Type Dialog */}
        <Dialog open={showAddType} onOpenChange={setShowAddType}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dodaj typ domu</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddType}>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="col-span-2 space-y-2">
                  <Label>Nazwa *</Label>
                  <Input
                    value={newType.name}
                    onChange={(e) => setNewType((p) => ({ ...p, name: e.target.value }))}
                    placeholder="np. Dom A"
                    required
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Łączna powierzchnia m²</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newType.totalArea}
                    onChange={(e) => setNewType((p) => ({ ...p, totalArea: e.target.value }))}
                    placeholder="150.0"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddType(false)}>
                  Anuluj
                </Button>
                <Button type="submit">Utwórz</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
