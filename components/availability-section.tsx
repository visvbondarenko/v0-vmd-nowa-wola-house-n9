"use client";

import { useState } from "react";

const floorPlans = [
  {
    id: "parter",
    label: "Parter",
    features: ["Garaż", "Gabinet", "Hol", "Łazienka", "Salon z aneksem kuchennym", "Taras"],
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-03-06%20at%2023.35.35-7hBaMOTt2vIZWxEZwuSsi3iNga4Rj1.png",
    alt: "Rzut parteru — Wola House",
  },
  {
    id: "pietro",
    label: "Piętro",
    features: ["3 sypialnie w tym główna", "2 łazienki", "Duży hol", "Pralnia"],
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-03-06%20at%2023.35.42-DzhXUCvhOF3ybmGOLKdFb1fUKBfdIg.png",
    alt: "Rzut piętra — Wola House",
  },
];

type UnitStatus = "available" | "reserved" | "sold";

interface UnitInfo {
  name: string;
  label: string;
  status: UnitStatus;
  specs: { label: string; value: string }[];
  features: string[];
}

const sharedSpecs = [
  { label: "Powierzchnia", value: "130 m²" },
  { label: "Pokoje", value: "5 pokoi" },
  { label: "Łazienki", value: "3 łazienki" },
  { label: "Ogród", value: "300 m²" },
];

const sharedFeatures = [
  "Garaż",
  "Gabinet",
  "Pralnia",
  "Sypialnia master z garderobą i łazienką",
  "Sufity 4+ m na II piętrze",
  "Prywatny ogród 300 m²",
];

