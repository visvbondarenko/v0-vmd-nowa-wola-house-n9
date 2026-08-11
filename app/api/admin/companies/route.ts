import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { normalizeStructuredText } from '@/lib/normalize-text'
import { isAuthenticated, hasRole } from '@/lib/auth'

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const companies = await prisma.company.findMany({
    include: { projects: { select: { id: true, name: true } } },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(companies)
}

export async function POST(request: Request) {
  if (!(await hasRole('admin'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await request.json()

  if (!body.name?.trim()) return NextResponse.json({ error: 'Nazwa jest wymagana' }, { status: 400 })
  if (!body.slug?.trim()) return NextResponse.json({ error: 'Slug jest wymagany' }, { status: 400 })
  if (!body.nip?.trim()) return NextResponse.json({ error: 'NIP jest wymagany' }, { status: 400 })
  if (!body.regon?.trim()) return NextResponse.json({ error: 'REGON jest wymagany' }, { status: 400 })

  try {
    // Same folding as the PUT path — see the comment there.
    const norm = (v: unknown): string | null =>
      typeof v === 'string' ? normalizeStructuredText(v) || null : null

    const company = await prisma.company.create({
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
    })
    return NextResponse.json(company)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('Unique constraint') && msg.includes('slug')) {
      return NextResponse.json({ error: 'Firma z takim slugiem już istnieje' }, { status: 400 })
    }
    console.error('Company create error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
