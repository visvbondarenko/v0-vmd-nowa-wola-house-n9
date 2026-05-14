import { Resend } from 'resend'

// Kept in one place so both the daily monitor and the weekly rollup send from
// the same sender & recipient list. Override recipients by setting
// MONITOR_ALERT_RECIPIENTS (comma-separated) in env.
const DEFAULT_RECIPIENTS = ['vlad@qualops.io']

function recipients(): string[] {
  const env = process.env.MONITOR_ALERT_RECIPIENTS
  if (!env) return DEFAULT_RECIPIENTS
  return env.split(',').map(s => s.trim()).filter(Boolean)
}

export async function sendMonitorEmail(args: {
  subject: string
  text: string
  html?: string
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set — skipping monitor email')
    return
  }
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: 'dane.gov.pl monitor <kontakt@vmd-development.com>',
    to: recipients(),
    subject: args.subject,
    text: args.text,
    ...(args.html ? { html: args.html } : {}),
  })
}
