import { prisma } from '@/lib/prisma'
import { unitArea } from '@/lib/house-type-area'

// DB-backed counterpart to `unitArea` for server code that only has a unit id.
// Kept out of `lib/house-type-area` so that module stays pure and importable
// from client components.
export async function unitAreaById(unitId: string): Promise<number | null> {
  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    select: {
      area: true,
      houseType: { select: { floorPlans: { select: { rooms: { select: { area: true } } } } } },
    },
  })
  return unit ? unitArea(unit) : null
}
