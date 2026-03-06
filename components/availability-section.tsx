"use client";

import { useState } from "react";

type UnitStatus = "available" | "reserved" | "sold";

interface UnitInfo {
  name: string;
  label: string;
  area: string;
  rooms: string;
  baths: string;
  features: string;
  status: UnitStatus;
}

const units: Record<"A" | "B", UnitInfo> = {
  A: {
    name: "A",
    label: "Segment A",
    area: "130 m²",
    rooms: "5 pokoi + gabinet",
    baths: "3 pełne łazienki",
    features: "Pralnia, sypialnia master z en-suite, przestronny garaż, sufit 4m na II p.",
    status: "available",
  },
  B: {
    name: "B",
    label: "Segment B",
    area: "130 m²",
    rooms: "5 pokoi + gabinet",
    baths: "3 pełne łazienki",
    features: "Pralnia, sypialnia master z en-suite, przestronny garaż, sufit 4m na II p.",
    status: "reserved",
  },
};

const statusConfig: Record<
  UnitStatus,
  { label: string; color: string; badgeBg: string; badgeText: string; dotColor: string }
> = {
  available: {
    label: "Dostępny",
    color: "rgba(34,197,94,0.35)",
    badgeBg: "bg-green-600",
    badgeText: "text-white",
    dotColor: "bg-green-400",
  },
  reserved: {
    label: "Zarezerwowany",
    color: "rgba(245,158,11,0.35)",
    badgeBg: "bg-amber-500",
    badgeText: "text-white",
    dotColor: "bg-amber-400",
  },
  sold: {
    label: "Sprzedany",
    color: "rgba(239,68,68,0.35)",
    badgeBg: "bg-red-600",
    badgeText: "text-white",
    dotColor: "bg-red-400",
  },
};

const statusColorActive: Record<UnitStatus, string> = {
  available: "rgba(34,197,94,0.55)",
  reserved: "rgba(245,158,11,0.55)",
  sold: "rgba(239,68,68,0.55)",
};

const legendItems: { status: UnitStatus; label: string; dotColor: string }[] = [
  { status: "available", label: "Dostępny", dotColor: "bg-green-500" },
  { status: "reserved", label: "Zarezerwowany", dotColor: "bg-amber-500" },
  { status: "sold", label: "Sprzedany", dotColor: "bg-red-500" },
];

/*
 * Clip-path polygons tracing each half of the house.
 * Coordinates are % of the image container.
 * The house center seam is at ~50%.
 * Left segment (A): from left wall up to the gable peak, down to base.
 * Right segment (B): from center seam up to the right gable peak, down to right wall.
 */

// Segment A (left / green outline): bottom-left wall → up left wall →
// left gable peak → down to center seam → straight down to bottom.
// Traced from the user-annotated screenshot.
const clipA =
  "polygon(3% 93%, 3% 55%, 6% 55%, 6% 37%, 24% 13%, 41% 31%, 43% 25%, 43% 93%)";

// Segment B (right / red outline): center seam → up to right gable peak →
// down right side → right wall → bottom-right.
const clipB =
  "polygon(43% 93%, 43% 25%, 46% 20%, 48% 27%, 69% 9%, 91% 30%, 93% 48%, 96% 48%, 96% 93%)";

