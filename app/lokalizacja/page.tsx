import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { CityMap } from "@/components/lokalizacja/city-map"
import { loadLokalizacjaPoints } from "@/lib/lokalizacja-points"

export const dynamic = "force-dynamic"

export default async function LokalizacjaPage() {
  const points = await loadLokalizacjaPoints()
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || null
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || undefined

  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen bg-background">
        <div className="container mx-auto px-4 lg:px-8 py-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Powrót na stronę główną</span>
          </Link>

          <h1 className="text-3xl lg:text-4xl font-bold mb-2" style={{ color: "var(--color-foreground)" }}>
            Lokalizacje inwestycji
          </h1>
          <p className="text-muted-foreground mb-8">
            Znajdź nasze inwestycje na mapie w wybranym mieście.
          </p>

          <CityMap apiKey={apiKey} mapId={mapId} points={points} />
        </div>
      </main>
      <Footer />
    </>
  )
}
