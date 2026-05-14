import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  try {
    const project = await prisma.project.findUnique({
      where: { slug },
      include: {
        units: {
          include: {
            houseType: true,
            priceHistory: {
              orderBy: { date: 'asc' },
              select: {
                id: true, date: true,
                totalPrice: true, pricePerSqm: true,
                parkingPrice: true, storagePrice: true, rightsPrice: true, otherPrice: true,
              },
            },
          },
        },
        houseTypes: {
          include: {
            floorPlans: {
              include: { rooms: true },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        dotOverrides: {
          where: { projectId: { not: null } },
          select: { unitId: true, dotX: true, dotY: true },
        },
      },
    })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    return NextResponse.json({
      svgContent: project.svgContent,
      planImageUrl: project.planImageUrl,
      northAngle: project.northAngle,
      units: project.units,
      houseTypes: project.houseTypes,
      dotOverrides: project.dotOverrides,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch units' }, { status: 500 })
  }
}
