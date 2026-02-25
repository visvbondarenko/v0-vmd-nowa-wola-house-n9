"use client";

import { useState } from "react";

type UnitStatus = "available" | "reserved" | "sold";

interface UnitInfo {
  name: string;
  label: string;
  area: string;
  rooms: string;
  floors: string;
  status: UnitStatus;
}

// ========================================
// EASY TO CHANGE STATUS:
// Just change "available" to "reserved" or "sold"
// ========================================
const units: Record<"A" | "B", UnitInfo> = {
  A: {
    name: "A",
    label: "Segment A",
    area: "144 m²",
    rooms: "5 pokoi",
    floors: "2 kondygnacje",
    status: "available", // "available" | "reserved" | "sold"
  },
  B: {
    name: "B",
    label: "Segment B",
    area: "144 m²",
    rooms: "5 pokoi",
    floors: "2 kondygnacje",
    status: "reserved", // "available" | "reserved" | "sold"
  },
};

const statusConfig: Record<
  UnitStatus,
  { color: string; bgColor: string; borderColor: string; label: string; dotColor: string }
> = {
  available: {
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-300",
    label: "Dostępny",
    dotColor: "bg-green-500",
  },
  reserved: {
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-300",
    label: "Zarezerwowany",
    dotColor: "bg-amber-500",
  },
  sold: {
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-300",
    label: "Sprzedany",
    dotColor: "bg-red-500",
  },
};

function UnitCard({ unit, side }: { unit: UnitInfo; side: "left" | "right" }) {
  const config = statusConfig[unit.status];

  return (
    <div
      className={`group relative flex flex-col items-center transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
        side === "left" ? "items-end" : "items-start"
      }`}
    >
      {/* House half */}
      <div
        className={`relative w-full overflow-hidden border-2 transition-all duration-300 ${config.borderColor} ${config.bgColor} hover:shadow-xl`}
      >
        {/* Roof shape - SVG triangle */}
        <div className="relative">
          <svg
            viewBox="0 0 300 120"
            className="w-full"
            preserveAspectRatio="none"
          >
            <polygon
              points="150,10 10,120 290,120"
              className="fill-foreground/10 stroke-foreground/20"
              strokeWidth="1"
            />
            {/* Windows in roof */}
            <polygon
              points="150,40 110,90 190,90"
              className="fill-background stroke-foreground/30"
              strokeWidth="1.5"
            />
          </svg>
        </div>

        {/* Upper floor */}
        <div className="border-t border-foreground/10 bg-foreground/5 px-6 py-4">
          <div className="flex justify-center gap-4">
            <div className="h-16 w-10 border border-foreground/20 bg-background/80" />
            <div className="h-16 w-10 border border-foreground/20 bg-background/80" />
          </div>
        </div>

        {/* Lower floor - brick pattern */}
        <div className="relative border-t border-foreground/10 bg-[#c4775a]/15 px-6 py-6">
          <div className="flex justify-center gap-6">
            <div className="h-14 w-20 border border-foreground/15 bg-background/60" />
            <div className="h-14 w-12 border border-foreground/15 bg-background/60" />
          </div>
        </div>

        {/* Status badge */}
        <div
          className={`absolute top-4 ${
            side === "left" ? "right-4" : "left-4"
          } flex items-center gap-2 px-3 py-1.5 text-xs font-semibold ${config.color} ${config.bgColor} border ${config.borderColor}`}
        >
          <span className={`h-2 w-2 rounded-full ${config.dotColor}`} />
          {config.label}
        </div>
      </div>

      {/* Unit info */}
      <div className={`mt-6 w-full ${side === "left" ? "text-right" : "text-left"}`}>
        <h3 className="font-serif text-2xl font-bold text-foreground">
          {unit.label}
        </h3>
        <div className="mt-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground justify-between">
            <span>Powierzchnia</span>
            <span className="font-semibold text-foreground">{unit.area}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground justify-between">
            <span>Pokoje</span>
            <span className="font-semibold text-foreground">{unit.rooms}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground justify-between">
            <span>Kondygnacje</span>
            <span className="font-semibold text-foreground">{unit.floors}</span>
          </div>
        </div>
      </div>

      {/* Hover tooltip - desktop only */}
      <div className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full opacity-0 transition-all duration-300 group-hover:opacity-100 hidden lg:block">
        <div className="bg-foreground text-background px-4 py-3 text-center shadow-lg">
          <p className="text-sm font-bold">{unit.label}</p>
          <p className="text-xs opacity-80">{unit.area}</p>
          <p className={`text-xs font-semibold mt-1 ${
            unit.status === "available" ? "text-green-400" :
            unit.status === "reserved" ? "text-amber-400" : "text-red-400"
          }`}>
            {config.label}
          </p>
        </div>
        <div className="mx-auto h-0 w-0 border-x-8 border-t-8 border-x-transparent border-t-foreground" />
      </div>
    </div>
  );
}

export function AvailabilitySection() {
  const [, setActiveUnit] = useState<"A" | "B" | null>(null);

  return (
    <section id="dostepnosc" className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">
            Dostępność
          </p>
          <h2 className="mt-4 font-serif text-3xl font-bold text-foreground md:text-5xl text-balance">
            Wybierz swój segment
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground text-pretty">
            Każdy segment to niezależna jednostka mieszkalna z osobnym wejściem,
            garażem i ogrodem. Najedź na segment, aby poznać szczegóły.
          </p>
        </div>

        {/* Legend */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6">
          {(Object.entries(statusConfig) as [UnitStatus, typeof statusConfig.available][]).map(
            ([, config]) => (
              <div key={config.label} className="flex items-center gap-2">
                <span
                  className={`h-3 w-3 rounded-full ${config.dotColor}`}
                />
                <span className="text-sm text-muted-foreground">
                  {config.label}
                </span>
              </div>
            )
          )}
        </div>

        {/* Interactive duplex */}
        <div
          className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-6"
          onMouseLeave={() => setActiveUnit(null)}
        >
          <div onMouseEnter={() => setActiveUnit("A")}>
            <UnitCard unit={units.A} side="left" />
          </div>
          <div onMouseEnter={() => setActiveUnit("B")}>
            <UnitCard unit={units.B} side="right" />
          </div>
        </div>

        {/* Divider label */}
        <div className="mx-auto mt-8 max-w-3xl text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground/60">
            Zabudowa bliźniacza - dwa niezależne segmenty
          </p>
        </div>
      </div>
    </section>
  );
}
