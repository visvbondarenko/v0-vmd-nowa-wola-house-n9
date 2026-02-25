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

const units: Record<"A" | "B", UnitInfo> = {
  A: {
    name: "A",
    label: "Segment A",
    area: "144 m\u00B2",
    rooms: "5 pokoi",
    floors: "2 kondygnacje",
    status: "available",
  },
  B: {
    name: "B",
    label: "Segment B",
    area: "144 m\u00B2",
    rooms: "5 pokoi",
    floors: "2 kondygnacje",
    status: "reserved",
  },
};

const statusConfig: Record<
  UnitStatus,
  { label: string; color: string; badgeBg: string; badgeText: string; dotColor: string }
> = {
  available: {
    label: "Dost\u0119pny",
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
  { status: "available", label: "Dost\u0119pny", dotColor: "bg-green-500" },
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

// Segment A (left half of house) – traces from bottom-left of house,
// up the left wall, across the left gable peak, down to center seam at ~47%.
const clipA =
  "polygon(4% 80%, 4% 50%, 7% 50%, 7% 32%, 25% 14%, 42% 31%, 42% 25%, 47% 20%, 47% 80%)";

// Segment B (right half of house) – from center seam at ~47%,
// up the right gable peak, down the right wall to bottom-right.
const clipB =
  "polygon(47% 80%, 47% 20%, 52% 25%, 52% 31%, 70% 12%, 90% 32%, 90% 50%, 94% 50%, 94% 80%)";

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
            { label: "Pokoje", value: unit.rooms },
            { label: "Kondygnacje", value: unit.floors },
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
            {"Dost\u0119pno\u015b\u0107"}
          </p>
          <h2 className="mt-4 font-serif text-3xl font-bold text-foreground md:text-5xl text-balance">
            {"Wybierz sw\u00f3j segment"}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground text-pretty">
            {
              "Ka\u017cdy segment to niezale\u017cna jednostka mieszkalna z osobnym wej\u015bciem, gara\u017cem i ogrodem. Naje\u017ad\u017c na segment, aby pozna\u0107 szczeg\u00f3\u0142y."
            }
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
              alt="Wizualizacja architektoniczna zabudowy bli\u017aniaczej - widok z przodu"
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
              aria-label="Segment A - Dost\u0119pny"
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
              className={`pointer-events-none absolute left-[25%] top-[50%] -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ${
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
              className={`pointer-events-none absolute left-[72%] top-[50%] -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ${
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
              className="pointer-events-none absolute top-[20%] bottom-[20%] left-[47%] w-px bg-white/50"
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
            {"Zabudowa bli\u017aniacza \u2014 dwa niezale\u017cne segmenty"}
          </p>
        </div>
      </div>
    </section>
  );
}
