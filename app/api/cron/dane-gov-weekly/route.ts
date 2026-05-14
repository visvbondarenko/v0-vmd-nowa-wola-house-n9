import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { formatWeeklyEmail } from '@/lib/dane-gov/monitor'
import { sendMonitorEmail } from '@/lib/dane-gov/mailer'

export const maxDuration = 60

// Sends an unconditional heartbeat every Friday summarising the last 7 daily
// monitor runs. If it doesn't arrive, the monitoring itself is broken —
// silence is not success.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    const results = await prisma.monitorResult.findMany({
      where: { date: { gte: weekAgo, lte: today } },
      orderBy: { date: 'asc' },
    })

    const { subject, text, html } = formatWeeklyEmail({ results, expectedCount: 7 })
    await sendMonitorEmail({ subject, text, html })

    return NextResponse.json({ ok: true, count: results.length, subject })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
