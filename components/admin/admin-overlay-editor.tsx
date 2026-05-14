'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Loader2, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ─────────────────────────────────────────────────────────────────

type Pt = [number, number]
type Status = 'available' | 'reserved' | 'sold'

type OverlayUnit = {
  id: string
  svgElementId: string
  label: string
  status: Status | string
}

type DotOverride = { unitId: string; dotX: number; dotY: number }

type MapTarget = {
  key: string
  label: string
  kind: 'project' | 'planview' | 'stageview'
  entityId: string  // Project.id | PlanView.id | StageView.id
  svgContent: string | null
  imageUrl: string | null
  northAngle: number | null
  matchBy: 'id' | 'data-unit-id'  // how polygons reference units in this SVG
  dotOverrides: DotOverride[]
}

type PolygonInfo = {
  unitId: string
  points: Pt[]
  autoDot: Pt  // polylabel-computed fallback
}

// ─── Polylabel (same implementation as renderer) ───────────────────────────

function pointToSegmentDistSq(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  let dx = bx - ax, dy = by - ay
  const lenSq = dx * dx + dy * dy
  let t = 0
  if (lenSq > 0) {
    t = ((px - ax) * dx + (py - ay) * dy) / lenSq
    if (t > 1) t = 1
    else if (t < 0) t = 0
  }
  dx = ax + t * dx - px
  dy = ay + t * dy - py
  return dx * dx + dy * dy
}

function pointToPolygonDist(x: number, y: number, poly: Pt[]): number {
  let inside = false
  let minDistSq = Infinity
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j]
    if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside
    const d = pointToSegmentDistSq(x, y, a[0], a[1], b[0], b[1])
    if (d < minDistSq) minDistSq = d
  }
  const dist = Math.sqrt(minDistSq)
  return inside ? dist : -dist
}

type Cell = { x: number; y: number; h: number; d: number; max: number }
function makeCell(x: number, y: number, h: number, poly: Pt[]): Cell {
  const d = pointToPolygonDist(x, y, poly)
  return { x, y, h, d, max: d + h * Math.SQRT2 }
}

function polylabel(poly: Pt[], precision = 1): Pt {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const [x, y] of poly) {
    if (x < minX) minX = x; if (y < minY) minY = y
    if (x > maxX) maxX = x; if (y > maxY) maxY = y
  }
  const w = maxX - minX, h = maxY - minY
  const cellSize = Math.min(w, h)
  if (cellSize === 0) return [minX, minY]
  let cell = cellSize / 2
  const queue: Cell[] = []
  const push = (c: Cell) => {
    let i = queue.length
    queue.push(c)
    while (i > 0) {
      const p = (i - 1) >> 1
      if (queue[p].max >= queue[i].max) break
      ;[queue[p], queue[i]] = [queue[i], queue[p]]
      i = p
    }
  }
  const pop = (): Cell => {
    const top = queue[0]
    const last = queue.pop()!
    if (queue.length > 0) {
      queue[0] = last
      let i = 0; const n = queue.length
      for (;;) {
        const l = 2 * i + 1, r = l + 1
        let best = i
        if (l < n && queue[l].max > queue[best].max) best = l
        if (r < n && queue[r].max > queue[best].max) best = r
        if (best === i) break
        ;[queue[i], queue[best]] = [queue[best], queue[i]]
        i = best
      }
    }
    return top
  }
  for (let x = minX; x < maxX; x += cellSize) {
    for (let y = minY; y < maxY; y += cellSize) {
      push(makeCell(x + cell, y + cell, cell, poly))
    }
  }
  let sx = 0, sy = 0
  for (const [x, y] of poly) { sx += x; sy += y }
  let best = makeCell(sx / poly.length, sy / poly.length, 0, poly)
  while (queue.length) {
    const c = pop()
    if (c.d > best.d) best = c
    if (c.max - best.d <= precision) continue
    cell = c.h / 2
    push(makeCell(c.x - cell, c.y - cell, cell, poly))
    push(makeCell(c.x + cell, c.y - cell, cell, poly))
    push(makeCell(c.x - cell, c.y + cell, cell, poly))
    push(makeCell(c.x + cell, c.y + cell, cell, poly))
  }
  return [best.x, best.y]
}

