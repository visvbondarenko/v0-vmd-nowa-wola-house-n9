import {
  Home, Ruler, TreePine, ShieldCheck, School, Waves, ChevronsUp, LayoutDashboard,
  Building, Car, MapPin, Sun, Star, Heart, Zap, Leaf, Bed, Bath, Trees,
} from 'lucide-react'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Home, Ruler, TreePine, ShieldCheck, School, Waves, ChevronsUp, LayoutDashboard,
  Building, Car, MapPin, Sun, Star, Heart, Zap, Leaf, Bed, Bath, Trees,
}

type Feature = { id: string; icon: string; title: string; description: string }

export function DynamicAboutSection({
  heading,
  text,
  features,
}: {
  heading: string
  text: string
  features: Feature[]
}) {
  return (
    <section id="o-inwestycji" className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">
            O inwestycji
          </p>
          <h2 className="mt-4 font-serif text-3xl font-bold text-foreground md:text-5xl text-balance">
            {heading}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground text-pretty">
            {text}
          </p>
        </div>

        {features.length > 0 && (
          <div className="mt-20 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = ICON_MAP[feature.icon] ?? Home
              return (
                <div
                  key={feature.id}
                  className="group border border-border bg-card p-8 transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
                >
                  <div className="flex h-12 w-12 items-center justify-center bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-6 font-serif text-lg font-semibold text-card-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
