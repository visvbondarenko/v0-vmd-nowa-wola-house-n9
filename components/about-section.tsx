import { Home, Ruler, TreePine, ShieldCheck, School, Waves, ChevronsUp, LayoutDashboard } from "lucide-react";

const features = [
  {
    icon: Home,
    title: "Nowoczesna architektura",
    description:
      "Połączenie cegły klinkierowej z ciemną elewacją metalową tworzy unikatowy, ponadczasowy charakter budynku — wyróżniający się na tle standardowych projektów.",
  },
  {
    icon: Ruler,
    title: "Więcej przestrzeni użytkowej",
    description:
      "Każdy segment oferuje 130 m² starannie zaplanowanej powierzchni — więcej niż w typowych domach bliźniaczych tej klasy. Gabinet, pralnia i przestronny garaż w standardzie.",
  },
  {
    icon: ChevronsUp,
    title: "Loftowy design II piętra",
    description:
      "Wyjątkowe wnętrze drugiego piętra z sufitami o wysokości 4 metrów i otwartą przestrzenią w stylu loft — jasne, przestronne i niepowtarzalne.",
  },
  {
    icon: LayoutDashboard,
    title: "Przemyślany układ",
    description:
      "Osobna pralnia, gabinet do pracy zdalnej oraz sypialnia master z własną łazienką — każdy metr zaprojektowany z myślą o codziennym komforcie.",
  },
  {
    icon: School,
    title: "Doskonała lokalizacja",
    description:
      "W bezpośrednim sąsiedztwie szkół i przedszkoli. Spokojna, zielona okolica idealna dla rodzin z dziećmi.",
  },
  {
    icon: Waves,
    title: "Jezioro w pobliżu",
    description:
      "Lokalne jezioro w zasięgu spaceru — naturalne miejsce wypoczynku i aktywności na świeżym powietrzu przez cały rok.",
  },
  {
    icon: TreePine,
    title: "Zielone otoczenie",
    description:
      "Prywatny ogród, szlachetna zieleń i spokojna okolica zapewniają idealny balans między naturą a miastem.",
  },
  {
    icon: ShieldCheck,
    title: "Najwyższy standard wykonania",
    description:
      "Materiały budowlane najwyższej klasy, energooszczędne rozwiązania i rygorystyczna dbałość o każdy detal wykończenia.",
  },
];

export function AboutSection() {
  return (
    <section id="o-inwestycji" className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">
            O inwestycji
          </p>
          <h2 className="mt-4 font-serif text-3xl font-bold text-foreground md:text-5xl text-balance">
            Dom, który wyznacza standardy
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground text-pretty">
            {"Nowoczesny dom bliźniaczy łączy elegancję współczesnej architektury z funkcjonalnością i komfortem. Unikalny projekt oferuje więcej przestrzeni użytkowej niż standardowe domy tej klasy — każdy detal zaprojektowany tak, aby stworzyć przestrzeń, w której chce się żyć."}
          </p>
        </div>

        {/* Features grid */}
        <div className="mt-20 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group border border-border bg-card p-8 transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center bg-primary/10 transition-colors group-hover:bg-primary/20">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-6 font-serif text-lg font-semibold text-card-foreground">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
