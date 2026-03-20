'use client'

import { useState } from 'react'

type Unit = {
  id: string
  svgElementId: string
  label: string
  status: string
  area: number | null
  gardenArea: number | null
  rooms: number | null
  floors: number | null
  floor: string | null
  stage: string | null
  price: number | null
  description: string | null
}

type Project = {
  name: string
  svgContent: string | null
  planImageUrl: string | null
  units: Unit[]
}

const statusConfig: Record<string, { label: string; color: string; badgeBg: string; dotColor: string }> = {
  available: { label: 'Dostępna', color: '#22c55e', badgeBg: 'bg-green-600', dotColor: 'bg-green-400' },
  reserved:  { label: 'Zarezerwowana', color: '#f59e0b', badgeBg: 'bg-amber-500', dotColor: 'bg-amber-400' },
  sold:      { label: 'Sprzedana', color: '#ef4444', badgeBg: 'bg-red-600', dotColor: 'bg-red-400' },
}

const fillOpacity = '0.45'
const fillOpacityActive = '0.7'

function UnitCard({ unit }: { unit: Unit }) {
  const cfg = statusConfig[unit.status] ?? statusConfig.available
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-border pb-2.5 mb-3">
        <h3 className="font-serif text-base font-bold text-foreground">{unit.label}</h3>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-sm text-white ${cfg.badgeBg}`}>
          <span className={`h-1 w-1 rounded-full ${cfg.dotColor}`} />
          {cfg.label}
        </span>
      </div>
      <dl className="flex flex-col gap-1.5">
        {unit.area != null && (
          <div className="flex justify-between text-xs">
            <dt className="text-muted-foreground">Powierzchnia</dt>
            <dd className="font-semibold">{unit.area} m²</dd>
          </div>
        )}
        {unit.gardenArea != null && (
          <div className="flex justify-between text-xs">
            <dt className="text-muted-foreground">Ogród</dt>
            <dd className="font-semibold">{unit.gardenArea} m²</dd>
          </div>
        )}
        {unit.rooms != null && (
          <div className="flex justify-between text-xs">
            <dt className="text-muted-foreground">Pokoje</dt>
            <dd className="font-semibold">{unit.rooms}</dd>
          </div>
        )}
        {unit.floors != null && (
          <div className="flex justify-between text-xs">
            <dt className="text-muted-foreground">Piętra</dt>
            <dd className="font-semibold">{unit.floors}</dd>
          </div>
        )}
        {unit.stage != null && (
          <div className="flex justify-between text-xs">
            <dt className="text-muted-foreground">Etap</dt>
            <dd className="font-semibold">{unit.stage}</dd>
          </div>
        )}
        {unit.price != null && (
          <div className="flex justify-between text-xs">
            <dt className="text-muted-foreground">Cena</dt>
            <dd className="font-semibold">{unit.price.toLocaleString('pl-PL')} PLN</dd>
          </div>
        )}
      </dl>
      {unit.description && (
        <p className="mt-2 text-xs text-muted-foreground border-t border-border pt-2">{unit.description}</p>
      )}
    </div>
  )
}

function SvgPlan({ svgContent, units, activeUnit, onUnitClick }: {
  svgContent: string
  units: Unit[]
  activeUnit: string | null
  onUnitClick: (id: string) => void
}) {
  // Inject colour overlays by replacing fill on matching elements via dangerouslySetInnerHTML
  // We parse and modify the SVG string to colorize each unit element
  let svg = svgContent

  units.forEach((unit) => {
    const cfg = statusConfig[unit.status] ?? statusConfig.available
    const isActive = activeUnit === unit.id
    const opacity = isActive ? fillOpacityActive : fillOpacity
    const hex = cfg.color

    // Replace fill on the element with matching id
    // Works for both <path id="X" and <rect id="X" etc.
    const idPattern = new RegExp(
      `(id="${unit.svgElementId}"[^>]*?)(?:fill="[^"]*")?`,
      'g'
    )
    svg = svg.replace(idPattern, `$1fill="${hex}" fill-opacity="${opacity}" style="cursor:pointer"`)
  })

  return (
    <div
      className="w-full overflow-hidden rounded-lg border border-border bg-white shadow-lg"
      dangerouslySetInnerHTML={{ __html: svg }}
      onClick={(e) => {
        const target = e.target as SVGElement
        const el = target.closest('[id]') as SVGElement | null
        if (!el) return
        const unit = units.find((u) => u.svgElementId === el.id)
        if (unit) onUnitClick(unit.id)
      }}
    />
  )
}

export function DynamicAvailabilitySection({ project }: { project: Project }) {
  const [activeUnit, setActiveUnit] = useState<string | null>(null)

  const handleUnitClick = (id: string) => {
    setActiveUnit((prev) => (prev === id ? null : id))
  }

  const activeUnitData = project.units.find((u) => u.id === activeUnit)

  const legendItems = [
    { status: 'available', label: 'Dostępna', dotColor: 'bg-green-500' },
    { status: 'reserved', label: 'Zarezerwowana', dotColor: 'bg-amber-500' },
    { status: 'sold', label: 'Sprzedana', dotColor: 'bg-red-500' },
  ]

  return (
    <section id="dostepnosc" className="py-24 lg:py-32 bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">Dostępność</p>
          <h2 className="mt-4 font-serif text-3xl font-bold text-foreground md:text-5xl text-balance">
            Wybierz swoją działkę
          </h2>
          {project.units.length > 0 && (
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Kliknij na wybraną działkę aby poznać szczegóły.
            </p>
          )}
        </div>

        {/* Legend */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
          {legendItems.map((item) => (
            <div key={item.status} className="flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ${item.dotColor}`} />
              <span className="text-sm text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Plan */}
        {project.svgContent ? (
          <div className="mx-auto mt-12 max-w-4xl">
            <SvgPlan
              svgContent={project.svgContent}
              units={project.units}
              activeUnit={activeUnit}
              onUnitClick={handleUnitClick}
            />
          </div>
        ) : project.planImageUrl ? (
          <div className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-lg border border-border shadow-lg">
            <img src={project.planImageUrl} alt="Plan inwestycji" className="w-full" />
          </div>
        ) : null}

        {/* Active unit card */}
        {activeUnitData && (
          <div className="mx-auto mt-8 max-w-sm">
            <UnitCard unit={activeUnitData} />
          </div>
        )}

        {/* All units grid when no SVG */}
        {!project.svgContent && project.units.length > 0 && (
          <div className="mx-auto mt-12 max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {project.units.map((unit) => (
              <UnitCard key={unit.id} unit={unit} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
