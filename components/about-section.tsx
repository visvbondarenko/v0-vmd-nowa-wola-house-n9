import { Home, Ruler, TreePine, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: Home,
    title: "Nowoczesna architektura",
    description:
      "Połączenie cegły klinkierowej z ciemną elewacją metalową tworzy unikatowy, ponadczasowy charakter budynku.",
  },
  {
    icon: Ruler,
    title: "Przestronne wnętrza",
    description:
      "Każdy segment oferuje ponad 140 m² powierzchni użytkowej, zaprojektowanej z myślą o komforcie całej rodziny.",
  },
  {
    icon: TreePine,
    title: "Zielone otoczenie",
    description:
      "Prywatny ogród, szlachetna zieleń i spokojna okolica zapewniają idealny balans między naturą a miastem.",
  },
  {
    icon: ShieldCheck,
    title: "Wysoki standard",
    description:
      "Najwyższej klasy materiały budowlane, energooszczędne rozwiązania i dbałość o każdy detal wykończenia.",
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
            Nowoczesny dom bliźniaczy łączy w sobie elegancję współczesnej
            architektury z funkcjonalnością i komfortem. Każdy detal został
            zaprojektowany tak, aby stworzyć przestrzeń, w której chce się żyć.
          </p>
        </div>

        {/* Features grid */}
        <div className="mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
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
