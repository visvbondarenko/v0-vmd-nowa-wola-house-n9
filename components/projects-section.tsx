import { ArrowRight, Clock } from "lucide-react";
import Link from "next/link";

const projects = [
  {
    slug: "wola-house",
    title: "Wola House",
    subtitle: "Zabudowa bliźniacza",
    location: "Nowa Wola, Warszawa",
    status: "W sprzedaży",
    statusColor: "bg-green-600",
    image:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/remove_front_fence_prolong_tre_Nano_Banana_Pro_72356-xa3DocGaCiWnb6dS8v76n5TKcWJP8E.jpg",
    description:
      "Wyjątkowy projekt oferujący więcej przestrzeni użytkowej niż standardowe domy bliźniacze. Nowoczesna architektura z cegłą klinkierową i ciemną elewacją metalową. Dwa niezależne segmenty, każdy po 130 m² z prywatnym ogrodem 300 m².",
    available: true,
  },
  {
    slug: null,
    title: "Nowy projekt",
    subtitle: "Wkrótce",
    location: "Lokalizacja w przygotowaniu",
    status: "Wkrótce",
    statusColor: "bg-muted-foreground",
    image:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/I_need_realistic_renders_for_m_Nano_Banana_Pro_26318-ShJALlqmncXEn3bM37Uy5YIBtbCJoI.jpg",
    description:
      "Kolejna inwestycja VMD Development jest w fazie planowania. Śledź nasze aktualności, aby nie przegapić premiery.",
    available: false,
  },
];

export function ProjectsSection() {
  return (
    <section id="projekty" className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">
            Nasze inwestycje
          </p>
          <h2 className="mt-4 font-serif text-3xl font-bold text-foreground md:text-5xl text-balance">
            Projekty
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground text-pretty">
            {"Tworzymy przestrzenie, w których architektura spotyka się z komfortem. Poznaj nasze aktualne i nadchodzące inwestycje."}
          </p>
        </div>

        {/* Projects grid */}
        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {projects.map((project) =>
            project.available && project.slug ? (
              <Link
                key={project.title}
                href={`/projects/${project.slug}`}
                className="group relative flex flex-col overflow-hidden border border-border bg-card transition-all duration-500 hover:border-primary/30 hover:shadow-xl"
              >
              {/* Image */}
              <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                {project.image ? (
                  <img
                    src={project.image}
                    alt={project.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-secondary">
                    <Clock className="h-12 w-12 text-muted-foreground/40" />
                  </div>
                )}
                {/* Status badge */}
                <div className="absolute top-4 left-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white ${project.statusColor}`}
                  >
                    {project.status}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col p-8">
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  {project.location}
                </p>
                <h3 className="mt-2 font-serif text-2xl font-bold text-card-foreground md:text-3xl">
                  {project.title}
                </h3>
                <p className="mt-1 text-sm font-medium text-primary">
                  {project.subtitle}
                </p>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {project.description}
                </p>

                <div className="mt-6">
                  <span className="inline-flex items-center gap-2 bg-primary px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-primary-foreground transition-all duration-300 group-hover:bg-primary/90 group-hover:gap-3">
                    {"Dowiedz się więcej"}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ) : (
            <div
              key={project.title}
              className="group relative flex flex-col overflow-hidden border border-border bg-card transition-all duration-500 opacity-70"
            >
              {/* Image */}
              <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                {project.image ? (
                  <img
                    src={project.image}
                    alt={project.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-secondary">
                    <Clock className="h-12 w-12 text-muted-foreground/40" />
                  </div>
                )}
                {/* Status badge */}
                <div className="absolute top-4 left-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white ${project.statusColor}`}
                  >
                    {project.status}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col p-8">
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  {project.location}
                </p>
                <h3 className="mt-2 font-serif text-2xl font-bold text-card-foreground md:text-3xl">
                  {project.title}
                </h3>
                <p className="mt-1 text-sm font-medium text-primary">
                  {project.subtitle}
                </p>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {project.description}
                </p>
                <p className="mt-6 text-sm font-medium text-muted-foreground/60 uppercase tracking-widest">
                  {"Informacje wkrótce"}
                </p>
              </div>
            </div>
          )
        )}
        </div>
      </div>
    </section>
  );
}
