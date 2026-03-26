'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Pencil, MousePointer2, Undo2, Trash2, Save, Upload,
  X, Check, ZoomIn, ZoomOut, Maximize2, FileUp, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ─────────────────────────────────────────────────────────────────────

type Point = { x: number; y: number }
type Status = 'available' | 'reserved' | 'sold'

interface DrawUnit {
  id: string
  svgElementId: string
  label: string
  status: Status
  points: Point[]
  area: number | null
  gardenArea: number | null
  rooms: number | null
  floors: number | null
  floor: string | null
  buildingLabel: string | null
  price: number | null
  description: string | null
  houseTypeId: string | null
}

interface DbUnit {
  id: string
  svgElementId: string
  label: string
  status: string
  area: number | null
  gardenArea: number | null
  rooms: number | null
  floors: number | null
  floor: string | null
  buildingLabel?: string | null
  price: number | null
  description: string | null
  houseTypeId?: string | null
}

interface EditForm {
  label: string; status: Status; area: string; gardenArea: string
  rooms: string; floors: string; floor: string; buildingLabel: string
  price: string; description: string; houseTypeId: string
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<Status, string> = {
  available: '#22c55e', reserved: '#eab308', sold: '#ef4444',
}
const STATUS_LABEL: Record<Status, string> = {
  available: 'Dostępne', reserved: 'Zarezerwowane', sold: 'Sprzedane',
}
const SNAP_PX = 10
const PRIMARY_COLOR = '#2d5a3d'
const EMPTY_FORM: EditForm = {
  label: '', status: 'available', area: '', gardenArea: '',
  rooms: '', floors: '', floor: '', buildingLabel: '', price: '', description: '', houseTypeId: '',
}

// ─── Pure helpers ──────────────────────────────────────────────────────────────

function sanitizeId(label: string) {
  return 'unit-' + label.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase()
}

function centroid(pts: Point[]): Point {
  return { x: pts.reduce((s, p) => s + p.x, 0) / pts.length, y: pts.reduce((s, p) => s + p.y, 0) / pts.length }
}

function pointInPolygon(pt: Point, poly: Point[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y
    if ((yi > pt.y) !== (yj > pt.y) && pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function parseSvgPolygons(svg: string): { id: string; points: Point[] }[] {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
  const out: { id: string; points: Point[] }[] = []
  doc.querySelectorAll('polygon').forEach(el => {
    const id = el.getAttribute('id') || ''
    const raw = el.getAttribute('points') || ''
    const points = raw.trim().split(/\s+/).flatMap(pair => {
      const [x, y] = pair.split(',').map(Number)
      return isFinite(x) && isFinite(y) ? [{ x, y }] : []
    })
    if (id && points.length >= 3) out.push({ id, points })
  })
  return out
}

function buildSvg(units: DrawUnit[], w: number, h: number) {
  const inner = units
    .filter(u => u.points.length >= 3)
    .map(u => {
      const pts = u.points.map(p => `${Math.round(p.x)},${Math.round(p.y)}`).join(' ')
      return `  <polygon id="${u.svgElementId}" data-label="${u.label}" data-status="${u.status}" points="${pts}" />`
    }).join('\n')
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">\n${inner}\n</svg>`
}

function unitToForm(u: DrawUnit): EditForm {
  return {
    label: u.label, status: u.status,
    area: u.area?.toString() || '', gardenArea: u.gardenArea?.toString() || '',
    rooms: u.rooms?.toString() || '', floors: u.floors?.toString() || '',
    floor: u.floor || '', buildingLabel: u.buildingLabel || '',
    price: u.price?.toString() || '', description: u.description || '',
    houseTypeId: u.houseTypeId || '',
  }
}

// ─── Component ─────────────────────────────────────────────────────────────────

export interface AdminPlanEditorProps {
  projectId: string
  planImageUrl: string | null
  initialUnits: DbUnit[]
  initialSvgContent: string | null
  onPlanImageChange?: (url: string) => void
  houseTypes?: Array<{ id: string; name: string }>
}

export default function AdminPlanEditor({
  projectId,
  planImageUrl,
  initialUnits,
  initialSvgContent,
  onPlanImageChange,
  houseTypes = [],
}: AdminPlanEditorProps) {

  // ── Image ──
  const [imgSrc,  setImgSrc]  = useState<string | null>(planImageUrl)
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null)
  const [uploadingImg, setUploadingImg] = useState(false)

  // ── Units / polygons ──
  const [drawUnits, setDrawUnits] = useState<DrawUnit[]>([])

  // ── Drawing ──
  const [currentPts, setCurrentPts]   = useState<Point[]>([])
  const currentPtsRef                 = useRef<Point[]>([])
  const syncCurrentPts = useCallback((pts: Point[]) => { currentPtsRef.current = pts; setCurrentPts(pts) }, [])
  const [pendingPts,      setPendingPts]      = useState<Point[] | null>(null)
  const [newLabel,        setNewLabel]        = useState('')
  const [newHouseTypeId,  setNewHouseTypeId]  = useState('')
  const [creating,        setCreating]        = useState(false)

  // ── Tool / selection ──
  const [tool,         setTool]        = useState<'draw' | 'select'>('draw')
  const [selectedId,   setSelectedId]  = useState<string | null>(null)
  const [hoveredElem,  setHoveredElem] = useState<string | null>(null)

  // ── Edit form ──
  const [editForm,   setEditForm]   = useState<EditForm>(EMPTY_FORM)
  const [savingUnit, setSavingUnit] = useState(false)

  // ── Viewport ──
  const [zoom, setZoom] = useState(1)
  const [pan,  setPan]  = useState<Point>({ x: 0, y: 0 })
  const isPanning  = useRef(false)
  const panOrigin  = useRef<{ mx: number; my: number; px: number; py: number } | null>(null)
  const [spaceDown, setSpaceDown] = useState(false)

  // ── Mouse ──
  const [mouseImg,  setMouseImg]  = useState<Point | null>(null)
  const [nearFirst, setNearFirst] = useState(false)

  // ── Import SVG ──
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')

  // ── Refs ──
  const containerRef = useRef<HTMLDivElement>(null)
  const fileRef      = useRef<HTMLInputElement>(null)
  const labelRef     = useRef<HTMLInputElement>(null)

  // ── Init: merge SVG polygons with DB units ──────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return
    const svgPolys = initialSvgContent ? parseSvgPolygons(initialSvgContent) : []

    if (initialSvgContent) {
      const doc = new DOMParser().parseFromString(initialSvgContent, 'image/svg+xml')
      const vb = doc.querySelector('svg')?.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number)
      if (vb?.length === 4 && vb[2] > 0 && vb[3] > 0) setImgSize({ w: vb[2], h: vb[3] })
    }

    const merged: DrawUnit[] = initialUnits.map(u => ({
      id: u.id, svgElementId: u.svgElementId, label: u.label,
      status: (u.status as Status) || 'available',
      points: svgPolys.find(p => p.id === u.svgElementId)?.points || [],
      area: u.area, gardenArea: u.gardenArea, rooms: u.rooms,
      floors: u.floors, floor: u.floor, buildingLabel: u.buildingLabel ?? null,
      price: u.price, description: u.description,
      houseTypeId: u.houseTypeId ?? null,
    }))
    setDrawUnits(merged)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load image dimensions when URL is set ──────────────────────────────────
  useEffect(() => {
    if (!imgSrc) return
    if (imgSize) return
    const img = new Image()
    img.onload = () => setImgSize({ w: img.naturalWidth, h: img.naturalHeight })
    img.src = imgSrc
  }, [imgSrc]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fit image ──
  const fitImage = useCallback((size?: { w: number; h: number }) => {
    const s = size ?? imgSize
    if (!s || !containerRef.current) return
    const r = containerRef.current.getBoundingClientRect()
    const z = Math.min(r.width / s.w, r.height / s.h, 1) * 0.92
    setZoom(z)
    setPan({ x: (r.width - s.w * z) / 2, y: (r.height - s.h * z) / 2 })
  }, [imgSize])

  useEffect(() => { if (imgSrc && imgSize) requestAnimationFrame(() => fitImage()) }, [imgSrc, imgSize]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Focus label input ──
  useEffect(() => { if (pendingPts) setTimeout(() => labelRef.current?.focus(), 30) }, [pendingPts])

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.code === 'Space')  { setSpaceDown(true); e.preventDefault() }
      if (e.key  === 'Escape') { syncCurrentPts([]); setPendingPts(null); setSelectedId(null) }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) handleDeleteUnit(selectedId)
    }
    const onUp = (e: KeyboardEvent) => { if (e.code === 'Space') { setSpaceDown(false); isPanning.current = false } }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup',   onUp)
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp) }
  }, [selectedId, syncCurrentPts]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Coordinate helpers ─────────────────────────────────────────────────────
  const getXY = (e: React.MouseEvent) => {
    const r = containerRef.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const toImage  = useCallback((cx: number, cy: number): Point => ({ x: (cx - pan.x) / zoom, y: (cy - pan.y) / zoom }), [pan, zoom])
  const toScreen = useCallback((ix: number, iy: number): Point => ({ x: ix * zoom + pan.x, y: iy * zoom + pan.y }), [pan, zoom])

  // ── DB: auto-save SVG ──────────────────────────────────────────────────────
  const autoSaveSvg = useCallback(async (units: DrawUnit[]) => {
    if (!imgSize) return
    const svg = buildSvg(units, imgSize.w, imgSize.h)
    await fetch(`/api/admin/projects/${projectId}/svg`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ svgContent: svg }),
    })
  }, [projectId, imgSize])

  // ── DB: create unit after polygon drawn ───────────────────────────────────
  const confirmPolygon = async () => {
    if (!pendingPts || !newLabel.trim()) return
    setCreating(true)

    const baseId = sanitizeId(newLabel.trim())
    const ids    = drawUnits.map(u => u.svgElementId)
    let svgId    = baseId
    let n        = 2
    while (ids.includes(svgId)) svgId = `${baseId}-${n++}`

    try {
      const res = await fetch('/api/admin/units', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId, svgElementId: svgId, label: newLabel.trim(), status: 'available',
          houseTypeId: newHouseTypeId || null,
        }),
      })
      if (!res.ok) throw new Error()
      const unit = await res.json()
      const nu: DrawUnit = {
        id: unit.id, svgElementId: svgId, label: newLabel.trim(), status: 'available',
        points: pendingPts, area: null, gardenArea: null, rooms: null,
        floors: null, floor: null, buildingLabel: null, price: null, description: null,
        houseTypeId: newHouseTypeId || null,
      }
      setDrawUnits(prev => { const next = [...prev, nu]; autoSaveSvg(next); return next })
      setPendingPts(null); setNewLabel(''); setNewHouseTypeId('')
      toast.success(`Dodano: ${nu.label}`)
    } catch { toast.error('Błąd tworzenia działki') }
    setCreating(false)
  }

  // ── DB: delete unit ────────────────────────────────────────────────────────
  const handleDeleteUnit = useCallback(async (dbId: string) => {
    await fetch(`/api/admin/units/${dbId}`, { method: 'DELETE' })
    setDrawUnits(prev => { const next = prev.filter(u => u.id !== dbId); autoSaveSvg(next); return next })
    setSelectedId(null)
    toast('Usunięto działkę')
  }, [autoSaveSvg])

  // ── DB: save edit form ────────────────────────────────────────────────────
  const saveEditForm = async () => {
    if (!selectedId) return
    setSavingUnit(true)
    const body = {
      label:         editForm.label,
      status:        editForm.status,
      area:          editForm.area       ? parseFloat(editForm.area)       : null,
      gardenArea:    editForm.gardenArea ? parseFloat(editForm.gardenArea) : null,
      rooms:         editForm.rooms      ? parseInt(editForm.rooms)        : null,
      floors:        editForm.floors     ? parseInt(editForm.floors)       : null,
      floor:         editForm.floor      || null,
      buildingLabel: editForm.buildingLabel || null,
      price:         editForm.price      ? parseInt(editForm.price)        : null,
      description:   editForm.description || null,
      houseTypeId:   editForm.houseTypeId || null,
    }
    await fetch(`/api/admin/units/${selectedId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    setDrawUnits(prev => prev.map(u => u.id === selectedId ? { ...u, ...body } : u))
    setSavingUnit(false)
    toast.success('Zapisano')
  }

  // ── DB: update status directly ────────────────────────────────────────────
  const updateStatus = useCallback(async (dbId: string, status: Status) => {
    await fetch(`/api/admin/units/${dbId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    })
    setDrawUnits(prev => prev.map(u => u.id === dbId ? { ...u, status } : u))
    if (selectedId === dbId) setEditForm(f => ({ ...f, status }))
  }, [selectedId])

  // ── Image upload ──────────────────────────────────────────────────────────
  const onImgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploadingImg(true)
    try {
      const form = new FormData(); form.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      const url: string = data.url
      if (!url) throw new Error('No URL returned')

      await fetch(`/api/admin/projects/${projectId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planImageUrl: url }),
      })

      setImgSize(null)
      setImgSrc(url)
      onPlanImageChange?.(url)
      toast.success('Plan wgrany')
    } catch { toast.error('Błąd wgrywania') }
    setUploadingImg(false); e.target.value = ''
  }

  // ── Import SVG ────────────────────────────────────────────────────────────
  const handleImportSvg = async () => {
    if (!importText.trim()) return
    try {
      const doc = new DOMParser().parseFromString(importText, 'image/svg+xml')
      const vb  = doc.querySelector('svg')?.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number)
      if (vb?.length === 4 && vb[2] > 0) setImgSize({ w: vb[2], h: vb[3] })

      const polys   = parseSvgPolygons(importText)
      if (!polys.length) { toast.error('Nie znaleziono polygonów'); return }

      const existing = new Set(drawUnits.map(u => u.svgElementId))
      const news     = polys.filter(p => !existing.has(p.id))
      const added: DrawUnit[] = []

      for (const poly of news) {
        const label = poly.id.replace(/^unit-/, '').replace(/-/g, ' ')
        const res = await fetch('/api/admin/units', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, svgElementId: poly.id, label, status: 'available' }),
        })
        if (res.ok) {
          const u = await res.json()
          added.push({ id: u.id, svgElementId: poly.id, label, status: 'available', points: poly.points,
            area: null, gardenArea: null, rooms: null, floors: null, floor: null,
            buildingLabel: null, price: null, description: null, houseTypeId: null })
        }
      }
      if (added.length) {
        setDrawUnits(prev => { const next = [...prev, ...added]; autoSaveSvg(next); return next })
        toast.success(`Zaimportowano ${added.length} działek`)
      }
      setShowImport(false); setImportText('')
    } catch { toast.error('Błąd importu') }
  }

  // ── Viewport events ───────────────────────────────────────────────────────
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const { x: cx, y: cy } = getXY(e as unknown as React.MouseEvent)
    const f  = e.deltaY < 0 ? 1.12 : 1 / 1.12
    const nz = Math.min(Math.max(zoom * f, 0.04), 20)
    const r  = nz / zoom
    setZoom(nz); setPan(p => ({ x: cx - r * (cx - p.x), y: cy - r * (cy - p.y) }))
  }, [zoom])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (spaceDown && e.button === 0)) {
      e.preventDefault()
      const { x, y } = getXY(e)
      panOrigin.current = { mx: x, my: y, px: pan.x, py: pan.y }
      isPanning.current = true
    }
  }, [spaceDown, pan])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const { x: cx, y: cy } = getXY(e)
    if (isPanning.current && panOrigin.current) {
      setPan({ x: panOrigin.current.px + cx - panOrigin.current.mx, y: panOrigin.current.py + cy - panOrigin.current.my })
      return
    }
    const ip = toImage(cx, cy); setMouseImg(ip)
    if (tool === 'draw' && currentPtsRef.current.length >= 3) {
      const fp = currentPtsRef.current[0]
      setNearFirst(Math.hypot((fp.x - ip.x) * zoom, (fp.y - ip.y) * zoom) < SNAP_PX)
    } else setNearFirst(false)
    if (tool === 'select') {
      let h: string | null = null
      for (let i = drawUnits.length - 1; i >= 0; i--)
        if (drawUnits[i].points.length >= 3 && pointInPolygon(ip, drawUnits[i].points)) { h = drawUnits[i].svgElementId; break }
      setHoveredElem(h)
    }
  }, [toImage, tool, zoom, drawUnits])

  const onMouseUp    = useCallback(() => { isPanning.current = false; panOrigin.current = null }, [])
  const onMouseLeave = useCallback(() => { setMouseImg(null); setNearFirst(false) }, [])

  const onClick = useCallback((e: React.MouseEvent) => {
    if (isPanning.current || pendingPts || e.detail !== 1) return
    const { x: cx, y: cy } = getXY(e); const ip = toImage(cx, cy)
    if (tool === 'draw') {
      const pts = currentPtsRef.current
      if (pts.length >= 3 && Math.hypot((pts[0].x - ip.x) * zoom, (pts[0].y - ip.y) * zoom) < SNAP_PX) {
        setPendingPts(pts); syncCurrentPts([]); setNewLabel(''); return
      }
      syncCurrentPts([...pts, ip])
    } else {
      let found: DrawUnit | null = null
      for (let i = drawUnits.length - 1; i >= 0; i--)
        if (drawUnits[i].points.length >= 3 && pointInPolygon(ip, drawUnits[i].points)) { found = drawUnits[i]; break }
      if (found) { setSelectedId(found.id); setEditForm(unitToForm(found)) }
      else        { setSelectedId(null) }
    }
  }, [pendingPts, toImage, tool, zoom, syncCurrentPts, drawUnits])

  const onDoubleClick = useCallback((e: React.MouseEvent) => {
    if (tool !== 'draw') return; e.preventDefault()
    const pts = currentPtsRef.current; if (pts.length < 3) return
    setPendingPts(pts); syncCurrentPts([]); setNewLabel('')
  }, [tool, syncCurrentPts])

  const zoomAround = useCallback((f: number) => {
    if (!containerRef.current) return
    const r = containerRef.current.getBoundingClientRect()
    const cx = r.width / 2, cy = r.height / 2
    const nz = Math.min(Math.max(zoom * f, 0.04), 20)
    const rt = nz / zoom
    setZoom(nz); setPan(p => ({ x: cx - rt * (cx - p.x), y: cy - rt * (cy - p.y) }))
  }, [zoom])

  // ── Derived ────────────────────────────────────────────────────────────────
  const iz           = 1 / zoom
  const selectedUnit = drawUnits.find(u => u.id === selectedId) ?? null
  const labelPos     = pendingPts ? (() => { const c = centroid(pendingPts); return toScreen(c.x, c.y) })() : null

  const getCursor = () => {
    if (spaceDown || isPanning.current) return 'grabbing'
    if (tool === 'draw') return 'crosshair'
    if (hoveredElem)     return 'pointer'
    return 'default'
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col border border-border rounded-xl overflow-hidden shadow-sm" style={{ height: 'calc(100vh - 107px)', minHeight: 840 }}>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-card border-b border-border flex-shrink-0 flex-wrap gap-y-1.5">
        <div className="flex rounded-md overflow-hidden border border-border text-sm">
          <button onClick={() => setTool('draw')} className={`px-3 py-1.5 flex items-center gap-1.5 font-medium transition-colors ${tool === 'draw' ? 'bg-foreground text-background' : 'hover:bg-muted text-foreground'}`}>
            <Pencil className="h-3.5 w-3.5" /> Rysuj
          </button>
          <button onClick={() => setTool('select')} className={`px-3 py-1.5 flex items-center gap-1.5 font-medium transition-colors border-l border-border ${tool === 'select' ? 'bg-foreground text-background' : 'hover:bg-muted text-foreground'}`}>
            <MousePointer2 className="h-3.5 w-3.5" /> Zaznacz
          </button>
        </div>

        <div className="h-5 w-px bg-border mx-1" />

        <Button variant="outline" size="sm" className="h-8" onClick={() => { if (currentPtsRef.current.length > 0) syncCurrentPts(currentPtsRef.current.slice(0, -1)) }}>
          <Undo2 className="h-3.5 w-3.5 mr-1" /> Cofnij punkt
        </Button>

        <div className="h-5 w-px bg-border mx-1" />

        <Button variant="outline" size="sm" className="h-8" onClick={() => fileRef.current?.click()} disabled={uploadingImg}>
          {uploadingImg ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Upload className="h-3.5 w-3.5 mr-1" />}
          {imgSrc ? 'Zmień plan' : 'Wgraj plan'}
        </Button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onImgUpload} />

        <Button variant="outline" size="sm" className="h-8" onClick={() => setShowImport(true)}>
          <FileUp className="h-3.5 w-3.5 mr-1" /> Wczytaj SVG
        </Button>

        <div className="h-5 w-px bg-border mx-1" />

        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => zoomAround(1.25)}><ZoomIn className="h-4 w-4" /></Button>
        <span className="text-sm text-muted-foreground tabular-nums w-12 text-center">{Math.round(zoom * 100)}%</span>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => zoomAround(1 / 1.25)}><ZoomOut className="h-4 w-4" /></Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => fitImage()} title="Dopasuj"><Maximize2 className="h-4 w-4" /></Button>

        <span className="ml-auto text-xs text-muted-foreground tabular-nums">{drawUnits.length} działek</span>
      </div>

      {/* ── Main ── */}
      <div className="flex flex-col flex-1 min-h-0">

        {/* Canvas */}
        <div
          ref={containerRef}
          className="flex-1 relative overflow-hidden bg-muted select-none min-h-[300px]"
          style={{ cursor: getCursor() }}
          onWheel={onWheel} onMouseDown={onMouseDown} onMouseMove={onMouseMove}
          onMouseUp={onMouseUp} onMouseLeave={onMouseLeave}
          onClick={onClick} onDoubleClick={onDoubleClick}
          onContextMenu={e => e.preventDefault()}
        >
          {/* Zoomed workspace */}
          <div style={{ position: 'absolute', transformOrigin: '0 0', transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})` }}>
            {imgSrc && imgSize && (
              <>
                <img src={imgSrc} alt="Plan" style={{ display: 'block', width: imgSize.w, height: imgSize.h, maxWidth: 'none' }} draggable={false} />
                <svg style={{ position: 'absolute', top: 0, left: 0, width: imgSize.w, height: imgSize.h, overflow: 'visible' }}>

                  {/* Existing polygons */}
                  {drawUnits.map(unit => {
                    if (unit.points.length < 3) return null
                    const pts   = unit.points.map(p => `${p.x},${p.y}`).join(' ')
                    const color = STATUS_COLOR[unit.status]
                    const isSel = unit.id === selectedId
                    const isHov = unit.svgElementId === hoveredElem
                    const c     = centroid(unit.points)
                    return (
                      <g key={unit.id}>
                        <polygon points={pts} fill={color} fillOpacity={(isSel || isHov) ? 0.35 : 0.2}
                          stroke={isSel ? '#1d4ed8' : isHov ? '#374151' : color}
                          strokeWidth={(isSel ? 2.5 : 1.5) * iz} />
                        <text x={c.x} y={c.y} textAnchor="middle" dominantBaseline="central"
                          fontSize={13 * iz} fontWeight="700" fill="#fff"
                          stroke="rgba(0,0,0,0.6)" strokeWidth={3 * iz} paintOrder="stroke"
                          style={{ userSelect: 'none', pointerEvents: 'none', fontFamily: 'DM Sans,sans-serif' }}
                        >{unit.label}</text>
                      </g>
                    )
                  })}

                  {/* In-progress polygon */}
                  {currentPts.length > 0 && (
                    <g>
                      {currentPts.length >= 2 && mouseImg && (
                        <polygon points={[...currentPts, nearFirst ? currentPts[0] : mouseImg].map(p => `${p.x},${p.y}`).join(' ')} fill={PRIMARY_COLOR} fillOpacity={0.12} />
                      )}
                      {currentPts.length >= 2 && (
                        <polyline points={currentPts.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke={PRIMARY_COLOR} strokeWidth={1.5 * iz} strokeDasharray={`${5 * iz} ${3 * iz}`} />
                      )}
                      {mouseImg && (
                        <line x1={currentPts[currentPts.length - 1].x} y1={currentPts[currentPts.length - 1].y}
                          x2={nearFirst ? currentPts[0].x : mouseImg.x} y2={nearFirst ? currentPts[0].y : mouseImg.y}
                          stroke={PRIMARY_COLOR} strokeWidth={1.5 * iz} strokeDasharray={`${5 * iz} ${3 * iz}`} strokeOpacity={0.55} />
                      )}
                      {currentPts.map((pt, i) => (
                        <circle key={i} cx={pt.x} cy={pt.y}
                          r={(i === 0 && nearFirst ? 8 : 4) * iz}
                          fill={i === 0 ? (nearFirst ? '#22c55e' : PRIMARY_COLOR) : PRIMARY_COLOR}
                          stroke="#fff" strokeWidth={1.5 * iz} />
                      ))}
                      {nearFirst && (
                        <circle cx={currentPts[0].x} cy={currentPts[0].y} r={12 * iz} fill="none"
                          stroke="#22c55e" strokeWidth={1.5 * iz} strokeDasharray={`${4 * iz} ${3 * iz}`} opacity={0.8} />
                      )}
                    </g>
                  )}

                  {/* Pending polygon (awaiting label) */}
                  {pendingPts && (
                    <polygon points={pendingPts.map(p => `${p.x},${p.y}`).join(' ')}
                      fill="#22c55e" fillOpacity={0.25} stroke="#22c55e" strokeWidth={2 * iz}
                      strokeDasharray={`${6 * iz} ${3 * iz}`} />
                  )}
                </svg>
              </>
            )}

            {/* No image placeholder */}
            {!imgSrc && (
              <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground rounded-xl border-2 border-dashed border-border bg-card cursor-pointer hover:border-primary/50 transition-colors"
                style={{ width: 600, height: 400 }} onClick={() => fileRef.current?.click()}>
                <Upload className="h-10 w-10 text-muted-foreground/50" />
                <div className="text-center">
                  <p className="font-semibold text-foreground">Wgraj plan sytuacyjny (JPG/PNG)</p>
                  <p className="text-sm mt-1 text-muted-foreground">Kliknij tutaj lub użyj przycisku „Wgraj plan"</p>
                </div>
              </div>
            )}
          </div>

          {/* Label input overlay */}
          {pendingPts && labelPos && (
            <div style={{
              position: 'absolute',
              left: Math.min(Math.max(labelPos.x - 110, 8), (containerRef.current?.clientWidth ?? 800) - 232),
              top:  Math.min(Math.max(labelPos.y - 64,  8), (containerRef.current?.clientHeight ?? 600) - 160),
              zIndex: 20,
            }} className="bg-card rounded-xl shadow-2xl border border-border p-4 w-56" onClick={e => e.stopPropagation()}>
              <p className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">Etykieta działki</p>
              <Input ref={labelRef} value={newLabel} onChange={e => setNewLabel(e.target.value)}
                placeholder="np. Dom 1" className="h-8 text-sm"
                onKeyDown={e => { if (e.key === 'Enter') confirmPolygon(); if (e.key === 'Escape') { setPendingPts(null); setNewLabel(''); setNewHouseTypeId('') } }} />
              {houseTypes.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1">Typ domu</p>
                  <Select value={newHouseTypeId} onValueChange={setNewHouseTypeId}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Wybierz typ" /></SelectTrigger>
                    <SelectContent>
                      {houseTypes.map(ht => (
                        <SelectItem key={ht.id} value={ht.id} className="text-xs">{ht.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <Button size="sm" className="flex-1 h-7" onClick={confirmPolygon} disabled={creating}>
                  {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Check className="h-3.5 w-3.5 mr-1" /> OK</>}
                </Button>
                <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => { setPendingPts(null); setNewLabel(''); setNewHouseTypeId('') }}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* Cursor coords */}
          {tool === 'draw' && mouseImg && (
            <div className="absolute bottom-2 left-2 bg-black/55 text-white text-xs px-2 py-1 rounded font-mono pointer-events-none tabular-nums">
              x: {Math.round(mouseImg.x)}  y: {Math.round(mouseImg.y)}
            </div>
          )}

          {/* Hint bar */}
          {tool === 'draw' && imgSrc && !pendingPts && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full pointer-events-none whitespace-nowrap">
              {currentPts.length === 0 ? 'Kliknij, aby zacząć · Scroll = zoom · Spacja+LPM = przesuń'
                : currentPts.length < 3 ? `Dodaj punkt (${currentPts.length}/3 min) · Esc = anuluj`
                : 'Kliknij pierwszy punkt lub dwukliknij, aby zamknąć'}
            </div>
          )}
        </div>

        {/* ── Properties Panel (below map) ── */}
        <div className="h-52 bg-card border-t border-border flex overflow-hidden flex-shrink-0">
          {/* Edit form (left side when selected) */}
          {selectedUnit && (
            <div className="w-80 flex flex-col overflow-hidden border-r border-border flex-shrink-0">
              <div className="px-4 py-2 border-b border-border flex items-center justify-between bg-primary/10 flex-shrink-0">
                <p className="text-xs font-bold text-primary uppercase tracking-wide">Edytuj: {selectedUnit.label}</p>
                <button onClick={() => setSelectedId(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Etykieta</Label>
                    <Input value={editForm.label} onChange={e => setEditForm(f => ({ ...f, label: e.target.value }))} className="h-7 text-xs mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Status</Label>
                    <Select value={editForm.status} onValueChange={v => setEditForm(f => ({ ...f, status: v as Status }))}>
                      <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(['available', 'reserved', 'sold'] as Status[]).map(s => (
                          <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {houseTypes.length > 0 && (
                    <div>
                      <Label className="text-xs">Typ domu</Label>
                      <Select value={editForm.houseTypeId || 'none'} onValueChange={v => setEditForm(f => ({ ...f, houseTypeId: v === 'none' ? '' : v }))}>
                        <SelectTrigger className="h-7 text-xs mt-1"><SelectValue placeholder="Wybierz" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">— brak —</SelectItem>
                          {houseTypes.map(ht => (
                            <SelectItem key={ht.id} value={ht.id}>{ht.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {[
                    ['area',         'Pow. m²',   'number', '130'],
                    ['gardenArea',   'Ogród m²',  'number', '200'],
                    ['rooms',        'Pokoje',    'number', '4'  ],
                    ['floors',       'Piętra',    'number', '2'  ],
                    ['floor',        'Piętro',    'text',   'Parter'],
                    ['buildingLabel','Budynek',   'text',   'G'  ],
                    ['price',        'Cena PLN',  'number', '1200000'],
                  ].map(([key, lbl, type, ph]) => (
                    <div key={key}>
                      <Label className="text-xs">{lbl}</Label>
                      <Input type={type} value={(editForm as unknown as Record<string, string>)[key]}
                        onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                        className="h-7 text-xs mt-1" placeholder={ph} />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" className="flex-1 h-7" onClick={saveEditForm} disabled={savingUnit}>
                    {savingUnit ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />} Zapisz
                  </Button>
                  <Button size="sm" variant="destructive" className="h-7 px-2" onClick={() => handleDeleteUnit(selectedUnit.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Unit list */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 py-2 border-b border-border flex items-center justify-between flex-shrink-0">
              <h3 className="font-semibold text-sm text-foreground">Działki ({drawUnits.length})</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              {drawUnits.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-1">
                  <p>Brak działek</p><p className="text-xs">Narysuj polygony na planie</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {drawUnits.map(unit => (
                    <div key={unit.id}
                      className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-muted/50 text-sm ${unit.id === selectedId ? 'bg-primary/10' : ''}`}
                      onClick={() => { setSelectedId(unit.id); setTool('select'); setEditForm(unitToForm(unit)) }}>
                      <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: STATUS_COLOR[unit.status] }} />
                      <span className="font-medium flex-1 truncate">{unit.label}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">{unit.area ? `${unit.area}m²` : ''}</span>
                      <Select value={unit.status} onValueChange={v => updateStatus(unit.id, v as Status)}>
                        <SelectTrigger className="h-6 text-xs border-0 shadow-none p-0 pr-5 focus:ring-0 w-auto" onClick={e => e.stopPropagation()}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(['available', 'reserved', 'sold'] as Status[]).map(s => (
                            <SelectItem key={s} value={s} className="text-xs">{STATUS_LABEL[s]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <button className="text-muted-foreground/50 hover:text-destructive p-0.5 transition-colors"
                        onClick={e => { e.stopPropagation(); handleDeleteUnit(unit.id) }}>
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Import SVG dialog ── */}
      {showImport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowImport(false)}>
          <div className="bg-card rounded-xl shadow-2xl w-[560px] p-6 mx-4 border border-border" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-1">
              <h3 className="text-lg font-semibold text-foreground">Wczytaj SVG</h3>
              <button onClick={() => setShowImport(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Wklej kod SVG (z Figmy, Inkscape lub eksportu edytora).</p>
            <Textarea value={importText} onChange={e => setImportText(e.target.value)}
              rows={8} className="font-mono text-xs resize-none"
              placeholder={'<svg viewBox="0 0 4000 3000" ...>...'} />
            <div className="flex gap-2 mt-4">
              <Button onClick={handleImportSvg}>
                <FileUp className="h-4 w-4 mr-1.5" /> Importuj
              </Button>
              <Button variant="outline" onClick={() => { setShowImport(false); setImportText('') }}>Anuluj</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
