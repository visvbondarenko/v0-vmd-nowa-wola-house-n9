'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Plus, Trash2, Upload, Loader2, Pencil, MousePointer2, Undo2,
  ChevronDown, ChevronUp, X, ZoomIn, ZoomOut, Maximize2,
} from 'lucide-react'
import Image from 'next/image'

// ─── Types ───
type Point = { x: number; y: number }

interface StageView {
  id: string
  stageId: string
  name: string
  imageUrl: string | null
  svgContent: string | null
  order: number
}

interface Stage {
  id: string
  projectId: string
  svgElementId: string
  name: string
  order: number
  stageViews: StageView[]
}

interface MainUnit {
  id: string
  svgElementId: string
  label: string
  status: string
  stage: string | null
}

function parseSvgPolygons(svg: string): { id: string; label: string; points: Point[] }[] {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
  const out: { id: string; label: string; points: Point[] }[] = []
  doc.querySelectorAll('polygon').forEach(el => {
    const id = el.getAttribute('id') || ''
    const label = el.getAttribute('data-label') || el.getAttribute('data-unit-id') || id
    const raw = el.getAttribute('points') || ''
    const points = raw.trim().split(/\s+/).flatMap(pair => {
      const [x, y] = pair.split(',').map(Number)
      return isFinite(x) && isFinite(y) ? [{ x, y }] : []
    })
    if (id && points.length >= 3) out.push({ id, label, points })
  })
  return out
}

function buildViewSvg(polygons: ViewPolygon[], w: number, h: number): string {
  const inner = polygons
    .filter(p => p.points.length >= 3)
    .map(p => {
      const pts = p.points.map(pt => `${Math.round(pt.x)},${Math.round(pt.y)}`).join(' ')
      return `  <polygon id="${p.id}" data-unit-id="${p.unitId}" data-label="${p.unitLabel}" points="${pts}" />`
    }).join('\n')
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">\n${inner}\n</svg>`
}

