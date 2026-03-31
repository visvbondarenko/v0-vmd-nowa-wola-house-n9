import { ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active:    { label: "W sprzedaży",  color: "bg-green-600" },
  planned:   { label: "Wkrótce",      color: "bg-muted-foreground" },
  completed: { label: "Zakończona",   color: "bg-gray-600" },
};

export async function ProjectsSection() {
  const dbProjects = await prisma.project.findMany({
    where: { published: true },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      location: true,
      description: true,
      imageUrl: true,
      heroSubtitle: true,
      status: true,
    },
  });

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
          {/* Published DB projects */}
          {dbProjects.map((project) => {
            const st = STATUS_MAP[project.status] ?? STATUS_MAP.active
            return (
              <Link
                key={project.id}
                href={`/projects/${project.slug}`}
                className="group relative flex flex-col overflow-hidden border border-border bg-card transition-all duration-500 hover:border-primary/30 hover:shadow-xl"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                  {project.imageUrl ? (
                    <img
                      src={project.imageUrl}
                      alt={project.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-secondary">
                      <Clock className="h-12 w-12 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white ${st.color}`}>
                      {st.label}
                    </span>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-8">
                  <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    {project.location}
                  </p>
                  <h3 className="mt-2 font-serif text-2xl font-bold text-card-foreground md:text-3xl">
                    {project.name}
                  </h3>
                  {project.heroSubtitle && (
                    <p className="mt-1 text-sm font-medium text-primary">
                      {project.heroSubtitle}
                    </p>
                  )}
                  {project.description && (
                    <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {project.description}
                    </p>
                  )}
                  <div className="mt-6">
                    <span className="inline-flex items-center gap-2 bg-primary px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-primary-foreground transition-all duration-300 group-hover:bg-primary/90 group-hover:gap-3">
                      Dowiedz się więcej
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}


        </div>
      </div>
    </section>
  );
}