function InfoCard({
  unit,
  isActive,
  side,
}: {
  unit: UnitInfo;
  isActive: boolean;
  side: "left" | "right";
}) {
  const config = statusConfig[unit.status];

  return (
    <div
      className={`transition-all duration-500 ${
        isActive ? "translate-y-0 opacity-100" : "translate-y-2 opacity-60"
      }`}
    >
      <div className={`${side === "left" ? "text-left" : "text-right"}`}>
        <div
          className={`flex items-center gap-2.5 ${
            side === "right" ? "justify-end" : ""
          }`}
        >
          <h3 className="font-serif text-2xl font-bold text-foreground md:text-3xl">
            {unit.label}
          </h3>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold ${config.badgeBg} ${config.badgeText}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${config.dotColor}`} />
            {config.label}
          </span>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          {[
            { label: "Powierzchnia", value: unit.area },
            { label: "Układ", value: unit.rooms },
            { label: "Łazienki", value: unit.baths },
            { label: "Standard", value: unit.features },
          ].map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-2 text-sm ${
                side === "right" ? "justify-end" : ""
              }`}
            >
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-semibold text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AvailabilitySection() {
  const [activeUnit, setActiveUnit] = useState<"A" | "B" | null>(null);

  const getOverlayStyle = (
    segment: "A" | "B"
  ): React.CSSProperties => {
    const unit = units[segment];
    const isActive = activeUnit === segment;
    const isIdle = activeUnit === null;
    const clip = segment === "A" ? clipA : clipB;

    return {
      position: "absolute",
      inset: 0,
      clipPath: clip,
      WebkitClipPath: clip,
      backgroundColor: isActive
        ? statusColorActive[unit.status]
        : isIdle
        ? statusConfig[unit.status].color
        : "rgba(0,0,0,0.05)",
      transition: "background-color 0.5s ease",
      cursor: "pointer",
    };
  };

  return (
    <section id="dostepnosc" className="py-24 lg:py-32 bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">
            {"Dostępność"}
          </p>
          <h2 className="mt-4 font-serif text-3xl font-bold text-foreground md:text-5xl text-balance">
            {"Wybierz swój segment"}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground text-pretty">
            {"Każdy segment to niezależna jednostka mieszkalna z osobnym wejściem, garażem i ogrodem. Najedź na segment, aby poznać szczegóły."}
          </p>
        </div>

        {/* Legend */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6">
          {legendItems.map((item) => (
            <div key={item.status} className="flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ${item.dotColor}`} />
              <span className="text-sm text-muted-foreground">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Interactive house image - constrained width */}
        <div className="mx-auto mt-16 max-w-3xl">
          <div
            className="relative mx-auto overflow-hidden rounded-lg"
            onMouseLeave={() => setActiveUnit(null)}
          >
            {/* House image */}
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/now_get_back_lower_part_a_a_br_Nano_Banana_Pro_67357-CH4slykgCukLyUn9JsGHpDNNIzrRc5.jpg"
              alt="Wizualizacja architektoniczna zabudowy bliźniaczej - widok z przodu"
              className="block w-full"
              draggable={false}
            />

            {/* Segment A overlay - clipped to left half of house */}
            <button
              type="button"
              className="absolute inset-0 border-0 bg-transparent p-0 focus:outline-none"
              style={getOverlayStyle("A")}
              onMouseEnter={() => setActiveUnit("A")}
              onClick={() =>
                setActiveUnit((prev) => (prev === "A" ? null : "A"))
              }
              aria-label="Segment A - Dostępny"
            />

            {/* Segment B overlay - clipped to right half of house */}
            <button
              type="button"
              className="absolute inset-0 border-0 bg-transparent p-0 focus:outline-none"
              style={getOverlayStyle("B")}
              onMouseEnter={() => setActiveUnit("B")}
              onClick={() =>
                setActiveUnit((prev) => (prev === "B" ? null : "B"))
              }
              aria-label="Segment B - Zarezerwowany"
            />

            {/* Segment A label */}
            <div
              className={`pointer-events-none absolute left-[23%] top-[55%] -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ${
                activeUnit === "A"
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-90"
              }`}
            >
              <div className="bg-black/70 backdrop-blur-sm px-5 py-2.5 rounded">
                <span className="text-white text-sm font-bold tracking-widest uppercase">
                  Segment A
                </span>
              </div>
            </div>

            {/* Segment B label */}
            <div
              className={`pointer-events-none absolute left-[70%] top-[55%] -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ${
                activeUnit === "B"
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-90"
              }`}
            >
              <div className="bg-black/70 backdrop-blur-sm px-5 py-2.5 rounded">
                <span className="text-white text-sm font-bold tracking-widest uppercase">
                  Segment B
                </span>
              </div>
            </div>

            {/* Center divider line on the house */}
            <div
              className="pointer-events-none absolute top-[25%] bottom-[7%] left-[43%] w-px bg-white/50"
            />
          </div>

          {/* Unit info cards below the image */}
          <div className="mt-10 grid grid-cols-2 gap-8 lg:gap-16">
            <InfoCard
              unit={units.A}
              isActive={activeUnit === "A" || activeUnit === null}
              side="left"
            />
            <InfoCard
              unit={units.B}
              isActive={activeUnit === "B" || activeUnit === null}
              side="right"
            />
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-3xl text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground/60">
            {"Zabudowa bliźniacza — dwa niezależne segmenty"}
          </p>
        </div>
      </div>
    </section>
  );
}
