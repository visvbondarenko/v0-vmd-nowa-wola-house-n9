import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAuthenticated } from '@/lib/auth'
import { geocodeAddress, buildProjectAddress } from '@/lib/geocode'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const project = await prisma.project.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: {
      units: { orderBy: { label: 'asc' } },
      houseTypes: {
        include: {
          floorPlans: {
            include: { rooms: true },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      sections: {
        include: { items: { orderBy: { order: 'asc' } } },
        orderBy: { order: 'asc' },
      },
      aboutFeatures: { orderBy: { order: 'asc' } }, // DEPRECATED — kept until consumers migrate to sections
      galleryImages: { orderBy: { order: 'asc' } },
      documents: { orderBy: { order: 'asc' } },
      stages: {
        include: {
          stageViews: {
            orderBy: { order: 'asc' },
            include: {
              dotOverrides: { select: { unitId: true, dotX: true, dotY: true } },
            },
          },
        },
        orderBy: { order: 'asc' },
      },
      planViews: {
        orderBy: { order: 'asc' },
        include: {
          dotOverrides: { select: { unitId: true, dotX: true, dotY: true } },
        },
      },
      dotOverrides: {
        where: { projectId: { not: null } },
        select: { unitId: true, dotX: true, dotY: true },
      },
    },
  })
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(project)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const body = await request.json()

  // Whitelist allowed fields so a stray relation in the body can't blow away
  // nested data via Prisma's `set` semantics.
  const {
    name, slug, location, description, svgContent, imageUrl, planImageUrl,
    status, published, heroSubtitle, contactPhone, contactEmail, contactAddress,
    companyId,
    investVoivodeship, investCounty, investMunicipality, investCity,
    investStreet, investBuildingNr, investPostalCode,
    propertyType, prospektUrl, additionalInfo,
    latitude, longitude, northAngle,
    // Legacy N9 fields, still accepted until the deprecation cleanup.
    aboutHeading, aboutText, mapEmbedUrl,
    locationAddress, locationTransport, locationSurroundings,
  } = body

  const data: Record<string, unknown> = {}
  if (name !== undefined) data.name = name
  if (slug !== undefined) data.slug = slug
  if (location !== undefined) data.location = location
  if (description !== undefined) data.description = description || null
  if (svgContent !== undefined) data.svgContent = svgContent
  if (imageUrl !== undefined) data.imageUrl = imageUrl
  if (planImageUrl !== undefined) data.planImageUrl = planImageUrl
  if (status !== undefined) data.status = status
  if (published !== undefined) data.published = published
  if (heroSubtitle !== undefined) data.heroSubtitle = heroSubtitle || null
  if (contactPhone !== undefined) data.contactPhone = contactPhone || null
  if (contactEmail !== undefined) data.contactEmail = contactEmail || null
  if (contactAddress !== undefined) data.contactAddress = contactAddress || null
  if (companyId !== undefined) data.companyId = companyId || null
  if (investVoivodeship !== undefined) data.investVoivodeship = investVoivodeship || null
  if (investCounty !== undefined) data.investCounty = investCounty || null
  if (investMunicipality !== undefined) data.investMunicipality = investMunicipality || null
  if (investCity !== undefined) data.investCity = investCity || null
  if (investStreet !== undefined) data.investStreet = investStreet || null
  if (investBuildingNr !== undefined) data.investBuildingNr = investBuildingNr || null
  if (investPostalCode !== undefined) data.investPostalCode = investPostalCode || null
  if (propertyType !== undefined) data.propertyType = propertyType || null
  if (prospektUrl !== undefined) data.prospektUrl = prospektUrl || null
  if (additionalInfo !== undefined) data.additionalInfo = additionalInfo || null
  if (latitude !== undefined) {
    data.latitude = latitude === null || latitude === '' ? null : Number(latitude)
  }
  if (longitude !== undefined) {
    data.longitude = longitude === null || longitude === '' ? null : Number(longitude)
  }
  if (northAngle !== undefined) {
    data.northAngle = northAngle === null || northAngle === '' ? null : Math.round(Number(northAngle))
  }
  if (aboutHeading !== undefined) data.aboutHeading = aboutHeading || null
  if (aboutText !== undefined) data.aboutText = aboutText || null
  if (mapEmbedUrl !== undefined) data.mapEmbedUrl = mapEmbedUrl || null
  if (locationAddress !== undefined) data.locationAddress = locationAddress || null
  if (locationTransport !== undefined) data.locationTransport = locationTransport || null
  if (locationSurroundings !== undefined) data.locationSurroundings = locationSurroundings || null

  const latProvided = 'latitude' in body && data.latitude != null
  const lngProvided = 'longitude' in body && data.longitude != null
  const addressFields = [
    'investVoivodeship', 'investCity', 'investStreet',
    'investBuildingNr', 'investPostalCode', 'location',
  ] as const
  const addressChanged = addressFields.some(f => f in body)

  // Only auto-geocode when address changed AND the client didn't pass explicit
  // coordinates AND the project doesn't already have them. Manual wins.
  if (addressChanged && !latProvided && !lngProvided) {
    const existing = await prisma.project.findUnique({
      where: { id },
      select: {
        investVoivodeship: true, investCity: true, investStreet: true,
        investBuildingNr: true, investPostalCode: true, location: true,
        latitude: true, longitude: true,
      },
    })
    if (existing?.latitude == null || existing?.longitude == null) {
      const merged = { ...existing, ...data } as Parameters<typeof buildProjectAddress>[0]
      const address = buildProjectAddress(merged)
      const result = await geocodeAddress(address)
      if (result.ok) {
        data.latitude = result.lat
        data.longitude = result.lng
      }
    }
  }

  const project = await prisma.project.update({ where: { id }, data })
  return NextResponse.json(project)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  await prisma.project.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
