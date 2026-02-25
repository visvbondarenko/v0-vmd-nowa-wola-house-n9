import { ArrowRight, Clock } from "lucide-react";
import Link from "next/link";

const projects = [
  {
    slug: "wola-house",
    title: "Wola House",
    subtitle: "Zabudowa bli\u017aniacza",
    location: "Wola, Warszawa",
    status: "W sprzeda\u017cy",
    statusColor: "bg-green-600",
    image:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/now_get_back_lower_part_a_a_br_Nano_Banana_Pro_67357-CH4slykgCukLyUn9JsGHpDNNIzrRc5.jpg",
    description:
      "Nowoczesny dom w zabudowie bli\u017aniaczej. Po\u0142\u0105czenie ceg\u0142y klinkierowej z ciemn\u0105 elewacj\u0105 metalow\u0105. Dwa niezale\u017cne segmenty, ka\u017cdy po 144 m\u00B2.",
    available: true,
  },
  {
    slug: null,
    title: "Nowy projekt",
    subtitle: "Wkr\u00f3tce",
    location: "Lokalizacja w przygotowaniu",
    status: "Wkr\u00f3tce",
    statusColor: "bg-muted-foreground",
    image:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-02-25%20at%2017.31.26-dUOOVqlr5rlGEsbSrCK7Wx8RYIzTzh.png",
    description:
      "Kolejna inwestycja VMD Development jest w fazie planowania. \u015aled\u017a nasze aktualno\u015bci, aby nie przegapi\u0107 premiery.",
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
            Tworzymy przestrzenie, w kt&oacute;rych architektura spotyka si\u0119
            z komfortem. Poznaj nasze aktualne i nadchodz\u0105ce inwestycje.
          </p>
        </div>

        {/* Projects grid */}
        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {projects.map((project) => (
            <div
              key={project.title}
              className={`group relative flex flex-col overflow-hidden border border-border bg-card transition-all duration-500 ${
                project.available
                  ? "hover:border-primary/30 hover:shadow-xl"
                  : "opacity-70"
              }`}
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

                {project.available && project.slug ? (
                  <Link
                    href={`/projects/${project.slug}`}
                    className="mt-6 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-primary transition-all duration-300 group-hover:gap-3"
                  >
                    {"Dowiedz si\u0119 wi\u0119cej"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <p className="mt-6 text-sm font-medium text-muted-foreground/60 uppercase tracking-widest">
                    {"Informacje wkr\u00f3tce"}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
