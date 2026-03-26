'use client'

import { useState, useRef, useCallback, useMemo, Fragment } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Mail, ArrowUpDown, ArrowUp, ArrowDown, X, SlidersHorizontal, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'

type Room = { id: string; name: string; area: number | null }
type FloorPlan = {
  id: string; name: string; area: number | null
  image3dUrl: string | null; image2dUrl: string | null; rooms: Room[]
}
type HouseType = {
  id: string; name: string; totalArea: number | null; floorPlans: FloorPlan[]
}
type Unit = {
  id: string; svgElementId: string; label: string; status: string
  area: number | null; gardenArea: number | null
  floor: string | null; rooms: number | null; floors: number | null
  price: number | null; description: string | null
  houseType: HouseType | null
}

type PlanViewItem = {
  id: string; name: string; imageUrl: string | null; svgContent: string | null; order: number
}

export type WolaHouseSchemaProps = {
  projectName: string
  description?: string
  svgContent: string | null
  planImageUrl: string | null
  units: Unit[]
  houseTypes: HouseType[]
  planViews: PlanViewItem[]
}

const STATUS_CONFIG = {
  available: { label: 'Dostępny', fill: '#22c55e', stroke: '#16a34a', badgeBg: 'bg-green-600', dotColor: 'bg-green-400' },
  reserved: { label: 'Zarezerwowany', fill: '#f59e0b', stroke: '#ca8a04', badgeBg: 'bg-amber-500', dotColor: 'bg-amber-400' },
  sold: { label: 'Sprzedany', fill: '#ef4444', stroke: '#dc2626', badgeBg: 'bg-red-600', dotColor: 'bg-red-400' },
}
type StatusKey = keyof typeof STATUS_CONFIG

function fmt(price: number | null) {
  if (!price) return 'Na zapytanie'
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(price)
}

type SortKey = 'label' | 'area' | 'gardenArea' | 'rooms' | 'price' | 'status'
type SortDir = 'asc' | 'desc'

