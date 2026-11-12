import { prisma } from '@/lib/prisma'
import { unitArea } from '@/lib/house-type-area'
import { normalizeStructuredText } from '@/lib/normalize-text'
import { parseCoordsFromMapUrl } from '@/lib/lokalizacja-points'
import { renderCsv2026 } from './format-2026'

// Daily dane.gov.pl CSV. Since 2026-11-11 the file follows the structure of Dz.U. 2026 poz. 1489
// (48 fields, groups A–H) — see lib/dane-gov/format-2026.ts. The previous 59-column WordPress-plugin
// layout is in git history (before this change).

function formatDateShort(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// D8/D9 are required: stored coordinates first, else the pin from the project's Google Maps link —
// the same rule /lokalizacja uses, so the report and the public map always agree.
function withCoords<P extends { latitude: number | null; longitude: number | null; sections: { mapUrl: string | null }[] }>(p: P): P {
  if (p.latitude != null && p.longitude != null) return p
  const pin = p.sections.map(s => parseCoordsFromMapUrl(s.mapUrl)).find(Boolean)
  return pin ? { ...p, latitude: pin.lat, longitude: pin.lng } : p
}

export async function generateCsvForCompany(companyId: string): Promise<string> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  })

  if (!company) throw new Error(`Company not found: ${companyId}`)

  const units = await prisma.unit.findMany({
    where: {
      companyId,
      status: { not: 'sold' },
    },
    include: {
      // The lokalizacja section's Google Maps link is the fallback for D8/D9, as on /lokalizacja.
      project: { include: { sections: { where: { type: 'lokalizacja' }, select: { mapUrl: true } } } },
      // Size is the sum of the type's room areas, never a stored column.
      houseType: { select: { floorPlans: { select: { rooms: { select: { area: true } } } } } },
      priceHistory: { orderBy: { date: 'desc' } },
    },
    orderBy: [{ projectId: 'asc' }, { label: 'asc' }],
  })

  return renderCsv2026(
    company,
    units.map(u => ({ ...u, project: withCoords(u.project), area: unitArea(u), history: u.priceHistory })),
    // Last line of defence: every free-text field is folded on the way out, so no pasted
    // look-alike character can reach the regulator even if it slipped past the admin.
    { text: s => normalizeStructuredText(s) },
  )
}

export function getCsvFileName(companySlug: string, date: Date): string {
  return `mieszkania-${companySlug}-${formatDateShort(date)}.csv`
}