// ─── SVG parsing ───────────────────────────────────────────────────────────

function parseViewBox(svg: string): { w: number; h: number } {
  const m = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)
  return { w: m ? parseFloat(m[1]) : 1000, h: m ? parseFloat(m[2]) : 1000 }
}

function parsePolygons(svg: string, matchBy: 'id' | 'data-unit-id'): Map<string, PolygonInfo> {
  const out = new Map<string, PolygonInfo>()
  const polyRe = /<polygon\b([^>]*?)\/?>/g
  const keyRe = matchBy === 'id' ? /\bid="([^"]+)"/ : /\bdata-unit-id="([^"]+)"/
  let m: RegExpExecArray | null
  while ((m = polyRe.exec(svg)) !== null) {
    const attrs = m[1]
    const keyMatch = attrs.match(keyRe)
    const ptsMatch = attrs.match(/\bpoints="([^"]+)"/)
    if (!keyMatch || !ptsMatch) continue
    const unitId = keyMatch[1]
    const nums = ptsMatch[1].trim().split(/[\s,]+/).map(Number).filter(n => !Number.isNaN(n))
    if (nums.length < 6) continue
    const points: Pt[] = []
    for (let i = 0; i + 1 < nums.length; i += 2) points.push([nums[i], nums[i + 1]])
    const autoDot = polylabel(points, 1)
    out.set(unitId, { unitId, points, autoDot })
  }
  return out
}

// ─── Constants ─────────────────────────────────────────────────────────────

const STATUS_FILL: Record<string, string> = {
  available: '#86efac', reserved: '#fde047', sold: '#f87171',
}

// Functional SVG colors — kept neutral so the editor reads well regardless of
// the surrounding theme. The brand stays on the chrome (buttons/cards) via
// Tailwind tokens; this canvas is utility chrome, not marketing surface.
const SVG_INK = '#1f2937'         // slate-800 — outlines and labels
const SVG_ACCENT = '#374151'      // slate-700 — selected polygon outline
const SVG_ACCENT_FILL = 'rgba(31,41,55,0.12)'

// ─── Component ─────────────────────────────────────────────────────────────

type ApiProject = {
  id: string
  name: string
  svgContent: string | null
  planImageUrl: string | null
  northAngle: number | null
  units: OverlayUnit[]
  dotOverrides: DotOverride[]
  planViews: Array<{ id: string; name: string; imageUrl: string | null; svgContent: string | null; northAngle: number | null; order: number; dotOverrides: DotOverride[] }>
  stages: Array<{
    id: string; name: string; order: number
    stageViews: Array<{ id: string; name: string; imageUrl: string | null; svgContent: string | null; northAngle: number | null; order: number; dotOverrides: DotOverride[] }>
  }>
}

// Composite key for per-(map, unit) dot overrides. Map kind + id + unit id.
function dotKey(mapKey: string, unitId: string): string {
  return `${mapKey}|${unitId}`
}

