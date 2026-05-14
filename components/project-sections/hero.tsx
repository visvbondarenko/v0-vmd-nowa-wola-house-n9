import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, MapPin } from "lucide-react"

export function DynamicProjectHero({
  title,
  subtitle,
  location,
  status,
  imageUrl,
}: {
  title: string
  subtitle: string
  location: string
  status: string
  imageUrl: string
}) {
  return (
    <section className="relative">
      <div className="relative min-h-screen overflow-hidden">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

        <Link
          href="/#w-sprzedazy"
          className="absolute top-20 left-6 lg:top-20 lg:left-8 flex items-center gap-2 text-white/90 hover:text-white transition-colors bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full z-10"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Powrót</span>
        </Link>

        <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-16">
          <div className="container mx-auto">
            <span
              className="inline-block text-xs font-medium px-3 py-1.5 rounded-full mb-4"
              style={{ backgroundColor: "var(--color-primary)", color: "rgba(255,255,255,0.95)" }}
            >
              {status}
            </span>
            <h1 className="font-serif text-4xl lg:text-6xl font-semibold text-white mb-4">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xl lg:text-2xl text-white/90 max-w-2xl">
                {subtitle}
              </p>
            )}
            <div className="flex items-center gap-2 mt-4 text-white/80">
              <MapPin className="w-5 h-5" />
              <span>{location}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
