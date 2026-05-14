import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const CONTENT_TYPES: Record<string, string> = {
  xml: 'application/xml; charset=utf-8',
  md5: 'text/plain; charset=utf-8',
  csv: 'text/csv; charset=utf-8',
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const { searchParams } = request.nextUrl

  const type = searchParams.get('type') // xml, md5, csv
  const date = searchParams.get('date') // YYYY-MM-DD for csv

  // Build the path key used in GeneratedFile table
  let filePath: string
  if (type === 'xml') {
    filePath = `${slug}-dataset.xml`
  } else if (type === 'md5') {
    filePath = `${slug}-dataset.md5`
  } else if (type === 'csv' && date) {
    filePath = `mieszkania-${slug}-${date}.csv`
  } else {
    return NextResponse.json(
      { error: 'Invalid request. Use ?type=xml|md5|csv&date=YYYY-MM-DD' },
      { status: 400 }
    )
  }

  const file = await prisma.generatedFile.findUnique({
    where: { path: filePath },
  })

  if (!file) {
    return NextResponse.json({ error: 'File not found. Run report generation first.' }, { status: 404 })
  }

  // Fetch from public blob URL and serve with inline disposition
  const response = await fetch(file.blobUrl)
  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to fetch file' }, { status: 502 })
  }

  const body = await response.text()

  return new NextResponse(body, {
    headers: {
      'Content-Type': CONTENT_TYPES[type!] || 'application/octet-stream',
      'Content-Disposition': 'inline',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=3600',
    },
  })
}
