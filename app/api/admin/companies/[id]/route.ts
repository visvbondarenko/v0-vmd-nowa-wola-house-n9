import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { normalizeStructuredText } from '@/lib/normalize-text'
import { isAuthenticated, hasRole } from '@/lib/auth'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      units: {
        select: {
          id: true, label: true, buildingLabel: true, status: true,
          area: true, price: true,
          project: { select: { id: true, name: true, slug: true } },
        },
        orderBy: [{ projectId: 'asc' }, { buildingLabel: 'asc' }, { label: 'asc' }],
      },
    },
  })
  if (!company) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(company)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await hasRole('admin'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const body = await request.json()

  // Optional unit linking. unitIds = current selection. forceUnitIds = entries
  // that should be reassigned even if currently owned by another company.
  if (Array.isArray(body.unitIds)) {
    const forceIds: string[] = Array.isArray(body.forceUnitIds) ? body.forceUnitIds : []
    const allNewIds = [...new Set([...body.unitIds, ...forceIds])]

    // Unassign units no longer in the selection but currently linked here.
    await prisma.unit.updateMany({
      where: { companyId: id, id: { notIn: allNewIds } },
      data: { companyId: null },
    })
    // Assign newly selected units that are either unassigned or already ours.
    if (body.unitIds.length > 0) {
      await prisma.unit.updateMany({
        where: {
          id: { in: body.unitIds },
          OR: [{ companyId: null }, { companyId: id }],
        },
        data: { companyId: id },
      })
    }
    // Force-assign units regardless of current owner (project takeover).
    if (forceIds.length > 0) {
      await prisma.unit.updateMany({
        where: { id: { in: forceIds } },
        data: { companyId: id },
      })
    }
  }

  // Company records are entirely structured registry/address data that feeds
  // CSV cols 1-27, so every field is folded — no prose to protect here.
  const norm = (v: unknown): string | null =>
    typeof v === 'string' ? normalizeStructuredText(v) || null : null

  const company = await prisma.company.update({
    where: { id },
    data: {
      name: normalizeStructuredText(body.name ?? ""),
      slug: normalizeStructuredText(body.slug ?? ""),
      legalForm: norm(body.legalForm),
      nip: normalizeStructuredText(body.nip ?? ""),
      krs: norm(body.krs),
      ceidg: norm(body.ceidg),
      regon: normalizeStructuredText(body.regon ?? ""),
      addrVoivodeship: norm(body.addrVoivodeship),
      addrCounty: norm(body.addrCounty),
      addrMunicipality: norm(body.addrMunicipality),
      addrCity: norm(body.addrCity),
      addrStreet: norm(body.addrStreet),
      addrBuildingNr: norm(body.addrBuildingNr),
      addrUnitNr: norm(body.addrUnitNr),
      addrPostalCode: norm(body.addrPostalCode),
      salesVoivodeship: norm(body.salesVoivodeship),
      salesCounty: norm(body.salesCounty),
      salesMunicipality: norm(body.salesMunicipality),
      salesCity: norm(body.salesCity),
      salesStreet: norm(body.salesStreet),
      salesBuildingNr: norm(body.salesBuildingNr),
      salesUnitNr: norm(body.salesUnitNr),
      salesPostalCode: norm(body.salesPostalCode),
      salesAdditional: norm(body.salesAdditional),
      salesContact: norm(body.salesContact),
      contactEmail: norm(body.contactEmail),
      contactPhone: norm(body.contactPhone),
      contactFax: norm(body.contactFax),
      contactPerson: norm(body.contactPerson),
      websiteUrl: norm(body.websiteUrl),
      extIdent: norm(body.extIdent),
      xmlBasePath: norm(body.xmlBasePath),
      csvBasePath: norm(body.csvBasePath),
    },
    include: {
      units: {
        select: {
          id: true, label: true, buildingLabel: true, status: true,
          area: true, price: true,
          project: { select: { id: true, name: true, slug: true } },
        },
        orderBy: [{ projectId: 'asc' }, { buildingLabel: 'asc' }, { label: 'asc' }],
      },
    },
  })

  return NextResponse.json(company)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await hasRole('admin'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  await prisma.company.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
