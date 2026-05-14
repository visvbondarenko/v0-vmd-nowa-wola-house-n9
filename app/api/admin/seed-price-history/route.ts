import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

// Backfill: create one PriceHistory row per priced unit that has no history yet.
// Useful right after the dane.gov.pl schema upgrade so existing units get a baseline.
export async function POST() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const units = await prisma.unit.findMany({
    where: {
      price: { not: null },
      priceHistory: { none: {} },
    },
  })

  let created = 0
  for (const unit of units) {
    const pricePerSqm = unit.area && unit.area > 0 && unit.price
      ? unit.price / unit.area
      : null

    await prisma.priceHistory.create({
      data: {
        unitId: unit.id,
        pricePerSqm,
        totalPrice: unit.price,
        parkingPrice: unit.parkingPrice,
        storagePrice: unit.storagePrice,
        date: unit.updatedAt,
      },
    })
    created++
  }

  return NextResponse.json({
    message: `Created ${created} PriceHistory records for units with no history`,
    unitsProcessed: units.length,
    created,
  })
}