export default function AdminOverlayEditor({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<ApiProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [unitDots, setUnitDots] = useState<Map<string, { x: number | null; y: number | null }>>(new Map())
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [dragState, setDragState] = useState<{ kind: 'dot'; unitId: string } | { kind: 'compass' } | null>(null)

  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    fetch(`/api/admin/projects/${projectId}`)
      .then(r => r.json())
      .then((p: ApiProject) => {
        setProject(p)
        const m = new Map<string, { x: number | null; y: number | null }>()
        for (const o of p.dotOverrides ?? []) m.set(dotKey('project', o.unitId), { x: o.dotX, y: o.dotY })
        for (const pv of p.planViews) {
          for (const o of pv.dotOverrides ?? []) m.set(dotKey(`pv:${pv.id}`, o.unitId), { x: o.dotX, y: o.dotY })
        }
        for (const st of p.stages) {
          for (const sv of st.stageViews) {
            for (const o of sv.dotOverrides ?? []) m.set(dotKey(`sv:${sv.id}`, o.unitId), { x: o.dotX, y: o.dotY })
          }
        }
        setUnitDots(m)
        setLoading(false)
        const firstKey = p.svgContent
          ? 'project'
          : p.planViews[0]?.id
            ? `pv:${p.planViews[0].id}`
            : p.stages[0]?.stageViews[0]?.id
              ? `sv:${p.stages[0].stageViews[0].id}`
              : null
        setActiveKey(firstKey)
      })
      .catch(() => { setLoading(false); toast.error('Nie udało się załadować projektu') })
  }, [projectId])

  const maps: MapTarget[] = useMemo(() => {
    if (!project) return []
    const out: MapTarget[] = []
    if (project.svgContent) {
      out.push({
        key: 'project', label: 'Plan główny', kind: 'project', entityId: project.id,
        svgContent: project.svgContent, imageUrl: project.planImageUrl,
        northAngle: project.northAngle, matchBy: 'id',
        dotOverrides: project.dotOverrides ?? [],
      })
    }
    for (const pv of project.planViews) {
      if (!pv.svgContent) continue
      out.push({
        key: `pv:${pv.id}`, label: `Widok: ${pv.name}`, kind: 'planview', entityId: pv.id,
        svgContent: pv.svgContent, imageUrl: pv.imageUrl,
        northAngle: pv.northAngle, matchBy: 'data-unit-id',
        dotOverrides: pv.dotOverrides ?? [],
      })
    }
    for (const st of project.stages) {
      for (const sv of st.stageViews) {
        if (!sv.svgContent) continue
        out.push({
          key: `sv:${sv.id}`, label: `Etap ${st.name}: ${sv.name}`, kind: 'stageview', entityId: sv.id,
          svgContent: sv.svgContent, imageUrl: sv.imageUrl,
          northAngle: sv.northAngle, matchBy: 'data-unit-id',
          dotOverrides: sv.dotOverrides ?? [],
        })
      }
    }
    return out
  }, [project])

  const activeMap = useMemo(() => maps.find(m => m.key === activeKey) ?? null, [maps, activeKey])

  const polygons = useMemo(() => {
    if (!activeMap?.svgContent) return new Map<string, PolygonInfo>()
    return parsePolygons(activeMap.svgContent, activeMap.matchBy)
  }, [activeMap])

  const viewBox = useMemo(() => {
    if (!activeMap?.svgContent) return { w: 1000, h: 1000 }
    return parseViewBox(activeMap.svgContent)
  }, [activeMap])

  const unitByPolygonKey = useMemo(() => {
    if (!project || !activeMap) return new Map<string, OverlayUnit>()
    const map = new Map<string, OverlayUnit>()
    for (const u of project.units) {
      const key = activeMap.matchBy === 'id' ? u.svgElementId : u.id
      map.set(key, u)
    }
    return map
  }, [project, activeMap])

  const svgPointFromEvent = useCallback((e: React.MouseEvent | MouseEvent): Pt | null => {
    const svg = svgRef.current
    if (!svg) return null
    const pt = svg.createSVGPoint()
    pt.x = e.clientX; pt.y = e.clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) return null
    const { x, y } = pt.matrixTransform(ctm.inverse())
    return [x, y]
  }, [])

  const unitDotsRef = useRef(unitDots)
  useEffect(() => { unitDotsRef.current = unitDots }, [unitDots])
  const currentAngleRef = useRef<number | null>(null)
  useEffect(() => { currentAngleRef.current = activeMap?.northAngle ?? null }, [activeMap?.northAngle])

  const saveUnitDot = useCallback(async (map: MapTarget, unitId: string, dotX: number, dotY: number) => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/unit-dot-overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId, mapKind: map.kind, mapId: map.entityId, dotX, dotY }),
      })
      if (!res.ok) throw new Error()
      setProject(prev => prev ? applyDotOverride(prev, map, unitId, { dotX, dotY }) : prev)
      toast.success('Pozycja zapisana')
    } catch {
      toast.error('Błąd zapisu pozycji')
    } finally {
      setSaving(false)
    }
  }, [])

  const deleteUnitDot = useCallback(async (map: MapTarget, unitId: string) => {
    setSaving(true)
    try {
      const qs = new URLSearchParams({ unitId, mapKind: map.kind, mapId: map.entityId })
      const res = await fetch(`/api/admin/unit-dot-overrides?${qs}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setProject(prev => prev ? applyDotOverride(prev, map, unitId, null) : prev)
      toast.success('Pozycja przywrócona')
    } catch {
      toast.error('Błąd resetowania pozycji')
    } finally {
      setSaving(false)
    }
  }, [])

  const saveNorthAngle = useCallback(async (map: MapTarget, angle: number | null) => {
    setSaving(true)
    try {
      const endpoint =
        map.kind === 'project' ? `/api/admin/projects/${map.entityId}` :
        map.kind === 'planview' ? `/api/admin/projects/${projectId}/plan-views/${map.entityId}` :
        `/api/admin/stage-views/${map.entityId}`
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ northAngle: angle }),
      })
      if (!res.ok) throw new Error()
      toast.success('Kompas zapisany')
    } catch {
      toast.error('Błąd zapisu kompasu')
    } finally {
      setSaving(false)
    }
  }, [projectId])

  useEffect(() => {
    if (!dragState) return
    const onMove = (e: MouseEvent) => {
      const p = svgPointFromEvent(e)
      if (!p) return
      if (dragState.kind === 'dot') {
        if (!activeMap) return
        const uid = dragState.unitId
        const k = dotKey(activeMap.key, uid)
        setUnitDots(prev => {
          const next = new Map(prev)
          next.set(k, { x: p[0], y: p[1] })
          return next
        })
      } else if (dragState.kind === 'compass') {
        const cx = viewBox.w / 2, cy = viewBox.h / 2
        const dx = p[0] - cx, dy = p[1] - cy
        let deg = Math.atan2(dx, -dy) * 180 / Math.PI
        if (deg < 0) deg += 360
        setProject(prev => {
          if (!prev || !activeMap) return prev
          return applyNorthAngle(prev, activeMap, Math.round(deg))
        })
      }
    }
    const onUp = () => {
      if (dragState.kind === 'dot' && activeMap) {
        const uid = dragState.unitId
        const pos = unitDotsRef.current.get(dotKey(activeMap.key, uid))
        if (pos && pos.x != null && pos.y != null) saveUnitDot(activeMap, uid, pos.x, pos.y)
      } else if (dragState.kind === 'compass' && activeMap) {
        const angle = currentAngleRef.current
        saveNorthAngle(activeMap, angle)
      }
      setDragState(null)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [dragState, svgPointFromEvent, viewBox.w, viewBox.h, activeMap, saveUnitDot, saveNorthAngle])

  const onDotMouseDown = (unitId: string) => (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedUnitId(unitId)
    setDragState({ kind: 'dot', unitId })
  }

  const resetSelectedDot = () => {
    if (!selectedUnitId || !activeMap) return
    const k = dotKey(activeMap.key, selectedUnitId)
    setUnitDots(prev => {
      const next = new Map(prev)
      next.delete(k)
      return next
    })
    deleteUnitDot(activeMap, selectedUnitId)
  }

  const onCompassNeedleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDragState({ kind: 'compass' })
  }

  const clearCompass = () => {
    if (!activeMap) return
    setProject(prev => prev && activeMap ? applyNorthAngle(prev, activeMap, null) : prev)
    saveNorthAngle(activeMap, null)
  }

  const setCompassAngle = (angle: number) => {
    if (!activeMap) return
    const clamped = ((Math.round(angle) % 360) + 360) % 360
    setProject(prev => prev && activeMap ? applyNorthAngle(prev, activeMap, clamped) : prev)
    saveNorthAngle(activeMap, clamped)
  }

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }
  if (!project) return <div className="p-8 text-center">Nie znaleziono projektu.</div>

  if (maps.length === 0) {
    return (
      <div className="p-8 border border-border rounded-xl bg-muted/30 text-sm">
        Ten projekt nie ma jeszcze żadnej mapy SVG. Najpierw narysuj polygons w edytorze planu.
      </div>
    )
  }

  const selectedUnit = selectedUnitId ? project.units.find(u => u.id === selectedUnitId) : null
  const selectedUnitDot = selectedUnitId && activeMap ? unitDots.get(dotKey(activeMap.key, selectedUnitId)) : null
  const selectedDotHasOverride = !!(selectedUnitDot && selectedUnitDot.x != null && selectedUnitDot.y != null)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href={`/admin/projects/${projectId}`} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" /> Projekt
        </Link>
        <div className="h-4 w-px bg-border" />
        <h2 className="text-xl font-serif font-bold text-foreground">Pozycje punktów i kompas — {project.name}</h2>
        {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      <div className="flex flex-wrap gap-2">
        {maps.map(m => (
          <button
            key={m.key}
            onClick={() => { setActiveKey(m.key); setSelectedUnitId(null) }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeKey === m.key
                ? 'bg-primary text-primary-foreground'
                : 'border border-border bg-card text-foreground hover:bg-muted/50'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {activeMap && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
          <div className="relative border border-border rounded-xl overflow-hidden bg-muted/30 select-none"
            style={{ aspectRatio: `${viewBox.w} / ${viewBox.h}` }}
          >
            {activeMap.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={activeMap.imageUrl} alt="" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
            )}
            <svg
              ref={svgRef}
              viewBox={`0 0 ${viewBox.w} ${viewBox.h}`}
              className="absolute inset-0 w-full h-full"
              preserveAspectRatio="xMidYMid meet"
              onClick={() => setSelectedUnitId(null)}
            >
              {Array.from(polygons.values()).map(p => {
                const unit = unitByPolygonKey.get(p.unitId)
                const isSelected = unit && unit.id === selectedUnitId
                return (
                  <polygon
                    key={p.unitId}
                    points={p.points.map(pt => pt.join(',')).join(' ')}
                    fill={isSelected ? SVG_ACCENT_FILL : 'transparent'}
                    stroke={isSelected ? SVG_ACCENT : 'rgba(31,41,55,0.45)'}
                    strokeWidth={Math.max(1, viewBox.w * 0.0015)}
                    strokeDasharray={isSelected ? undefined : `${viewBox.w * 0.005} ${viewBox.w * 0.003}`}
                    style={{ pointerEvents: 'none' }}
                  />
                )
              })}

              {Array.from(polygons.values()).map(p => {
                const unit = unitByPolygonKey.get(p.unitId)
                if (!unit || !activeMap) return null
                const stored = unitDots.get(dotKey(activeMap.key, unit.id))
                const hasOverride = stored && stored.x != null && stored.y != null
                const [cx, cy] = hasOverride ? [stored!.x!, stored!.y!] : p.autoDot
                const fill = STATUS_FILL[unit.status] ?? STATUS_FILL.available
                const r = Math.max(6, Math.sqrt(viewBox.w * viewBox.w + viewBox.h * viewBox.h) * 0.008)
                const isSelected = unit.id === selectedUnitId
                return (
                  <g key={unit.id}>
                    <circle
                      cx={cx} cy={cy} r={r}
                      fill={fill} fillOpacity={hasOverride ? 0.85 : 0.45}
                      stroke={isSelected ? SVG_INK : fill}
                      strokeWidth={r * (isSelected ? 0.35 : 0.12)}
                      style={{ cursor: 'grab' }}
                      onMouseDown={onDotMouseDown(unit.id)}
                    />
                    <text
                      x={cx} y={cy + r * 0.35}
                      textAnchor="middle"
                      fontSize={r * 0.9}
                      fontWeight="bold"
                      fill={SVG_INK}
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {unit.label}
                    </text>
                  </g>
                )
              })}
            </svg>

            <CompassHandle
              angle={activeMap.northAngle}
              onNeedleMouseDown={onCompassNeedleMouseDown}
            />
          </div>

          <div className="space-y-4">
            <div className="border border-border rounded-xl p-4 bg-card">
              <div className="text-sm font-semibold mb-2">Wybrany dom</div>
              {selectedUnit ? (
                <div className="space-y-2">
                  <div className="text-base font-medium">{selectedUnit.label}</div>
                  <div className="text-xs text-muted-foreground">
                    Status: {selectedUnit.status}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Pozycja: {selectedDotHasOverride
                      ? <span className="text-green-700">własna</span>
                      : <span>automatyczna</span>}
                  </div>
                  {selectedDotHasOverride && (
                    <Button size="sm" variant="outline" className="w-full mt-2" onClick={resetSelectedDot}>
                      <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                      Przywróć automatyczną
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">Kliknij na punkt domu aby wybrać, lub przeciągnij punkt aby ustawić nową pozycję.</div>
              )}
            </div>

            <div className="border border-border rounded-xl p-4 bg-card">
              <div className="text-sm font-semibold mb-2">Kompas (kierunek północy)</div>
              <div className="text-xs text-muted-foreground mb-3">
                Przeciągnij igłę kompasu w prawym górnym rogu, lub wpisz kąt w stopniach (0–359).
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={0} max={359}
                  placeholder="np. 45"
                  value={activeMap.northAngle ?? ''}
                  onChange={(e) => {
                    const v = e.target.value
                    if (v === '') return
                    const n = parseInt(v, 10)
                    if (Number.isFinite(n)) setCompassAngle(n)
                  }}
                  className="h-8 text-sm"
                />
                <Button size="sm" variant="outline" onClick={clearCompass} disabled={activeMap.northAngle == null}>
                  Ukryj
                </Button>
              </div>
              {activeMap.northAngle != null && (
                <div className="text-xs text-muted-foreground mt-2">Aktualny kąt: {activeMap.northAngle}°</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CompassHandle({
  angle,
  onNeedleMouseDown,
}: {
  angle: number | null
  onNeedleMouseDown: (e: React.MouseEvent) => void
}) {
  const shownAngle = angle ?? 0
  return (
    <div
      className="absolute top-3 right-3 flex items-center justify-center rounded-full shadow-md bg-card/90 backdrop-blur-sm"
      style={{
        width: 72, height: 72,
        border: angle == null ? '1px dashed currentColor' : '1px solid transparent',
        color: SVG_INK,
      }}
      title={angle == null ? 'Przeciągnij igłę aby ustawić północ' : `Północ: ${angle}°`}
    >
      <svg width="56" height="56" viewBox="-20 -20 40 40" style={{ transform: `rotate(${shownAngle}deg)` }}>
        <circle cx="0" cy="0" r="17" fill="none" stroke={SVG_INK} strokeWidth="0.8" opacity="0.5" />
        <polygon
          points="0,-15 4,0 0,2 -4,0"
          fill="#B22222"
          onMouseDown={onNeedleMouseDown}
          style={{ cursor: 'grab' }}
        />
        <polygon points="0,15 4,0 0,-2 -4,0" fill={SVG_INK} opacity="0.6" style={{ pointerEvents: 'none' }} />
        <text x="0" y="-16" textAnchor="middle" fontSize="6" fontWeight="bold" fill={SVG_INK} style={{ pointerEvents: 'none' }}>N</text>
      </svg>
    </div>
  )
}

function applyNorthAngle(project: ApiProject, map: MapTarget, angle: number | null): ApiProject {
  if (map.kind === 'project') return { ...project, northAngle: angle }
  if (map.kind === 'planview') {
    return {
      ...project,
      planViews: project.planViews.map(pv => pv.id === map.entityId ? { ...pv, northAngle: angle } : pv),
    }
  }
  return {
    ...project,
    stages: project.stages.map(st => ({
      ...st,
      stageViews: st.stageViews.map(sv => sv.id === map.entityId ? { ...sv, northAngle: angle } : sv),
    })),
  }
}

function applyDotOverride(
  project: ApiProject,
  map: MapTarget,
  unitId: string,
  value: { dotX: number; dotY: number } | null,
): ApiProject {
  const upsert = (list: DotOverride[] | undefined): DotOverride[] => {
    const rest = (list ?? []).filter(o => o.unitId !== unitId)
    return value ? [...rest, { unitId, dotX: value.dotX, dotY: value.dotY }] : rest
  }
  if (map.kind === 'project') {
    return { ...project, dotOverrides: upsert(project.dotOverrides) }
  }
  if (map.kind === 'planview') {
    return {
      ...project,
      planViews: project.planViews.map(pv => pv.id === map.entityId
        ? { ...pv, dotOverrides: upsert(pv.dotOverrides) }
        : pv),
    }
  }
  return {
    ...project,
    stages: project.stages.map(st => ({
      ...st,
      stageViews: st.stageViews.map(sv => sv.id === map.entityId
        ? { ...sv, dotOverrides: upsert(sv.dotOverrides) }
        : sv),
    })),
  }
}
