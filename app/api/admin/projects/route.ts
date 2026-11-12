import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { geocodeAddress, buildProjectAddress } from '@/lib/geocode'
import { isAuthenticated } from '@/lib/auth'

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const projects = await prisma.project.findMany({
    include: {
      units: { select: { status: true } },
      company: { select: { id: true, name: true } },
    },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(projects)
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await request.json()
  let project = await prisma.project.create({ data: body })
  // A new project gets its map position from the address right away — the dane.gov.pl report requires
  // coordinates (D8/D9). Edits geocode too (projects/[id]); a failed lookup just leaves them empty.
  if (project.latitude == null || project.longitude == null) {
    const address = buildProjectAddress(project)
    if (address) {
      const g = await geocodeAddress(address)
      if (g.ok) project = await prisma.project.update({ where: { id: project.id }, data: { latitude: g.lat, longitude: g.lng } })
    }
  }
  return NextResponse.json(project, { status: 201 })
}