function pointInPolygon(pt: Point, poly: Point[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y
    if ((yi > pt.y) !== (yj > pt.y) && pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function centroid(pts: Point[]): Point {
  return { x: pts.reduce((s, p) => s + p.x, 0) / pts.length, y: pts.reduce((s, p) => s + p.y, 0) / pts.length }
}

interface ViewPolygon {
  id: string
  unitId: string
  unitLabel: string
  points: Point[]
}

async function uploadImage(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Upload failed')
  return data.url
}

function StageViewPlanEditor({ view, units, onSvgSave }: {
  view: StageView
  units: MainUnit[]
  onSvgSave: (svgContent: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null)
  const [polygons, setPolygons] = useState<ViewPolygon[]>([])
  const [tool, setTool] = useState<'draw' | 'select'>('draw')
  const [currentPts, setCurrentPts] = useState<Point[]>([])
  const [pendingPts, setPendingPts] = useState<Point[] | null>(null)
  const [pickingUnit, setPickingUnit] = useState(false)
  const [hoveredPoly, setHoveredPoly] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 })
  const isPanning = useRef(false)
  const panOrigin = useRef<{ mx: number; my: number; px: number; py: number } | null>(null)
  const [mouseImg, setMouseImg] = useState<Point | null>(null)
  const [nearFirst, setNearFirst] = useState(false)
  const SNAP_PX = 10

  useEffect(() => {
    if (!view.svgContent) { setPolygons([]); return }
    const parsed = parseSvgPolygons(view.svgContent)
    setPolygons(parsed.map(p => {
      const unitId = (() => {
        const doc = new DOMParser().parseFromString(view.svgContent!, 'image/svg+xml')
        const el = doc.getElementById(p.id)
        return el?.getAttribute('data-unit-id') || ''
      })()
      const unit = units.find(u => u.id === unitId)
      return { id: p.id, unitId, unitLabel: unit?.label || p.label, points: p.points }
    }))
  }, [view.svgContent, units])

  useEffect(() => {
    if (!view.imageUrl) return
    const img = new window.Image()
    img.onload = () => setImgSize({ w: img.naturalWidth, h: img.naturalHeight })
    img.src = view.imageUrl
  }, [view.imageUrl])

  const toImgCoords = useCallback((e: React.MouseEvent): Point | null => {
    if (!containerRef.current || !imgSize) return null
    const rect = containerRef.current.getBoundingClientRect()
    const dispW = containerRef.current.clientWidth * zoom
    const dispH = (imgSize.h / imgSize.w) * dispW
    const ox = (e.clientX - rect.left - pan.x) / (dispW / imgSize.w)
    const oy = (e.clientY - rect.top - pan.y) / (dispH / imgSize.h)
    if (ox < 0 || oy < 0 || ox > imgSize.w || oy > imgSize.h) return null
    return { x: Math.round(ox), y: Math.round(oy) }
  }, [imgSize, zoom, pan])

  const autoSave = useCallback((polys: ViewPolygon[]) => {
    if (!imgSize) return
    const svg = buildViewSvg(polys, imgSize.w, imgSize.h)
    onSvgSave(svg)
  }, [imgSize, onSvgSave])

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (tool !== 'draw') {
      const pt = toImgCoords(e)
      if (!pt) return
      const clicked = polygons.find(p => pointInPolygon(pt, p.points))
      if (clicked) {
        if (confirm(`Usuń polygon dla "${clicked.unitLabel}"?`)) {
          const next = polygons.filter(p => p.id !== clicked.id)
          setPolygons(next)
          autoSave(next)
        }
      }
      return
    }
    const pt = toImgCoords(e)
    if (!pt) return

    if (currentPts.length >= 2 && nearFirst) {
      setPendingPts([...currentPts])
      setPickingUnit(true)
      setCurrentPts([])
      return
    }
    setCurrentPts(prev => [...prev, pt])
  }, [tool, toImgCoords, currentPts, nearFirst, polygons, autoSave])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning.current && panOrigin.current) {
      setPan({ x: e.clientX - panOrigin.current.mx + panOrigin.current.px, y: e.clientY - panOrigin.current.my + panOrigin.current.py })
      return
    }
    const pt = toImgCoords(e)
    setMouseImg(pt)
    if (pt && currentPts.length >= 2) {
      const first = currentPts[0]
      setNearFirst(Math.hypot(pt.x - first.x, pt.y - first.y) < SNAP_PX * (imgSize ? imgSize.w / (containerRef.current?.clientWidth || 1) : 1))
    } else {
      setNearFirst(false)
    }
  }, [toImgCoords, currentPts, imgSize])

  const confirmUnitPick = (unit: MainUnit) => {
    if (!pendingPts) return
    const newPoly: ViewPolygon = {
      id: `pv-${Date.now()}`,
      unitId: unit.id,
      unitLabel: unit.label,
      points: pendingPts,
    }
    const next = [...polygons.filter(p => p.unitId !== unit.id), newPoly]
    setPolygons(next)
    autoSave(next)
    setPendingPts(null)
    setPickingUnit(false)
  }

  if (!view.imageUrl) {
    return <p className="text-sm text-muted-foreground py-4">Najpierw dodaj zdjęcie do tego widoku.</p>
  }

  const dispW = containerRef.current?.clientWidth || 800
  const dispH = imgSize ? (imgSize.h / imgSize.w) * dispW : 400

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Button size="sm" variant={tool === 'draw' ? 'default' : 'outline'} onClick={() => setTool('draw')}>
          <Pencil className="h-3.5 w-3.5 mr-1" />Rysuj
        </Button>
        <Button size="sm" variant={tool === 'select' ? 'default' : 'outline'} onClick={() => setTool('select')}>
          <MousePointer2 className="h-3.5 w-3.5 mr-1" />Zaznacz
        </Button>
        {currentPts.length > 0 && (
          <Button size="sm" variant="outline" onClick={() => { setCurrentPts(prev => prev.slice(0, -1)) }}>
            <Undo2 className="h-3.5 w-3.5 mr-1" />Cofnij
          </Button>
        )}
        <div className="ml-auto flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => setZoom(z => Math.min(z * 1.3, 5))}><ZoomIn className="h-3.5 w-3.5" /></Button>
          <Button size="sm" variant="ghost" onClick={() => setZoom(z => Math.max(z / 1.3, 0.3))}><ZoomOut className="h-3.5 w-3.5" /></Button>
          <Button size="sm" variant="ghost" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}><Maximize2 className="h-3.5 w-3.5" /></Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Polygony: {polygons.length} · Kliknij aby rysować polygon, zamknij klikając pierwszy punkt, następnie wybierz działkę
      </p>

      <div
        ref={containerRef}
        className="relative border border-border rounded-lg overflow-hidden bg-muted/50 cursor-crosshair"
        style={{ height: Math.min(dispH * zoom, 600) }}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseDown={(e) => {
          if (e.button === 1 || (e.button === 0 && e.altKey)) {
            isPanning.current = true
            panOrigin.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y }
          }
        }}
        onMouseUp={() => { isPanning.current = false; panOrigin.current = null }}
        onMouseLeave={() => { isPanning.current = false; setMouseImg(null) }}
      >
        <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0', width: '100%' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={view.imageUrl} alt="" style={{ width: '100%', display: 'block', pointerEvents: 'none' }} />

          {imgSize && (
            <svg
              viewBox={`0 0 ${imgSize.w} ${imgSize.h}`}
              className="absolute inset-0"
              style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
            >
              {polygons.map(p => {
                const c = centroid(p.points)
                const isHovered = hoveredPoly === p.id
                return (
                  <g key={p.id}
                    onMouseEnter={() => setHoveredPoly(p.id)}
                    onMouseLeave={() => setHoveredPoly(null)}
                    style={{ pointerEvents: 'all' }}
                  >
                    <polygon
                      points={p.points.map(pt => `${pt.x},${pt.y}`).join(' ')}
                      fill={isHovered ? 'rgba(34,197,94,0.4)' : 'rgba(34,197,94,0.2)'}
                      stroke="#22c55e"
                      strokeWidth={isHovered ? 3 : 2}
                    />
                    <text x={c.x} y={c.y} textAnchor="middle" dominantBaseline="central"
                      fontSize={Math.max(12, imgSize.w / 60)} fill="white" fontWeight="bold"
                      stroke="black" strokeWidth={0.5} paintOrder="stroke"
                    >{p.unitLabel}</text>
                  </g>
                )
              })}

              {currentPts.length > 0 && (
                <>
                  <polyline
                    points={[...currentPts, ...(mouseImg ? [mouseImg] : [])].map(p => `${p.x},${p.y}`).join(' ')}
                    fill="none" stroke="#3b82f6" strokeWidth={2} strokeDasharray="6 3"
                  />
                  {currentPts.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r={i === 0 && nearFirst ? 8 : 4}
                      fill={i === 0 ? '#f59e0b' : '#3b82f6'} stroke="white" strokeWidth={1}
                    />
                  ))}
                </>
              )}
            </svg>
          )}
        </div>
      </div>

      {pickingUnit && pendingPts && (
        <div className="border border-amber-300 rounded-lg p-4 bg-amber-50 space-y-3">
          <p className="text-sm font-medium text-amber-900">Wybierz działkę dla tego polygonu:</p>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto">
            {units.map(u => (
              <Button key={u.id} size="sm" variant="outline" className="text-xs"
                onClick={() => confirmUnitPick(u)}
              >
                {u.label}
              </Button>
            ))}
          </div>
          <Button size="sm" variant="ghost" onClick={() => { setPendingPts(null); setPickingUnit(false) }}>
            <X className="h-3.5 w-3.5 mr-1" />Anuluj
          </Button>
        </div>
      )}
    </div>
  )
}

