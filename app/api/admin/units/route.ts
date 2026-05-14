import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // All units with project + company info — used by the company edit page's
  // unit-assignment selector and the global units manager.
  const units = await prisma.unit.findMany({
    select: {
      id: true, label: true, buildingLabel: true, status: true,
      area: true, price: true, companyId: true,
      project: { select: { id: true, name: true } },
      company: { select: { id: true, name: true } },
    },
    orderBy: [{ projectId: 'asc' }, { buildingLabel: 'asc' }, { label: 'asc' }],
  })
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
    const pricePerSqm = unit.area && unit.area > 0 ? unit.price / unit.area : null
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