const units: Record<"A" | "B", UnitInfo> = {
  A: {
    name: "A",
    label: "Segment A",
    status: "available",
    specs: sharedSpecs,
    features: sharedFeatures,
  },
  B: {
    name: "B",
    label: "Segment B",
    status: "reserved",
    specs: sharedSpecs,
    features: sharedFeatures,
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



function InfoCard({ unit, isActive }: { unit: UnitInfo; isActive: boolean }) {
  const config = statusConfig[unit.status];

  return (
    <div
      className={`transition-all duration-500 ${
        isActive ? "opacity-100 translate-y-0" : "opacity-50 translate-y-1"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <h3 className="font-serif text-2xl font-bold text-foreground">
          {unit.label}
        </h3>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-sm ${config.badgeBg} ${config.badgeText}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${config.dotColor}`} />
          {config.label}
        </span>
      </div>

      {/* Specs */}
      <div className="mt-4 flex flex-col gap-2">
        {unit.specs.map((item) => (
          <div key={item.label} className="flex items-baseline justify-between gap-4">
            <span className="text-sm text-muted-foreground whitespace-nowrap">{item.label}</span>
            <span className="text-sm font-semibold text-foreground">{item.value}</span>
          </div>
        ))}
      </div>

      {/* Features list */}
      <ul className="mt-4 flex flex-col gap-1.5 border-t border-border pt-4">
        {unit.features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm text-foreground">
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${config.dotColor}`} />
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AvailabilitySection() {
  const [activeUnit, setActiveUnit] = useState<"A" | "B" | null>(null);
  const [activePlan, setActivePlan] = useState<"parter" | "pietro">("parter");

  const getHalfBg = (segment: "A" | "B"): string => {
    const unit = units[segment];
    const isActive = activeUnit === segment;
    const isIdle = activeUnit === null;
    return isActive
      ? statusColorActive[unit.status]
      : isIdle
      ? statusConfig[unit.status].color
      : "rgba(0,0,0,0.05)";
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
          {/* Cropped container: clip 12% from top and bottom via negative margins + overflow hidden */}
          <div
            className="relative mx-auto select-none overflow-hidden rounded-lg"
            style={{ height: "calc(76% * var(--img-h, 1))" }}
            onMouseLeave={() => setActiveUnit(null)}
          >
            {/* Wrapper that shifts the image up to crop the top 12% */}
            <div className="relative w-full" style={{ marginTop: "-12%", marginBottom: "-12%" }}>
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/make_strict_front_view__Nano_Banana_Pro_96468-o9OqL5Y5CrWOABWDU9HN71q4PSvGCo.jpg"
                alt="Wizualizacja architektoniczna zabudowy bliźniaczej - widok z przodu"
                className="block w-full"
                draggable={false}
              />
            </div>

            {/* Left half — Segment A (covers left 53% matching the left house) */}
            <button
              type="button"
              aria-label="Segment A - Dostępny"
              onMouseEnter={() => setActiveUnit("A")}
              onClick={() => setActiveUnit((p) => (p === "A" ? null : "A"))}
              className="absolute inset-y-0 left-0 border-0 p-0 focus:outline-none transition-colors duration-300"
              style={{ width: "53%", backgroundColor: getHalfBg("A") }}
            >
              <span
                className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                  activeUnit === "A" ? "opacity-100 scale-100" : "opacity-0 scale-90"
                }`}
              >
                <span className="block whitespace-nowrap bg-black/70 backdrop-blur-sm px-5 py-2.5 rounded text-white text-sm font-bold tracking-widest uppercase">
                  Segment A
                </span>
              </span>
            </button>

            {/* Right half — Segment B (covers right 47%) */}
            <button
              type="button"
              aria-label="Segment B - Zarezerwowany"
              onMouseEnter={() => setActiveUnit("B")}
              onClick={() => setActiveUnit((p) => (p === "B" ? null : "B"))}
              className="absolute inset-y-0 right-0 border-0 p-0 focus:outline-none transition-colors duration-300"
              style={{ width: "47%", backgroundColor: getHalfBg("B") }}
            >
              <span
                className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                  activeUnit === "B" ? "opacity-100 scale-100" : "opacity-0 scale-90"
                }`}
              >
                <span className="block whitespace-nowrap bg-black/70 backdrop-blur-sm px-5 py-2.5 rounded text-white text-sm font-bold tracking-widest uppercase">
                  Segment B
                </span>
              </span>
            </button>

            {/* Divider — at 53% matching the gap between the two houses */}
            <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white/60" style={{ left: "53%" }} />
          </div>

          {/* Unit info cards below the image */}
          <div className="mt-10 grid grid-cols-2 gap-8">
            <InfoCard
              unit={units.A}
              isActive={activeUnit === "A" || activeUnit === null}
            />
            <InfoCard
              unit={units.B}
              isActive={activeUnit === "B" || activeUnit === null}
            />
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-3xl text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground/60">
            {"Zabudowa bliźniacza — dwa niezależne segmenty"}
          </p>
        </div>

        {/* Floor Plans */}
        <div className="mx-auto mt-24 max-w-5xl">
          {/* Section header */}
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">
              Rzuty
            </p>
            <h3 className="mt-4 font-serif text-3xl font-bold text-foreground md:text-4xl">
              Układ pomieszczeń
            </h3>
            <p className="mt-4 text-base text-muted-foreground">
              {"Każdy segment posiada identyczny układ — parter z garażem i częścią dzienną, piętro z sypialniami i łazienkami."}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="mt-10 flex items-center justify-center">
            <div className="inline-flex border border-border bg-card">
              {floorPlans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setActivePlan(plan.id as "parter" | "pietro")}
                  className={`px-8 py-3 text-sm font-semibold uppercase tracking-widest transition-colors duration-200 ${
                    activePlan === plan.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {plan.label}
                </button>
              ))}
            </div>
          </div>

          {/* Plan image */}
          {floorPlans.map((plan) => (
            <div
              key={plan.id}
              className={`mt-8 transition-all duration-500 ${
                activePlan === plan.id ? "opacity-100 translate-y-0" : "hidden"
              }`}
            >
              <div className="overflow-hidden rounded-lg border border-border bg-white shadow-lg">
                <img
                  src={plan.src}
                  alt={plan.alt}
                  className="block w-full"
                />
              </div>
              {/* Features displayed as clean badges */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {plan.features.map((feature, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-sm text-sm font-medium text-foreground"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