export default function AdminStageEditor({ projectId, stages: initialStages, units }: {
  projectId: string
  stages: Stage[]
  units: MainUnit[]
}) {
  const [stages, setStages] = useState<Stage[]>(initialStages)
  const [expandedStage, setExpandedStage] = useState<string | null>(null)
  const [expandedView, setExpandedView] = useState<string | null>(null)
  const [newStageName, setNewStageName] = useState('')
  const [newStageSvgId, setNewStageSvgId] = useState('')
  const [creating, setCreating] = useState(false)

  const fetchStages = useCallback(async () => {
    const res = await fetch(`/api/admin/stages?projectId=${projectId}`)
    if (res.ok) setStages(await res.json())
  }, [projectId])

  const createStage = async () => {
    if (!newStageName || !newStageSvgId) return
    setCreating(true)
    const res = await fetch('/api/admin/stages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, name: newStageName, svgElementId: newStageSvgId, order: stages.length }),
    })
    if (res.ok) {
      await fetchStages()
      setNewStageName('')
      setNewStageSvgId('')
    }
    setCreating(false)
  }

  const deleteStage = async (id: string) => {
    if (!confirm('Usuń ten etap i wszystkie jego widoki?')) return
    await fetch(`/api/admin/stages/${id}`, { method: 'DELETE' })
    await fetchStages()
  }

  const addView = async (stageId: string) => {
    const stage = stages.find(s => s.id === stageId)
    const res = await fetch('/api/admin/stage-views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stageId, name: `Widok ${(stage?.stageViews.length || 0) + 1}`, order: stage?.stageViews.length || 0 }),
    })
    if (res.ok) await fetchStages()
  }

  const updateView = async (viewId: string, data: Partial<StageView>) => {
    await fetch(`/api/admin/stage-views/${viewId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    await fetchStages()
  }

  const deleteView = async (viewId: string) => {
    if (!confirm('Usuń ten widok?')) return
    await fetch(`/api/admin/stage-views/${viewId}`, { method: 'DELETE' })
    await fetchStages()
  }

  const saveViewSvg = async (viewId: string, svgContent: string) => {
    await fetch(`/api/admin/stage-views/${viewId}/svg`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ svgContent }),
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Etapy inwestycji ({stages.length})</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Narysuj polygony etapów na głównym planie (powyżej), potem dodaj tu etapy z pasującymi ID elementów SVG. Każdy etap ma własne widoki z polygonami działek.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-3 p-4 border border-border rounded-lg bg-muted/30">
          <div className="space-y-1 flex-1">
            <Label className="text-xs">Nazwa etapu</Label>
            <Input value={newStageName} onChange={e => setNewStageName(e.target.value)} placeholder="np. Etap 1" className="h-8" />
          </div>
          <div className="space-y-1 flex-1">
            <Label className="text-xs">ID elementu SVG (z głównego planu)</Label>
            <Input value={newStageSvgId} onChange={e => setNewStageSvgId(e.target.value)} placeholder="np. etap-1" className="h-8" />
          </div>
          <Button size="sm" onClick={createStage} disabled={creating || !newStageName || !newStageSvgId}>
            <Plus className="h-3.5 w-3.5 mr-1" />{creating ? 'Dodawanie...' : 'Dodaj etap'}
          </Button>
        </div>

        {stages.map(stage => (
          <div key={stage.id} className="border border-border rounded-lg overflow-hidden">
            <div
              className="flex items-center justify-between p-4 bg-card cursor-pointer hover:bg-muted/40 transition-colors"
              onClick={() => setExpandedStage(prev => prev === stage.id ? null : stage.id)}
            >
              <div className="flex items-center gap-3">
                {expandedStage === stage.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                <div>
                  <span className="font-medium text-sm">{stage.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">SVG ID: <code className="bg-muted px-1 rounded">{stage.svgElementId}</code></span>
                  <span className="text-xs text-muted-foreground ml-2">· {stage.stageViews.length} widoków</span>
                </div>
              </div>
              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                <Button size="sm" variant="outline" onClick={() => addView(stage.id)}>
                  <Plus className="h-3.5 w-3.5 mr-1" />Dodaj widok
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteStage(stage.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {expandedStage === stage.id && (
              <div className="border-t border-border bg-muted/20 p-4 space-y-4">
                {stage.stageViews.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Brak widoków. Dodaj widok aby rysować polygony działek.</p>
                ) : (
                  stage.stageViews.map(view => (
                    <StageViewCard
                      key={view.id}
                      view={view}
                      units={units.filter(u => u.stage === stage.name || !u.stage)}
                      expanded={expandedView === view.id}
                      onToggle={() => setExpandedView(prev => prev === view.id ? null : view.id)}
                      onUpdate={(data) => updateView(view.id, data)}
                      onDelete={() => deleteView(view.id)}
                      onSvgSave={(svg) => saveViewSvg(view.id, svg)}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        ))}

        {stages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-6">
            Brak etapów. Narysuj polygony etapów na głównym planie, potem dodaj etapy tutaj.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function StageViewCard({ view, units, expanded, onToggle, onUpdate, onDelete, onSvgSave }: {
  view: StageView
  units: MainUnit[]
  expanded: boolean
  onToggle: () => void
  onUpdate: (data: Partial<StageView>) => void
  onDelete: () => void
  onSvgSave: (svg: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [editName, setEditName] = useState(view.name)

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/40" onClick={onToggle}>
        <div className="flex items-center gap-3">
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          <span className="text-sm font-medium">{view.name}</span>
          {view.imageUrl && <span className="text-xs text-green-600">● zdjęcie</span>}
          {view.svgContent && <span className="text-xs text-blue-600">● polygony</span>}
        </div>
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive h-7 w-7 p-0" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border p-4 space-y-4">
          <div className="flex items-end gap-2">
            <div className="space-y-1 flex-1">
              <Label className="text-xs">Nazwa widoku</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-8"
                onBlur={() => { if (editName !== view.name) onUpdate({ name: editName }) }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Zdjęcie widoku (tło planu)</Label>
            <div className="flex gap-2 items-center">
              <Input
                value={view.imageUrl || ''}
                onChange={e => onUpdate({ imageUrl: e.target.value })}
                placeholder="URL zdjęcia"
                className="h-8 flex-1"
              />
              <label className="cursor-pointer">
                <Button type="button" variant="outline" size="sm" disabled={uploading} asChild>
                  <span>{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}</span>
                </Button>
                <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setUploading(true)
                  try {
                    const url = await uploadImage(file)
                    onUpdate({ imageUrl: url })
                  } catch { /* ignore */ }
                  setUploading(false)
                }} />
              </label>
            </div>
            {view.imageUrl && (
              <div className="relative w-40 h-24 rounded-lg overflow-hidden border border-border">
                <Image src={view.imageUrl} alt="" fill className="object-cover" />
              </div>
            )}
          </div>

          <div>
            <Label className="text-xs mb-2 block">Edytor polygonów działek</Label>
            <StageViewPlanEditor view={view} units={units} onSvgSave={onSvgSave} />
          </div>
        </div>
      )}
    </div>
  )
}
