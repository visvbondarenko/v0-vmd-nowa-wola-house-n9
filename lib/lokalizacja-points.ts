import { prisma } from "@/lib/prisma"
import type { ProjectPoint, CityKey } from "@/components/lokalizacja/city-map"

const CITY_CENTERS: Record<CityKey, { lat: number; lng: number }> = {
  Warszawa: { lat: 52.2297, lng: 21.0122 },
  Wroclaw: { lat: 51.1079, lng: 17.0385 },
  Krakow: { lat: 50.0647, lng: 19.945 },
}

const CITY_RADIUS_KM = 60

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return 2 * R * Math.asin(Math.sqrt(h))
}

function classifyCityByCoords(coords: { lat: number; lng: number }): CityKey | null {
  let best: CityKey | null = null
  let bestDist = Infinity
  for (const key of Object.keys(CITY_CENTERS) as CityKey[]) {
    const d = haversineKm(coords, CITY_CENTERS[key])
    if (d < bestDist) {
      bestDist = d
      best = key
    }
  }
  return bestDist <= CITY_RADIUS_KM ? best : null
}

function parseCoordsFromMapUrl(url: string | null | undefined): { lat: number; lng: number } | null {
  if (!url) return null
  const normalized = url.match(/^https?:\/\//) ? url : `https://${url}`
  const placeMatches = [...normalized.matchAll(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/g)]
  if (placeMatches.length > 0) {
    const last = placeMatches[placeMatches.length - 1]
    return { lat: Number(last[1]), lng: Number(last[2]) }
  }
  const atMatch = normalized.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (atMatch) return { lat: Number(atMatch[1]), lng: Number(atMatch[2]) }
  const qMatch = normalized.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (qMatch) return { lat: Number(qMatch[1]), lng: Number(qMatch[2]) }
  return null
}

export async function loadLokalizacjaPoints(): Promise<ProjectPoint[]> {
  const projects = await prisma.project.findMany({
    where: { status: "active", published: true },
    select: {
      id: true,
      name: true,
      slug: true,
      location: true,
      investCity: true,
      investStreet: true,
      investBuildingNr: true,
      imageUrl: true,
      heroSubtitle: true,
      description: true,
      status: true,
      sections: {
        where: { type: { in: ["lokalizacja", "key_features"] } },
        select: { type: true, mapUrl: true, enabled: true, items: { select: { title: true, subtitle: true }, orderBy: { order: "asc" } } },
      },
      units: { select: { status: true } },
    },
  })

  return projects
    .map((p) => {
      const lokalizacjaSection = p.sections.find((s) => s.type === "lokalizacja")
      const coords = parseCoordsFromMapUrl(lokalizacjaSection?.mapUrl)
      if (!coords) return null
      const city = classifyCityByCoords(coords)
      if (!city) return null
      const streetLine = [p.investStreet, p.investBuildingNr].filter(Boolean).join(" ")
      const address = streetLine || p.investCity || p.location || null
      const keyFeaturesSection = p.sections.find((s) => s.type === "key_features" && s.enabled)
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        city,
        lat: coords.lat,
        lng: coords.lng,
        address,
        imageUrl: p.imageUrl,
        location: p.location,
        heroSubtitle: p.heroSubtitle,
        description: p.description,
        status: p.status,
        availableCount: p.units.filter((u) => u.status === "available").length,
        totalCount: p.units.length,
        keyFeatures: keyFeaturesSection?.items ?? [],
      } as ProjectPoint
    })
    .filter((p): p is ProjectPoint => p !== null)
}
