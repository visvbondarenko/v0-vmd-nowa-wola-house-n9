import { NextResponse } from 'next/server'
import { hasRole } from '@/lib/auth'
import { reportReadiness } from '@/lib/dane-gov/readiness'

// Dry run of today's dane.gov.pl report for one company — read-only, nothing is generated or uploaded.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await hasRole('admin'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  try {
    return NextResponse.json(await reportReadiness(id))
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
