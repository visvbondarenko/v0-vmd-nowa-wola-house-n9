import { MapPin } from "lucide-react";

export function MapSection() {
  return (
    <section id="lokalizacja" className="py-24 lg:py-32 bg-secondary/50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">
            Lokalizacja
          </p>
          <h2 className="mt-4 font-serif text-3xl font-bold text-foreground md:text-5xl text-balance">
            Gdzie nas znajdziesz
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground text-pretty">
            {"Prestiżowa lokalizacja z doskonałym dostępem do komunikacji, terenów zielonych i pełnej infrastruktury miejskiej."}
          </p>
        </div>

        {/* Map + info */}
        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {/* Info cards */}
          <div className="flex flex-col gap-6 lg:col-span-1">
            {[
              {
                title: "Adres",
                detail: "Ignacego Krasickiego 187, 05-500 Nowa Wola",
              },
              {
                title: "Komunikacja",
                detail: "Doskonały dostęp do drogi krajowej i komunikacji miejskiej",
              },
              {
                title: "Otoczenie",
                detail:
                  "Spokojna okolica, tereny zielone, pełna infrastruktura",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-4 border border-border bg-card p-6"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {item.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Map embed */}
          <div className="overflow-hidden border border-border lg:col-span-2">
            <iframe
              src="https://maps.google.com/maps?q=Ignacego+Krasickiego+187,+05-500+Nowa+Wola&z=16&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: "400px" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Lokalizacja Wola House - mapa satelitarna"
              className="w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