export function WolaHouseSchema({ projectName, description, svgContent, planImageUrl, units, houseTypes, planViews }: WolaHouseSchemaProps) {
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null)
  const [hoveredUnit, setHoveredUnit] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; unit: Unit } | null>(null)
  const [activeViewId, setActiveViewId] = useState<string | null>(null)
  const [floorView, setFloorView] = useState<'3d' | '2d'>('3d')
  const [activeHouseTypeIndex, setActiveHouseTypeIndex] = useState(0)
  const [activeFloor, setActiveFloor] = useState(0)
  const svgRef = useRef<HTMLDivElement>(null)

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterRooms, setFilterRooms] = useState<string>('all')
  const [filterAreaMin, setFilterAreaMin] = useState('')
  const [filterAreaMax, setFilterAreaMax] = useState('')
  const [filterGardenMin, setFilterGardenMin] = useState('')
  const [filterGardenMax, setFilterGardenMax] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('label')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const roomOptions = useMemo(() => {
    const r = new Set(units.map((u) => u.rooms).filter(Boolean) as number[])
    return Array.from(r).sort((a, b) => a - b)
  }, [units])

  const filteredUnits = useMemo(() => {
    return units.filter((u) => {
      if (filterStatus !== 'all' && u.status !== filterStatus) return false
      if (filterRooms !== 'all' && String(u.rooms) !== filterRooms) return false
      if (filterAreaMin && (u.area ?? 0) < parseFloat(filterAreaMin)) return false
      if (filterAreaMax && (u.area ?? Infinity) > parseFloat(filterAreaMax)) return false
      if (filterGardenMin && (u.gardenArea ?? 0) < parseFloat(filterGardenMin)) return false
      if (filterGardenMax && (u.gardenArea ?? Infinity) > parseFloat(filterGardenMax)) return false
      return true
    })
  }, [units, filterStatus, filterRooms, filterAreaMin, filterAreaMax, filterGardenMin, filterGardenMax])

  const sortedUnits = useMemo(() => {
    return [...filteredUnits].sort((a, b) => {
      const av: string | number = (a[sortKey] as string | number) ?? ''
      const bv: string | number = (b[sortKey] as string | number) ?? ''
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv, 'pl') : bv.localeCompare(av, 'pl')
      }
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
    })
  }, [filteredUnits, sortKey, sortDir])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />
    return sortDir === 'asc'
      ? <ArrowUp className="h-3 w-3 ml-1 text-primary" />
      : <ArrowDown className="h-3 w-3 ml-1 text-primary" />
  }

  const getUnit = useCallback((id: string) => units.find((u) => u.svgElementId === id), [units])

  const coloredSvg = useCallback((): string => {
    if (!svgContent) return ''
    const filteredIds = new Set(filteredUnits.map((u) => u.svgElementId))

    const styles = units.map((unit) => {
      const cfg = STATUS_CONFIG[unit.status as StatusKey] || STATUS_CONFIG.available
      const isFiltered = !filteredIds.has(unit.svgElementId)
      const isHovered = hoveredUnit === unit.svgElementId
      const isSelected = selectedUnit?.id === unit.id

      let fill: string, fillOpacity: string, stroke: string, sw: string
      if (isFiltered) {
        fill = 'transparent'; fillOpacity = '0'; stroke = 'transparent'; sw = '0'
      } else if (isSelected || isHovered) {
        fill = cfg.fill; fillOpacity = '0.46'; stroke = 'transparent'; sw = '0'
      } else {
        fill = 'transparent'; fillOpacity = '0'; stroke = 'transparent'; sw = '0'
      }
      return `#${CSS.escape(unit.svgElementId)} { fill: ${fill}; fill-opacity: ${fillOpacity}; stroke: ${stroke}; stroke-width: ${sw}px; cursor: pointer; transition: fill 0.15s, fill-opacity 0.15s; }`
    }).join('\n')

    const vbMatch = svgContent.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)
    const imgTag = planImageUrl && vbMatch
      ? `<image href="${planImageUrl}" x="0" y="0" width="${vbMatch[1]}" height="${vbMatch[2]}" preserveAspectRatio="xMidYMid slice"/>`
      : ''

    return svgContent
      .replace(/<svg([^>]*)>/, (_, attrs) => {
        const cleaned = attrs.replace(/\s*preserveAspectRatio="[^"]*"/, '')
        return `<svg${cleaned} preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%;display:block"><style>${styles}</style>${imgTag}`
      })
  }, [svgContent, planImageUrl, units, filteredUnits, hoveredUnit, selectedUnit])

  const coloredViewSvg = useCallback((pv: PlanViewItem): string => {
    if (!pv.svgContent) return ''
    const vbMatch = pv.svgContent.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)
    const imgTag = pv.imageUrl && vbMatch
      ? `<image href="${pv.imageUrl}" x="0" y="0" width="${vbMatch[1]}" height="${vbMatch[2]}" preserveAspectRatio="xMidYMid slice"/>`
      : ''
    const baseStyle = `polygon { fill: transparent; fill-opacity: 0; stroke: transparent; cursor: pointer; transition: fill 0.15s, fill-opacity 0.15s; }`
    const unitStyles = units.map(unit => {
      const cfg = STATUS_CONFIG[unit.status as StatusKey] || STATUS_CONFIG.available
      const eid = CSS.escape(unit.id)
      if (selectedUnit?.id === unit.id) {
        return `polygon[data-unit-id="${eid}"] { fill: ${cfg.fill}; fill-opacity: 0.32; stroke: none; }`
      }
      return `polygon[data-unit-id="${eid}"]:hover { fill: ${cfg.fill}; fill-opacity: 0.32; stroke: none; }`
    }).join('\n')
    return pv.svgContent
      .replace(/<svg([^>]*)>/, (_, attrs) => {
        const cleaned = attrs.replace(/\s*preserveAspectRatio="[^"]*"/, '')
        return `<svg${cleaned} preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%;display:block"><style>${baseStyle}\n${unitStyles}</style>${imgTag}`
      })
  }, [units, selectedUnit])

  const activeView = planViews.find(v => v.id === activeViewId) ?? null

  const [isAnimating, setIsAnimating] = useState(false)
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null)

  const allViews = useMemo(() => {
    const mainPlan = { id: null as string | null, name: 'Plan główny' }
    return [mainPlan, ...planViews.map(pv => ({ id: pv.id, name: pv.name }))]
  }, [planViews])

  const currentViewIndex = useMemo(() => {
    return allViews.findIndex(v => v.id === activeViewId)
  }, [allViews, activeViewId])

  const goToPrevView = useCallback(() => {
    if (!isAnimating && allViews.length > 1) {
      setIsAnimating(true)
      setSlideDirection('right')
      setTimeout(() => {
        const prevIndex = currentViewIndex > 0 ? currentViewIndex - 1 : allViews.length - 1
        setActiveViewId(allViews[prevIndex].id)
        setTimeout(() => { setIsAnimating(false); setSlideDirection(null) }, 300)
      }, 150)
    }
  }, [currentViewIndex, allViews, isAnimating])

  const goToNextView = useCallback(() => {
    if (!isAnimating && allViews.length > 1) {
      setIsAnimating(true)
      setSlideDirection('left')
      setTimeout(() => {
        const nextIndex = currentViewIndex < allViews.length - 1 ? currentViewIndex + 1 : 0
        setActiveViewId(allViews[nextIndex].id)
        setTimeout(() => { setIsAnimating(false); setSlideDirection(null) }, 300)
      }, 150)
    }
  }, [currentViewIndex, allViews, isAnimating])

  const showViewNavigation = planViews.length > 0

  const handleSvgClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const id = (e.target as SVGElement).id || ((e.target as SVGElement).parentElement as SVGElement | null)?.id
    if (!id) return
    const unit = getUnit(id)
    if (unit) setSelectedUnit((p) => p?.id === unit.id ? null : unit)
  }, [getUnit])

  const handleViewSvgClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.target as Element
    const unitId = el.getAttribute?.('data-unit-id')
    if (!unitId) return
    const unit = units.find(u => u.id === unitId)
    if (unit) setSelectedUnit(p => p?.id === unit.id ? null : unit)
  }, [units])

  const handleSvgMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const id = (e.target as SVGElement).id || ((e.target as SVGElement).parentElement as SVGElement | null)?.id
    if (!id) { setHoveredUnit(null); setTooltip(null); return }
    const unit = getUnit(id)
    if (unit) {
      setHoveredUnit(unit.svgElementId)
      const rect = svgRef.current?.getBoundingClientRect()
      if (rect) setTooltip({ x: e.clientX - rect.left + 12, y: e.clientY - rect.top - 8, unit })
    } else { setHoveredUnit(null); setTooltip(null) }
  }, [getUnit])

  const clearFilters = () => {
    setFilterStatus('all'); setFilterRooms('all')
    setFilterAreaMin(''); setFilterAreaMax('')
    setFilterGardenMin(''); setFilterGardenMax('')
  }

  const hasFilters = filterStatus !== 'all' || filterRooms !== 'all' || filterAreaMin || filterAreaMax || filterGardenMin || filterGardenMax

  const counts = useMemo(() => ({
    available: units.filter((u) => u.status === 'available').length,
    reserved: units.filter((u) => u.status === 'reserved').length,
    sold: units.filter((u) => u.status === 'sold').length,
  }), [units])

  return (
    <section id="dostepnosc" className="py-24 lg:py-32 bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <div className="mx-auto max-w-3xl text-center mb-12">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">Dostępność</p>
          <h2 className="mt-4 font-serif text-3xl font-bold text-foreground md:text-5xl text-balance">
            {projectName}
          </h2>
          {description && (
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{description}</p>
          )}
        </div>

        <div className="space-y-6">
          {/* MAP VIEW */}
          <div className="space-y-5">
            <div className="mx-auto w-full max-w-[66.667%]">
            <div className="relative">
              {activeView ? (
                <div
                  className={`aspect-[4/3] rounded-2xl overflow-hidden shadow-xl transition-all duration-300 ease-out [&_svg]:w-full [&_svg]:h-full [&_svg]:block ${
                    isAnimating
                      ? slideDirection === 'left' ? 'opacity-0 translate-x-4' : 'opacity-0 -translate-x-4'
                      : 'opacity-100 translate-x-0'
                  }`}
                  onClick={handleViewSvgClick}
                  dangerouslySetInnerHTML={{ __html: coloredViewSvg(activeView) }}
                />
              ) : svgContent ? (
                <>
                  <div
                    ref={svgRef}
                    className={`aspect-[4/3] rounded-2xl overflow-hidden shadow-xl transition-all duration-300 ease-out [&_svg]:w-full [&_svg]:h-full [&_svg]:block ${
                      isAnimating
                        ? slideDirection === 'left' ? 'opacity-0 translate-x-4' : 'opacity-0 -translate-x-4'
                        : 'opacity-100 translate-x-0'
                    }`}
                    onClick={handleSvgClick}
                    onMouseMove={handleSvgMove}
                    onMouseLeave={() => { setHoveredUnit(null); setTooltip(null) }}
                    dangerouslySetInnerHTML={{ __html: coloredSvg() }}
                  />
                  {tooltip && (
                    <div
                      className="absolute z-10 bg-card border border-border/60 rounded-xl shadow-lg p-4 pointer-events-none text-sm"
                      style={{ left: tooltip.x, top: tooltip.y, maxWidth: 220 }}
                    >
                      <div className="font-serif font-semibold text-base text-foreground">{tooltip.unit.label}</div>
                      <div className="space-y-0.5 mt-1.5 text-muted-foreground">
                        {tooltip.unit.area && <div>{tooltip.unit.area} m²</div>}
                        {tooltip.unit.gardenArea && <div>Ogród: {tooltip.unit.gardenArea} m²</div>}
                        {tooltip.unit.rooms && <div>{tooltip.unit.rooms} pok.</div>}
                      </div>
                      <div className={`mt-2 text-xs font-medium inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-white ${STATUS_CONFIG[tooltip.unit.status as StatusKey]?.badgeBg}`}>
                        <span className={`h-1 w-1 rounded-full ${STATUS_CONFIG[tooltip.unit.status as StatusKey]?.dotColor}`} />
                        {STATUS_CONFIG[tooltip.unit.status as StatusKey]?.label}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="aspect-[4/3] flex items-center justify-center rounded-2xl overflow-hidden shadow-xl bg-secondary/50">
                  <p className="text-base text-muted-foreground">Plan zagospodarowania nie jest jeszcze dostępny.</p>
                </div>
              )}

              {/* Navigation arrows for plan views */}
              {showViewNavigation && (
                <>
                  <button
                    onClick={goToPrevView}
                    className="absolute left-3 top-4 z-20 flex items-center justify-center w-10 h-10 rounded-xl transition-all shadow-sm text-primary-foreground cursor-pointer hover:opacity-90 bg-primary/70"
                    aria-label="Poprzedni widok"
                    title={allViews[(currentViewIndex > 0 ? currentViewIndex - 1 : allViews.length - 1)]?.name}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={goToNextView}
                    className="absolute right-3 top-4 z-20 flex items-center justify-center w-10 h-10 rounded-xl transition-all shadow-sm text-primary-foreground cursor-pointer hover:opacity-90 bg-primary/70"
                    aria-label="Następny widok"
                    title={allViews[(currentViewIndex < allViews.length - 1 ? currentViewIndex + 1 : 0)]?.name}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 rounded-full text-primary-foreground text-sm font-medium shadow-sm bg-primary/80">
                    <span>{allViews[currentViewIndex]?.name}</span>
                    <span className="opacity-70">({currentViewIndex + 1}/{allViews.length})</span>
                  </div>
                </>
              )}
            </div>

              {/* Stats + Filtry below image, aligned to image edges */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-700">
                    <span className="font-bold">{counts.available}</span>
                    <span className="text-green-700/70">Dostępnych</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700">
                    <span className="font-bold">{counts.reserved}</span>
                    <span className="text-amber-700/70">Zarezerwowanych</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-700">
                    <span className="font-bold">{counts.sold}</span>
                    <span className="text-red-700/70">Sprzedanych</span>
                  </div>
                </div>
                <button
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors bg-primary/10 text-primary"
                >
                  <SlidersHorizontal className="h-3 w-3" />
                  <span>Filtry</span>
                  {hasFilters && (
                    <span className="px-1.5 py-0.5 text-xs text-primary-foreground rounded-full font-medium bg-primary">
                      {filteredUnits.length}/{units.length}
                    </span>
                  )}
                  <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${filtersOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Filters panel */}
              {filtersOpen && (
                <div className="mt-2 bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm p-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="h-7 text-xs border-border/60 bg-background"><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs">Wszystkie</SelectItem>
                        <SelectItem value="available" className="text-xs">Dostępna</SelectItem>
                        <SelectItem value="reserved" className="text-xs">Rezerwacja</SelectItem>
                        <SelectItem value="sold" className="text-xs">Sprzedana</SelectItem>
                      </SelectContent>
                    </Select>
                    {roomOptions.length > 0 && (
                      <Select value={filterRooms} onValueChange={setFilterRooms}>
                        <SelectTrigger className="h-7 text-xs border-border/60 bg-background"><SelectValue placeholder="Pokoje" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all" className="text-xs">Wszystkie</SelectItem>
                          {roomOptions.map((r) => (
                            <SelectItem key={r} value={String(r)} className="text-xs">{r} pokoje</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Input className="h-7 text-xs border-border/60 bg-background" placeholder="Pow. min m²" value={filterAreaMin} onChange={(e) => setFilterAreaMin(e.target.value)} type="number" />
                    <Input className="h-7 text-xs border-border/60 bg-background" placeholder="Pow. max m²" value={filterAreaMax} onChange={(e) => setFilterAreaMax(e.target.value)} type="number" />
                    <Input className="h-7 text-xs border-border/60 bg-background" placeholder="Ogród min m²" value={filterGardenMin} onChange={(e) => setFilterGardenMin(e.target.value)} type="number" />
                    <Input className="h-7 text-xs border-border/60 bg-background" placeholder="Ogród max m²" value={filterGardenMax} onChange={(e) => setFilterGardenMax(e.target.value)} type="number" />
                  </div>
                  {hasFilters && (
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60">
                      <p className="text-xs text-muted-foreground">
                        Pokazuje {filteredUnits.length} z {units.length} nieruchomości
                      </p>
                      <button onClick={clearFilters} className="text-xs flex items-center gap-1 transition-colors text-primary hover:opacity-80">
                        <X className="h-3 w-3" /> Wyczyść filtry
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>{/* end 66% wrapper */}

            {/* Sortable table below map */}
            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-secondary/50">
                      {([
                        ['label', 'Nr domu'],
                        ['area', 'Pow. m²'],
                        ['gardenArea', 'Ogród m²'],
                        ['rooms', 'Pokoje'],
                        ['price', 'Cena'],
                        ['status', 'Status'],
                      ] as [SortKey, string][]).map(([key, label]) => (
                        <th
                          key={key}
                          className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide cursor-pointer select-none transition-colors text-foreground hover:opacity-80"
                          onClick={() => handleSort(key)}
                        >
                          <span className="flex items-center">{label}<SortIcon k={key} /></span>
                        </th>
                      ))}
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-foreground">Typ</th>
                      <th className="px-5 py-4" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {sortedUnits.map((unit) => {
                      const cfg = STATUS_CONFIG[unit.status as StatusKey] || STATUS_CONFIG.available
                      return (
                        <Fragment key={unit.id}>
                          <tr
                            className={`hover:bg-secondary/30 transition-colors cursor-pointer ${selectedUnit?.id === unit.id ? 'bg-secondary/50' : ''}`}
                            onClick={() => {
                              setSelectedUnit((p) => p?.id === unit.id ? null : unit)
                              setExpandedUnitId((p) => p === unit.id ? null : unit.id)
                            }}
                          >
                            <td className="px-5 py-4 font-semibold text-foreground">{unit.label}</td>
                            <td className="px-5 py-4 text-muted-foreground">{unit.area ? `${unit.area}` : '—'}</td>
                            <td className="px-5 py-4 text-muted-foreground">{unit.gardenArea ? `${unit.gardenArea}` : '—'}</td>
                            <td className="px-5 py-4 text-muted-foreground">{unit.rooms ?? '—'}</td>
                            <td className="px-5 py-4 font-semibold text-primary">
                              {unit.price ? fmt(unit.price) : '—'}
                            </td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-sm text-white ${cfg.badgeBg}`}>
                                <span className={`h-1 w-1 rounded-full ${cfg.dotColor}`} />
                                {cfg.label}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-sm text-primary">
                              {unit.houseType ? (
                                <span className="inline-flex items-center gap-1">
                                  {unit.houseType.name}
                                  <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${expandedUnitId === unit.id ? 'rotate-180' : ''}`} />
                                </span>
                              ) : '—'}
                            </td>
                            <td className="px-5 py-4">
                              {unit.status === 'available' && (
                                <a
                                  href={`mailto:vlad@qualops.io?subject=Zapytanie o ${unit.label}`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Button size="sm" className="h-8 text-xs whitespace-nowrap font-medium rounded-lg">
                                    <Mail className="h-3.5 w-3.5 mr-1.5" />
                                    Zapytaj
                                  </Button>
                                </a>
                              )}
                            </td>
                          </tr>
                          {expandedUnitId === unit.id && unit.houseType && (
                            <tr>
                              <td colSpan={8} className="p-0">
                                <HouseTypeInlinePanel houseType={unit.houseType} />
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })}
                    {sortedUnits.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-5 py-16 text-center text-muted-foreground">
                          Brak wyników dla wybranych filtrów
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Selected unit detail */}
            {selectedUnit && (
              <UnitDetailCard unit={selectedUnit} onClose={() => setSelectedUnit(null)} />
            )}
          </div>

          {/* House Types Section - Carousel Style */}
          {houseTypes.length > 0 && (() => {
            const currentType = houseTypes[activeHouseTypeIndex]
            const currentFloor = currentType?.floorPlans[activeFloor]
            return (
              <div className="space-y-5 pt-4">
                <div className="text-center mb-8">
                  <h3 className="font-serif text-2xl lg:text-3xl font-semibold mb-2 text-foreground">
                    Typy domów
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Wybierz typ domu dopasowany do Twoich potrzeb
                  </p>
                </div>

                <div className="relative max-w-5xl mx-auto">
                  {houseTypes.length > 1 && (
                    <>
                      <button
                        onClick={() => { setActiveHouseTypeIndex((prev) => (prev === 0 ? houseTypes.length - 1 : prev - 1)); setActiveFloor(0); setFloorView('3d'); }}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-6 z-10 w-10 h-10 flex items-center justify-center rounded-sm transition-all hover:opacity-80 bg-primary/70"
                        aria-label="Poprzedni typ"
                      >
                        <ChevronLeft className="w-5 h-5 text-primary-foreground" />
                      </button>
                      <button
                        onClick={() => { setActiveHouseTypeIndex((prev) => (prev === houseTypes.length - 1 ? 0 : prev + 1)); setActiveFloor(0); setFloorView('3d'); }}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-6 z-10 w-10 h-10 flex items-center justify-center rounded-sm transition-all hover:opacity-80 bg-primary"
                        aria-label="Następny typ"
                      >
                        <ChevronRight className="w-5 h-5 text-primary-foreground" />
                      </button>
                    </>
                  )}

                  <div className="bg-card rounded-lg overflow-hidden shadow-lg border border-border/60">
                    <div className="flex items-center justify-between px-6 py-4 bg-primary">
                      <h4 className="font-serif text-xl lg:text-2xl font-semibold text-primary-foreground">
                        {currentType.name}
                      </h4>
                      <span className="text-xl lg:text-2xl font-semibold text-primary-foreground">
                        {currentType.totalArea ? `${currentType.totalArea} m²` : ''}
                      </span>
                    </div>

                    {currentType.floorPlans.length > 0 ? (
                      <div className="flex flex-col lg:flex-row">
                        <div className="lg:flex-[2] p-6">
                          <div className="flex gap-6 mb-6">
                            {currentType.floorPlans.map((floor, index) => (
                              <button
                                key={floor.id}
                                onClick={() => { setActiveFloor(index); setFloorView('3d'); }}
                                className={`text-left pb-1 transition-all ${activeFloor === index ? 'border-b-2 border-primary' : ''}`}
                              >
                                <p className={`font-medium ${activeFloor === index ? 'text-foreground' : 'text-muted-foreground'}`}>{floor.name}</p>
                                {floor.area && <p className={`text-sm ${activeFloor === index ? 'text-primary' : 'text-muted-foreground/50'}`}>{floor.area} m²</p>}
                              </button>
                            ))}
                          </div>

                          {currentFloor && (currentFloor.image3dUrl || currentFloor.image2dUrl) && (
                            <>
                              <div className="relative aspect-[4/3] bg-secondary rounded-lg overflow-hidden">
                                <img
                                  src={floorView === '3d'
                                    ? (currentFloor.image3dUrl ?? currentFloor.image2dUrl ?? '')
                                    : (currentFloor.image2dUrl ?? currentFloor.image3dUrl ?? '')}
                                  alt={`${currentType.name} - ${currentFloor.name} Rzut ${floorView === '3d' ? '3D' : '2D'}`}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <div className="flex mt-4">
                                {currentFloor.image3dUrl && (
                                  <button
                                    onClick={() => setFloorView('3d')}
                                    className={`px-4 py-2 text-sm font-medium transition-all ${!currentFloor.image2dUrl ? 'rounded-sm' : 'rounded-l-sm'} ${
                                      floorView === '3d' ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground border border-border'
                                    }`}
                                  >
                                    Rzut 3D
                                  </button>
                                )}
                                {currentFloor.image2dUrl && (
                                  <button
                                    onClick={() => setFloorView('2d')}
                                    className={`px-4 py-2 text-sm font-medium transition-all ${!currentFloor.image3dUrl ? 'rounded-sm' : 'rounded-r-sm'} ${
                                      floorView === '2d' ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground border border-border'
                                    }`}
                                  >
                                    Rzut 2D
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>

                        <div className="lg:flex-[1] p-6 lg:border-l border-border">
                          {currentFloor && currentFloor.rooms.length > 0 && (
                            <div>
                              <div className="flex justify-between mb-3 text-sm font-medium text-foreground">
                                <span>Pomieszczenie</span>
                                <span>Powierzchnia</span>
                              </div>
                              <div className="space-y-2">
                                {currentFloor.rooms.map((room, index) => (
                                  <div key={room.id} className="flex justify-between py-1">
                                    <span className="text-sm text-muted-foreground">
                                      <span className="inline-block w-5">{index + 1}</span>
                                      {room.name}
                                    </span>
                                    <span className="text-sm text-foreground">
                                      {room.area ? `${room.area} m²` : '—'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              {currentFloor.area && (
                                <div className="flex justify-between mt-4 pt-3 border-t border-border">
                                  <span className="text-sm font-semibold text-foreground">Razem</span>
                                  <span className="text-sm font-semibold text-primary">{currentFloor.area} m²</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-muted-foreground">
                        Brak planów kondygnacji dla tego typu domu.
                      </div>
                    )}
                  </div>

                  {houseTypes.length > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                      {houseTypes.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => { setActiveHouseTypeIndex(index); setActiveFloor(0); setFloorView('3d'); }}
                          className={`w-2.5 h-2.5 rounded-full transition-all bg-primary ${activeHouseTypeIndex === index ? '' : 'opacity-40'}`}
                          aria-label={`Typ domu ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })()}
        </div>
      </div>
    </section>
  )
}

function HouseTypeInlinePanel({ houseType }: { houseType: HouseType }) {
  const [activeFloor, setActiveFloor] = useState(0)
  const [floorView, setFloorView] = useState<'3d' | '2d'>('3d')
  const currentFloor = houseType.floorPlans[activeFloor]

  return (
    <div className="bg-secondary/10 border-t border-primary/20 border-b border-border/40">
      <div className="flex items-center justify-between px-6 py-3 bg-primary/90">
        <h4 className="font-serif text-lg font-semibold text-primary-foreground">{houseType.name}</h4>
        {houseType.totalArea && (
          <span className="text-lg font-semibold text-primary-foreground">{houseType.totalArea} m²</span>
        )}
      </div>

      {houseType.floorPlans.length > 0 ? (
        <div className="flex flex-col lg:flex-row">
          <div className="lg:flex-[2] p-6">
            {houseType.floorPlans.length > 1 && (
              <div className="flex gap-6 mb-6">
                {houseType.floorPlans.map((floor, index) => (
                  <button
                    key={floor.id}
                    onClick={() => { setActiveFloor(index); setFloorView('3d') }}
                    className={`text-left pb-1 transition-all ${activeFloor === index ? 'border-b-2 border-primary' : ''}`}
                  >
                    <p className={`font-medium ${activeFloor === index ? 'text-foreground' : 'text-muted-foreground'}`}>{floor.name}</p>
                    {floor.area && <p className={`text-sm ${activeFloor === index ? 'text-primary' : 'text-muted-foreground/50'}`}>{floor.area} m²</p>}
                  </button>
                ))}
              </div>
            )}

            {currentFloor && (currentFloor.image3dUrl || currentFloor.image2dUrl) && (
              <>
                <div className="relative aspect-[4/3] bg-secondary rounded-lg overflow-hidden">
                  <img
                    src={floorView === '3d'
                      ? (currentFloor.image3dUrl ?? currentFloor.image2dUrl ?? '')
                      : (currentFloor.image2dUrl ?? currentFloor.image3dUrl ?? '')}
                    alt={`${houseType.name} - ${currentFloor.name}`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex mt-4">
                  {currentFloor.image3dUrl && (
                    <button
                      onClick={() => setFloorView('3d')}
                      className={`px-4 py-2 text-sm font-medium transition-all ${!currentFloor.image2dUrl ? 'rounded-sm' : 'rounded-l-sm'} ${
                        floorView === '3d' ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground border border-border'
                      }`}
                    >
                      Rzut 3D
                    </button>
                  )}
                  {currentFloor.image2dUrl && (
                    <button
                      onClick={() => setFloorView('2d')}
                      className={`px-4 py-2 text-sm font-medium transition-all ${!currentFloor.image3dUrl ? 'rounded-sm' : 'rounded-r-sm'} ${
                        floorView === '2d' ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground border border-border'
                      }`}
                    >
                      Rzut 2D
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {currentFloor && currentFloor.rooms.length > 0 && (
            <div className="lg:flex-[1] p-6 lg:border-l border-border">
              <div className="flex justify-between mb-3 text-sm font-medium text-foreground">
                <span>Pomieszczenie</span>
                <span>Powierzchnia</span>
              </div>
              <div className="space-y-2">
                {currentFloor.rooms.map((room, index) => (
                  <div key={room.id} className="flex justify-between py-1">
                    <span className="text-sm text-muted-foreground">
                      <span className="inline-block w-5">{index + 1}</span>
                      {room.name}
                    </span>
                    <span className="text-sm text-foreground">
                      {room.area ? `${room.area} m²` : '—'}
                    </span>
                  </div>
                ))}
              </div>
              {currentFloor.area && (
                <div className="flex justify-between mt-4 pt-3 border-t border-border">
                  <span className="text-sm font-semibold text-foreground">Razem</span>
                  <span className="text-sm font-semibold text-primary">{currentFloor.area} m²</span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground text-sm">
          Brak planów kondygnacji dla tego typu domu.
        </div>
      )}
    </div>
  )
}

function UnitDetailCard({ unit, onClose }: { unit: Unit; onClose: () => void }) {
  const cfg = STATUS_CONFIG[unit.status as StatusKey] || STATUS_CONFIG.available
  return (
    <div className="border-2 border-primary rounded-2xl overflow-hidden bg-card shadow-sm">
      <div className="flex items-start justify-between p-5 bg-secondary/30 border-b border-border/60">
        <div>
          <h3 className="text-xl font-serif font-semibold text-foreground">{unit.label}</h3>
          {unit.houseType && <p className="text-sm mt-0.5 text-primary">{unit.houseType.name}</p>}
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-sm text-white ${cfg.badgeBg}`}>
            <span className={`h-1 w-1 rounded-full ${cfg.dotColor}`} />
            {cfg.label}
          </span>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-primary">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="p-5">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mb-5">
          {unit.area && <><dt className="text-muted-foreground">Powierzchnia</dt><dd className="font-semibold text-foreground">{unit.area} m²</dd></>}
          {unit.gardenArea && <><dt className="text-muted-foreground">Ogród</dt><dd className="font-semibold text-foreground">{unit.gardenArea} m²</dd></>}
          {unit.rooms && <><dt className="text-muted-foreground">Pokoje</dt><dd className="font-semibold text-foreground">{unit.rooms}</dd></>}
          {unit.floor && <><dt className="text-muted-foreground">Piętro</dt><dd className="font-semibold text-foreground">{unit.floor}</dd></>}
          {unit.price && <><dt className="text-muted-foreground">Cena</dt><dd className="font-semibold text-lg text-primary">{fmt(unit.price)}</dd></>}
        </dl>
        {unit.description && <p className="text-sm mb-5 text-muted-foreground">{unit.description}</p>}
        {unit.status === 'available' && (
          <a href={`mailto:vlad@qualops.io?subject=Zapytanie o ${unit.label}`}>
            <Button className="w-full h-11 text-sm font-medium rounded-xl">
              <Mail className="h-4 w-4 mr-2" />
              Zapytaj o tę nieruchomość
            </Button>
          </a>
        )}
      </div>
    </div>
  )
}
