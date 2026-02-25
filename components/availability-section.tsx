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
  { label: string; overlayColor: string; badgeBg: string; badgeText: string; dotColor: string }
> = {
  available: {
    label: "Dostepny",
    overlayColor: "bg-green-500/25",
    badgeBg: "bg-green-600",
    badgeText: "text-white",
    dotColor: "bg-green-400",
  },
  reserved: {
    label: "Zarezerwowany",
    overlayColor: "bg-amber-500/25",
    badgeBg: "bg-amber-500",
    badgeText: "text-white",
    dotColor: "bg-amber-400",
  },
  sold: {
    label: "Sprzedany",
    overlayColor: "bg-red-500/25",
    badgeBg: "bg-red-600",
    badgeText: "text-white",
    dotColor: "bg-red-400",
  },
};

const legendItems: { status: UnitStatus; label: string; dotColor: string }[] = [
  { status: "available", label: "Dostepny", dotColor: "bg-green-500" },
  { status: "reserved", label: "Zarezerwowany", dotColor: "bg-amber-500" },
  { status: "sold", label: "Sprzedany", dotColor: "bg-red-500" },
];

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
        isActive
          ? "translate-y-0 opacity-100"
          : "translate-y-2 opacity-60"
      }`}
    >
      <div className={`${side === "left" ? "text-left" : "text-right"}`}>
        <div className={`flex items-center gap-2.5 ${side === "right" ? "justify-end" : ""}`}>
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
              <span className="font-semibold text-foreground">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AvailabilitySection() {
  const [activeUnit, setActiveUnit] = useState<"A" | "B" | null>(null);

  return (
    <section id="dostepnosc" className="py-24 lg:py-32 bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">
            {"Dostepnosc"}
          </p>
          <h2 className="mt-4 font-serif text-3xl font-bold text-foreground md:text-5xl text-balance">
            {"Wybierz swoj segment"}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground text-pretty">
            {"Kazdy segment to niezalezna jednostka mieszkalna z osobnym wejsciem, garazem i ogrodem. Najedz na segment, aby poznac szczegoly."}
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

        {/* Interactive house image */}
        <div className="mx-auto mt-16 max-w-5xl">
          <div
            className="relative mx-auto overflow-hidden shadow-2xl"
            onMouseLeave={() => setActiveUnit(null)}
          >
            {/* House image */}
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/now_get_back_lower_part_a_a_br_Nano_Banana_Pro_67357-CH4slykgCukLyUn9JsGHpDNNIzrRc5.jpg"
              alt="Wizualizacja architektoniczna zabudowy blizniacze - widok z przodu"
              className="block w-full"
              crossOrigin="anonymous"
            />

            {/* Segment A overlay - left half */}
            <button
              className="absolute inset-y-0 left-0 w-1/2 cursor-pointer border-0 bg-transparent p-0 focus:outline-none group"
              onMouseEnter={() => setActiveUnit("A")}
              onClick={() =>
                setActiveUnit((prev) => (prev === "A" ? null : "A"))
              }
              aria-label="Segment A - Dostepny"
            >
              {/* Color tint overlay */}
              <div
                className={`absolute inset-0 transition-all duration-500 ${
                  statusConfig[units.A.status].overlayColor
                } ${
                  activeUnit === "A"
                    ? "opacity-80"
                    : activeUnit === null
                    ? "opacity-40"
                    : "opacity-20"
                }`}
              />
              {/* Segment label on the house */}
              <div
                className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
                  activeUnit === "A" ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
              >
                <div className="bg-black/60 backdrop-blur-sm px-6 py-3">
                  <span className="text-white text-lg font-bold tracking-wide">
                    SEGMENT A
                  </span>
                </div>
              </div>
              {/* Divider line */}
              <div className="absolute right-0 top-0 h-full w-px bg-white/40" />
            </button>

            {/* Segment B overlay - right half */}
            <button
              className="absolute inset-y-0 right-0 w-1/2 cursor-pointer border-0 bg-transparent p-0 focus:outline-none group"
              onMouseEnter={() => setActiveUnit("B")}
              onClick={() =>
                setActiveUnit((prev) => (prev === "B" ? null : "B"))
              }
              aria-label="Segment B - Zarezerwowany"
            >
              {/* Color tint overlay */}
              <div
                className={`absolute inset-0 transition-all duration-500 ${
                  statusConfig[units.B.status].overlayColor
                } ${
                  activeUnit === "B"
                    ? "opacity-80"
                    : activeUnit === null
                    ? "opacity-40"
                    : "opacity-20"
                }`}
              />
              {/* Segment label on the house */}
              <div
                className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
                  activeUnit === "B" ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
              >
                <div className="bg-black/60 backdrop-blur-sm px-6 py-3">
                  <span className="text-white text-lg font-bold tracking-wide">
                    SEGMENT B
                  </span>
                </div>
              </div>
            </button>
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

        {/* Divider label */}
        <div className="mx-auto mt-10 max-w-3xl text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground/60">
            {"Zabudowa blizniacza - dwa niezalezne segmenty"}
          </p>
        </div>
      </div>
    </section>
  );
}
