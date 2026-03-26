import { MapPin } from 'lucide-react'

function toEmbedUrl(raw: string): string {
  if (raw.includes('output=embed') || raw.includes('/maps/embed')) return raw
  const match = raw.match(/@(-?\d+\.\d+),(-?\d+\.\d+),(\d+)z/)
  if (match) {
    const [, lat, lng, zoom] = match
    return `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`
  }
  return raw
}

type Props = {
  mapEmbedUrl: string
  address?: string | null
  transport?: string | null
  surroundings?: string | null
}

export function DynamicMapSection({ mapEmbedUrl: rawUrl, address, transport, surroundings }: Props) {
  const mapEmbedUrl = toEmbedUrl(rawUrl)
  const infoCards = [
    address ? { title: 'Adres', detail: address } : null,
    transport ? { title: 'Komunikacja', detail: transport } : null,
    surroundings ? { title: 'Otoczenie', detail: surroundings } : null,
  ].filter((x): x is { title: string; detail: string } => x !== null)

  return (
    <section id="lokalizacja" className="py-24 lg:py-32 bg-secondary/50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">
            Lokalizacja
          </p>
          <h2 className="mt-4 font-serif text-3xl font-bold text-foreground md:text-5xl text-balance">
            Gdzie nas znajdziesz
          </h2>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {infoCards.length > 0 && (
            <div className="flex flex-col gap-6 lg:col-span-1">
              {infoCards.map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-4 border border-border bg-card p-6"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-card-foreground">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {item.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className={`overflow-hidden border border-border ${infoCards.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <iframe
              src={mapEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: '400px' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Lokalizacja - mapa"
              className="w-full"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
