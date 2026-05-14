import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { runMonitor, formatDailyEmail } from '@/lib/dane-gov/monitor'
import { sendMonitorEmail } from '@/lib/dane-gov/mailer'

export const maxDuration = 300

// Idempotent by design: writing today's MonitorResult uses an upsert keyed on
// the UTC-midnight date, so re-invoking within the same day replaces the prior
// row instead of creating duplicates.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://jednopietrowawarszawa.pl'

  try {
    const report = await runMonitor(prisma, baseUrl)

    const now = new Date()
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const todayStr = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}-${String(today.getUTCDate()).padStart(2, '0')}`

    await prisma.monitorResult.upsert({
      where: { date: today },
      create: {
        date: today,
        status: report.status,
        details: report as unknown as object,
      },
      update: {
        status: report.status,
        // cast through unknown because Prisma's Json input type is stricter than our TS type
        details: report as unknown as object,
      },
    })

    const { subject, text, html } = formatDailyEmail(report, todayStr)
    await sendMonitorEmail({ subject, text, html })

    return NextResponse.json({ ok: true, status: report.status, companies: report.companies.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)

    // Try to notify ourselves that the monitor itself is broken.
    try {
      await sendMonitorEmail({
        subject: '🚨 dane.gov.pl monitor crashed',
        text: `The daily monitor threw an exception:\n\n${message}\n\nInvestigate /api/cron/dane-gov-monitor logs.`,
      })
    } catch {}

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
