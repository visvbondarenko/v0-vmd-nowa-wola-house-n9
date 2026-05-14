import { prisma } from '@/lib/prisma'
import { UnitsManager } from './units-manager'

export const dynamic = 'force-dynamic'

export default async function AdminUnitsPage() {
  const units = await prisma.unit.findMany({
    select: {
      id: true,
      label: true,
      buildingLabel: true,
      svgElementId: true,
      status: true,
      stage: true,
      area: true,
      gardenArea: true,
      floor: true,
      rooms: true,
      floors: true,
      price: true,
      fullPrice: true,
      parkingPrice: true,
      storagePrice: true,
      rightsPrice: true,
      otherPrice: true,
      partsType: true,
      partsLabel: true,
      roomsType: true,
      roomsLabel: true,
      rightsDesc: true,
      otherDesc: true,
      description: true,
      project: { select: { id: true, name: true, slug: true } },
      company: { select: { id: true, name: true } },
    },
    orderBy: [
      { projectId: 'asc' },
      { buildingLabel: 'asc' },
      { label: 'asc' },
    ],
  })

  return <UnitsManager initialUnits={units} />
}
