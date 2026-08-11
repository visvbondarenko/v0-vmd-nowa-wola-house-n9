import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'
import { unitAreaById } from '@/lib/unit-area'
import { unitArea } from '@/lib/house-type-area'

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // All units with project + company info — used by the company edit page's
  // unit-assignment selector and the global units manager.
  const rows = await prisma.unit.findMany({
    select: {
      id: true, label: true, buildingLabel: true, status: true,
      price: true, companyId: true,
      project: { select: { id: true, name: true } },
      company: { select: { id: true, name: true } },
      // Size is the sum of the type's room areas — see lib/house-type-area.
      houseType: { select: { floorPlans: { select: { rooms: { select: { area: true } } } } } },
    },
    orderBy: [{ projectId: 'asc' }, { buildingLabel: 'asc' }, { label: 'asc' }],
  })
  const units = rows.map(({ houseType, ...u }) => ({ ...u, area: unitArea({ houseType }) }))
  return NextResponse.json(units)
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await request.json()

  // Auto-compute fullPrice from components for dane.gov.pl reporting.
  if (body.price != null) {
    body.fullPrice = body.price + (body.parkingPrice ?? 0) + (body.storagePrice ?? 0) + (body.rightsPrice ?? 0) + (body.otherPrice ?? 0)
  }

  const unit = await prisma.unit.create({ data: body })

  // Initial PriceHistory entry so price changes have a baseline to diff against.
  if (unit.price) {
    const area = await unitAreaById(unit.id)
    const pricePerSqm = area && area > 0 ? unit.price / area : null
    await prisma.priceHistory.create({
      data: {
        unitId: unit.id,
        pricePerSqm,
        totalPrice: unit.price,
        fullPrice: unit.fullPrice,
        parkingPrice: unit.parkingPrice,
        storagePrice: unit.storagePrice,
        rightsPrice: unit.rightsPrice,
        otherPrice: unit.otherPrice,
      },
    })
  }

  return NextResponse.json(unit, { status: 201 })
}
