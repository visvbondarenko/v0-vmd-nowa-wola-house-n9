'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  Pencil, MousePointer2, Trash2, Upload, ZoomIn, ZoomOut, Maximize2, Loader2, Plus, X,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ──────────────────────────────────────────────────────────────────

type Point = { x: number; y: number }

interface ViewPolygon {
  id: string
  unitId: string
  unitLabel: string
  points: Point[]
}

interface PlanViewRecord {
  id: string
  name: string
  imageUrl: string | null
  svgContent: string | null
  order: number
}

interface MainPlanUnit {
  id: string
  label: string
  svgElementId: string
}

export interface AdminPlanViewEditorProps {
  projectId: string
  mainPlanUnits: MainPlanUnit[]
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const SNAP_PX = 10
const PRIMARY_COLOR = '#2d5a3d'

function centroid(pts: Point[]): Point {
  return { x: pts.reduce((s, p) => s + p.x, 0) / pts.length, y: pts.reduce((s, p) => s + p.y, 0) / pts.length }
}

function parseSvgViewPolygons(svg: string): ViewPolygon[] {
  if (!svg || typeof window === 'undefined') return []
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
  const result: ViewPolygon[] = []
  doc.querySelectorAll('polygon').forEach(el => {
    const id = el.getAttribute('id') || ''
    const unitId = el.getAttribute('data-unit-id') || ''
    const unitLabel = el.getAttribute('data-label') || ''
    const raw = el.getAttribute('points') || ''
    const points = raw.trim().split(/\s+/).flatMap(pair => {
      const [x, y] = pair.split(',').map(Number)
      return isFinite(x) && isFinite(y) ? [{ x, y }] : []
    })
    if (id && unitId && points.length >= 3) result.push({ id, unitId, unitLabel, points })
  })
  return result
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

// ─── Sub-component: Single View Canvas ──────────────────────────────────────

function ViewCanvas({
  projectId, view, mainPlanUnits, onViewUpdated,
}: {
  projectId: string
  view: PlanViewRecord
  mainPlanUnits: MainPlanUnit[]
  onViewUpdated: (updated: Partial<PlanViewRecord>) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 })
  const isPanning = useRef(false)
  const panOrigin = useRef<{ mx: number; my: number; px: number; py: number } | null>(null)
  const [spaceDown, setSpaceDown] = useState(false)
  const [tool, setTool] = useState<'draw' | 'select'>('draw')
  const [currentPts, setCurrentPts] = useState<Point[]>([])
  const currentPtsRef = useRef<Point[]>([])
  const syncCurrentPts = useCallback((pts: Point[]) => { currentPtsRef.current = pts; setCurrentPts(pts) }, [])
  const [mouseImg, setMouseImg] = useState<Point | null>(null)
  const [nearFirst, setNearFirst] = useState(false)
  const [viewPolygons, setViewPolygons] = useState<ViewPolygon[]>([])
  const [selectedPolyId, setSelectedPolyId] = useState<string | null>(null)
  const [hoveredPolyId, setHoveredPolyId] = useState<string | null>(null)
  const [uploadingImg, setUploadingImg] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [pendingPts, setPendingPts] = useState<Point[] | null>(null)
  const [unitPickerOpen, setUnitPickerOpen] = useState(false)
  const [unitSearch, setUnitSearch] = useState('')

  // ── Init ──
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (view.svgContent) {
      const doc = new DOMParser().parseFromString(view.svgContent, 'image/svg+xml')
      const vb = doc.querySelector('svg')?.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number)
      if (vb?.length === 4 && vb[2] > 0) setImgSize({ w: vb[2], h: vb[3] })
      setViewPolygons(parseSvgViewPolygons(view.svgContent))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load image size ──
  useEffect(() => {
    if (!view.imageUrl) return
    const img = new Image()
    img.onload = () => {
      const size = { w: img.naturalWidth, h: img.naturalHeight }
      setImgSize(size)
    }
    img.src = view.imageUrl
  }, [view.imageUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fit ──
  const fitImage = useCallback((size?: { w: number; h: number }) => {
    const s = size ?? imgSize
    if (!s || !containerRef.current) return
    const r = containerRef.current.getBoundingClientRect()
    const z = Math.min(r.width / s.w, r.height / s.h, 1) * 0.92
    setZoom(z)
    setPan({ x: (r.width - s.w * z) / 2, y: (r.height - s.h * z) / 2 })
  }, [imgSize])

  useEffect(() => { if (view.imageUrl && imgSize) requestAnimationFrame(() => fitImage()) }, [view.imageUrl, imgSize]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Keyboard ──
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.code === 'Space') { setSpaceDown(true); e.preventDefault() }
      if (e.key === 'Escape') { syncCurrentPts([]); setPendingPts(null); setSelectedPolyId(null); setUnitPickerOpen(false) }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedPolyId) handleDeletePoly(selectedPolyId)
    }
    const onUp = (e: KeyboardEvent) => { if (e.code === 'Space') { setSpaceDown(false); isPanning.current = false } }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp) }
  }, [selectedPolyId, syncCurrentPts]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Coordinate helpers ──
  const getXY = (e: React.MouseEvent) => {
    const r = containerRef.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const toImage = useCallback((cx: number, cy: number): Point => ({ x: (cx - pan.x) / zoom, y: (cy - pan.y) / zoom }), [pan, zoom])
  const toScreen = useCallback((ix: number, iy: number): Point => ({ x: ix * zoom + pan.x, y: iy * zoom + pan.y }), [pan, zoom])

  // ── Auto-save SVG ──
  const autoSaveSvg = useCallback(async (polys: ViewPolygon[]) => {
    if (!imgSize) return
    const svg = buildViewSvg(polys, imgSize.w, imgSize.h)
    await fetch(`/api/admin/projects/${projectId}/plan-views/${view.id}/svg`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ svgContent: svg }),
    })
    onViewUpdated({ svgContent: svg })
  }, [projectId, view.id, imgSize, onViewUpdated])

  // ── Delete polygon ──
  const handleDeletePoly = useCallback((polyId: string) => {
    setViewPolygons(prev => { const next = prev.filter(p => p.id !== polyId); autoSaveSvg(next); return next })
    setSelectedPolyId(null)
    toast('Usunięto obszar')
  }, [autoSaveSvg])

  // ── Confirm unit pick ──
  const confirmUnitPick = (unit: MainPlanUnit) => {
    if (!pendingPts) return
    const newPoly: ViewPolygon = {
      id: `pv-${Date.now()}`,
      unitId: unit.id,
      unitLabel: unit.label,
      points: pendingPts,
    }
    setViewPolygons(prev => {
      const filtered = prev.filter(p => p.unitId !== unit.id)
      const next = [...filtered, newPoly]
      autoSaveSvg(next)
      return next
    })
    setPendingPts(null)
    setUnitPickerOpen(false)
    setUnitSearch('')
    toast.success(`Dodano widok dla ${unit.label}`)
  }

  // ── Image upload ──
  const onImgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploadingImg(true)
    try {
      const form = new FormData(); form.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
      if (!res.ok) throw new Error()
      const data = await res.json()
      const url: string = data.url
      await fetch(`/api/admin/projects/${projectId}/plan-views/${view.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: url }),
      })
      setImgSize(null)
      onViewUpdated({ imageUrl: url })
      toast.success('Zdjęcie wgrane')
    } catch { toast.error('Błąd wgrywania') }
    setUploadingImg(false); e.target.value = ''
  }

  // ── Viewport events ──
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const { x: cx, y: cy } = getXY(e as unknown as React.MouseEvent)
    const f = e.deltaY < 0 ? 1.12 : 1 / 1.12
    const nz = Math.min(Math.max(zoom * f, 0.04), 20)
    const r = nz / zoom
    setZoom(nz); setPan(p => ({ x: cx - r * (cx - p.x), y: cy - r * (cy - p.y) }))
  }, [zoom])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (spaceDown && e.button === 0)) {
      e.preventDefault()
      const { x, y } = getXY(e)
      panOrigin.current = { mx: x, my: y, px: pan.x, py: pan.y }
      isPanning.current = true; return
    }
    if (e.button !== 0) return
    const { x: cx, y: cy } = getXY(e)
    const ip = toImage(cx, cy)

    if (tool === 'select') {
      let hit: string | null = null
      for (const poly of viewPolygons) {
        if (pointInPoly(ip, poly.points)) { hit = poly.id; break }
      }
      setSelectedPolyId(hit)
      return
    }

    if (nearFirst && currentPtsRef.current.length >= 3) {
      setPendingPts(currentPtsRef.current)
      syncCurrentPts([])
      setNearFirst(false)
      setUnitPickerOpen(true)
      return
    }
    syncCurrentPts([...currentPtsRef.current, ip])
  }, [tool, spaceDown, pan, zoom, nearFirst, viewPolygons, toImage, syncCurrentPts])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const { x: cx, y: cy } = getXY(e)
    if (isPanning.current && panOrigin.current) {
      setPan({ x: panOrigin.current.px + cx - panOrigin.current.mx, y: panOrigin.current.py + cy - panOrigin.current.my })
      return
    }
    const ip = toImage(cx, cy)
    setMouseImg(ip)
    if (currentPtsRef.current.length >= 1) {
      const first = toScreen(currentPtsRef.current[0].x, currentPtsRef.current[0].y)
      const dx = cx - first.x, dy = cy - first.y
      setNearFirst(Math.hypot(dx, dy) < SNAP_PX && currentPtsRef.current.length >= 3)
    }
  }, [toImage, toScreen])

  const onMouseUp = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || spaceDown) { isPanning.current = false; panOrigin.current = null }
  }, [spaceDown])

  const iz = 1 / zoom
  const mappedUnits = new Set(viewPolygons.map(p => p.unitId))
  const filteredUnits = mainPlanUnits.filter(u =>
    !unitSearch || u.label.toLowerCase().includes(unitSearch.toLowerCase())
  )

  if (!view.imageUrl) {
    return (
      <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
        <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground mb-4">Wgraj zdjęcie dla tego widoku</p>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onImgUpload} />
        <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploadingImg}>
          {uploadingImg ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
          Wgraj zdjęcie
        </Button>
      </div>
    )
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <div className="flex items-center bg-muted rounded-lg p-1 gap-1">
          <button
            className={`p-1.5 rounded-md transition-colors ${tool === 'draw' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setTool('draw')} title="Rysuj"
          ><Pencil className="h-4 w-4" /></button>
          <button
            className={`p-1.5 rounded-md transition-colors ${tool === 'select' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setTool('select')} title="Zaznacz"
          ><MousePointer2 className="h-4 w-4" /></button>
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => {
            const nz = Math.min(zoom * 1.25, 20); const r = nz / zoom
            if (containerRef.current) { const rc = containerRef.current.getBoundingClientRect(); const cx = rc.width / 2, cy = rc.height / 2; setZoom(nz); setPan(p => ({ x: cx - r * (cx - p.x), y: cy - r * (cy - p.y) })) }
          }}><ZoomIn className="h-3 w-3" /></Button>
          <span className="text-xs text-muted-foreground w-10 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
          <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => {
            const nz = Math.max(zoom * 0.8, 0.04); const r = nz / zoom
            if (containerRef.current) { const rc = containerRef.current.getBoundingClientRect(); const cx = rc.width / 2, cy = rc.height / 2; setZoom(nz); setPan(p => ({ x: cx - r * (cx - p.x), y: cy - r * (cy - p.y) })) }
          }}><ZoomOut className="h-3 w-3" /></Button>
          <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => fitImage()} title="Dopasuj"><Maximize2 className="h-3 w-3" /></Button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onImgUpload} />
        <Button size="sm" variant="outline" className="h-7" onClick={() => fileRef.current?.click()} disabled={uploadingImg}>
          {uploadingImg ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
          Zmień
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {/* Canvas */}
        <div
          ref={containerRef}
          className="relative bg-muted rounded-xl overflow-hidden select-none"
          style={{ height: 585, cursor: spaceDown || isPanning.current ? 'grabbing' : tool === 'draw' ? 'crosshair' : 'default' }}
          onWheel={onWheel}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={() => { isPanning.current = false; panOrigin.current = null; setMouseImg(null); setNearFirst(false) }}
        >
          <div style={{ position: 'absolute', transformOrigin: '0 0', transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})` }}>
            {view.imageUrl && imgSize && (
              <img src={view.imageUrl} alt={view.name} style={{ display: 'block', width: imgSize.w, height: imgSize.h, maxWidth: 'none' }} draggable={false} />
            )}
            {imgSize && (
              <svg style={{ position: 'absolute', top: 0, left: 0, width: imgSize.w, height: imgSize.h, overflow: 'visible' }}>
                {viewPolygons.map(poly => {
                  const pts = poly.points.map(p => `${p.x},${p.y}`).join(' ')
                  const isSelected = selectedPolyId === poly.id
                  const isHovered = hoveredPolyId === poly.id
                  const c = centroid(poly.points)
                  const fillOpacity = (isSelected || isHovered) ? 0.25 : 0
                  return (
                    <g
                      key={poly.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => tool === 'select' && setSelectedPolyId(poly.id)}
                      onMouseEnter={() => setHoveredPolyId(poly.id)}
                      onMouseLeave={() => setHoveredPolyId(null)}
                    >
                      <polygon
                        points={pts}
                        fill={PRIMARY_COLOR}
                        fillOpacity={fillOpacity}
                        stroke="transparent"
                        strokeWidth={2 * iz}
                      />
                      {(isSelected || isHovered) && (
                        <text x={c.x} y={c.y} textAnchor="middle" dominantBaseline="central"
                          fontSize={13 * iz} fontWeight="700" fill="#fff"
                          stroke="rgba(0,0,0,0.5)" strokeWidth={3 * iz} paintOrder="stroke"
                          style={{ userSelect: 'none', pointerEvents: 'none' }}
                        >{poly.unitLabel}</text>
                      )}
                    </g>
                  )
                })}

                {/* In-progress polygon */}
                {currentPts.length > 0 && (
                  <g>
                    <polyline
                      points={[...currentPts, mouseImg || currentPts[currentPts.length - 1]].map(p => `${p.x},${p.y}`).join(' ')}
                      fill="none" stroke={PRIMARY_COLOR} strokeWidth={2 * iz} strokeDasharray={`${6 * iz} ${3 * iz}`}
                    />
                    {currentPts.map((p, i) => (
                      <circle key={i} cx={p.x} cy={p.y} r={4 * iz} fill={i === 0 && nearFirst ? '#22c55e' : PRIMARY_COLOR} stroke="#fff" strokeWidth={1.5 * iz} />
                    ))}
                    {nearFirst && <circle cx={currentPts[0].x} cy={currentPts[0].y} r={8 * iz} fill="none" stroke="#22c55e" strokeWidth={2 * iz} opacity={0.6} />}
                  </g>
                )}
              </svg>
            )}
          </div>

          {tool === 'draw' && !imgSize && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">Wgraj zdjęcie</div>
          )}
          {tool === 'draw' && imgSize && currentPts.length === 0 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full pointer-events-none">
              Kliknij, aby zacząć rysować obszar
            </div>
          )}
          {tool === 'draw' && nearFirst && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-green-700/80 text-white text-xs px-3 py-1 rounded-full pointer-events-none">
              Kliknij, aby zamknąć obszar
            </div>
          )}
        </div>

        {/* Polygon list */}
        {viewPolygons.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
            <p className="w-full text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Obszary ({viewPolygons.length})</p>
            {viewPolygons.map(poly => (
              <div
                key={poly.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-colors ${selectedPolyId === poly.id ? 'bg-primary/10 text-primary' : 'bg-card border border-border hover:bg-muted text-foreground'}`}
                onClick={() => { setTool('select'); setSelectedPolyId(poly.id) }}
              >
                <span className="font-medium">{poly.unitLabel}</span>
                <button className="text-muted-foreground/50 hover:text-destructive flex-shrink-0" onClick={(e) => { e.stopPropagation(); handleDeletePoly(poly.id) }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        {viewPolygons.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">Brak obszarów. Narysuj obszar i wybierz obiekt.</p>
        )}
      </div>

      {/* Unit Picker Dialog */}
      <Dialog open={unitPickerOpen} onOpenChange={(o) => { if (!o) { setUnitPickerOpen(false); setPendingPts(null); syncCurrentPts([]) } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Wybierz obiekt z głównego planu</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Szukaj..."
            value={unitSearch}
            onChange={e => setUnitSearch(e.target.value)}
            className="mb-2"
          />
          <div className="max-h-64 overflow-y-auto space-y-1">
            {filteredUnits.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Brak wyników</p>
            )}
            {filteredUnits.map(unit => (
              <button
                key={unit.id}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${mappedUnits.has(unit.id) ? 'opacity-50' : 'hover:bg-muted'}`}
                onClick={() => confirmUnitPick(unit)}
              >
                <span className="font-medium">{unit.label}</span>
                {mappedUnits.has(unit.id) && <span className="text-xs text-muted-foreground ml-2">już dodany</span>}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setUnitPickerOpen(false); setPendingPts(null); syncCurrentPts([]) }}>
              Anuluj
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function pointInPoly(pt: Point, poly: Point[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y
    if ((yi > pt.y) !== (yj > pt.y) && pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function AdminPlanViewEditor({ projectId, mainPlanUnits }: AdminPlanViewEditorProps) {
  const [views, setViews] = useState<PlanViewRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [activeViewId, setActiveViewId] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newViewName, setNewViewName] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/projects/${projectId}/plan-views`)
      .then(r => r.json())
      .then(data => { setViews(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [projectId])

  const handleAddView = async () => {
    if (!newViewName.trim()) return
    setAdding(true)
    try {
      const res = await fetch(`/api/admin/projects/${projectId}/plan-views`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newViewName.trim(), order: views.length }),
      })
      const view = await res.json()
      setViews(prev => [...prev, view])
      setActiveViewId(view.id)
      setShowAddDialog(false)
      setNewViewName('')
      toast.success('Widok dodany')
    } catch { toast.error('Błąd') }
    setAdding(false)
  }

  const handleDeleteView = async (viewId: string) => {
    if (!confirm('Usuń ten widok?')) return
    await fetch(`/api/admin/projects/${projectId}/plan-views/${viewId}`, { method: 'DELETE' })
    setViews(prev => prev.filter(v => v.id !== viewId))
    if (activeViewId === viewId) setActiveViewId(null)
    toast('Widok usunięty')
  }

  const activeView = views.find(v => v.id === activeViewId) ?? null

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Dodatkowe widoki planu</h3>
        <Button size="sm" onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Nowy widok
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-24 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Ładowanie...
        </div>
      ) : views.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground border-2 border-dashed border-border rounded-xl">
          <p className="text-sm">Brak dodatkowych widoków.</p>
          <p className="text-xs mt-1">Dodaj widok, wgraj zdjęcie i zaznacz obszary połączone z obiektami głównego planu.</p>
        </div>
      ) : (
        <div>
          {/* View tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {views.map(v => (
              <div key={v.id} className="flex items-center gap-1">
                <button
                  onClick={() => setActiveViewId(activeViewId === v.id ? null : v.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeViewId === v.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted/80'}`}
                >
                  {v.name}
                </button>
                <button onClick={() => handleDeleteView(v.id)} className="text-muted-foreground/50 hover:text-destructive transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Active view editor */}
          {activeView && (
            <ViewCanvas
              key={activeView.id}
              projectId={projectId}
              view={activeView}
              mainPlanUnits={mainPlanUnits}
              onViewUpdated={(updated) => {
                setViews(prev => prev.map(v => v.id === activeView.id ? { ...v, ...updated } : v))
              }}
            />
          )}
        </div>
      )}

      {/* Add view dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle>Nowy widok</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Nazwa widoku</Label>
              <Input
                placeholder="np. Segment A, Parter, Elewacja"
                value={newViewName}
                onChange={e => setNewViewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddView()}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Anuluj</Button>
            <Button onClick={handleAddView} disabled={adding || !newViewName.trim()}>
              {adding ? 'Dodawanie...' : 'Dodaj'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
