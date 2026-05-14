import { NextRequest, NextResponse } from 'next/server'
import { generateAllReports } from '@/lib/dane-gov/generate-reports'

export const maxDuration = 300 // 5 minutes

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://jednopietrowawarszawa.pl'

  try {
    const result = await generateAllReports(baseUrl)
    return NextResponse.json({
      ok: true,
      generated: result.success,
      errors: result.errors,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
