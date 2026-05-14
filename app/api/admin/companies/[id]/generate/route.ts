import { NextResponse } from 'next/server'
import { hasRole } from '@/lib/auth'
import { generateReportsForCompany } from '@/lib/dane-gov/generate-reports'

export const maxDuration = 60

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await hasRole('admin'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: 'BLOB_READ_WRITE_TOKEN is not configured. Add it to your Vercel environment variables.' },
      { status: 500 }
    )
  }

  const { id } = await params
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  try {
    const result = await generateReportsForCompany(id, baseUrl)
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
