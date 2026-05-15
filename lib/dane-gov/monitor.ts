import { createHash } from 'crypto'
import { PrismaClient } from '@prisma/client'
import { withDbRetry } from '@/lib/prisma'

// One check's outcome. Status 'critical' triggers an alert, 'warning' is
// noted but not usually alerting on its own.
export type CheckStatus = 'ok' | 'warning' | 'critical'
export type Check = { name: string; status: CheckStatus; message?: string }
export type CompanyReport = { slug: string; status: CheckStatus; checks: Check[]; csvText: string | null }
export type MonitorReport = {
  status: CheckStatus
  companies: CompanyReport[]
  runAt: string
}

// A failed fetch / parse / MD5 mismatch / missing today's file is 'critical'.
// Sanity-ish drift ( ±20% row count, fullPrice < totalPrice, etc. ) is 'warning'.
// Escalate a company to worst-child status.
function worst(a: CheckStatus, b: CheckStatus): CheckStatus {
  if (a === 'critical' || b === 'critical') return 'critical'
  if (a === 'warning' || b === 'warning') return 'warning'
  return 'ok'
}

function todayUtcMidnight(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

function fmtDate(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

async function fetchText(url: string): Promise<{ ok: boolean; status: number; text: string }> {
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return { ok: false, status: res.status, text: '' }
    const text = await res.text()
    return { ok: true, status: res.status, text }
  } catch {
    return { ok: false, status: 0, text: '' }
  }
}

async function fetchBinaryMd5(url: string): Promise<{ ok: boolean; status: number; md5: string }> {
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return { ok: false, status: res.status, md5: '' }
    const buf = Buffer.from(await res.arrayBuffer())
    return { ok: true, status: res.status, md5: createHash('md5').update(buf).digest('hex') }
  } catch {
    return { ok: false, status: 0, md5: '' }
  }
}

function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let q = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (q) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++ } else { q = false }
      } else cur += ch
    } else {
      if (ch === '"') q = true
      else if (ch === ';') { out.push(cur); cur = '' }
      else cur += ch
    }
  }
  out.push(cur)
  return out
}

type DbData = {
  company: { id: string } | null
  todaysFile: { createdAt: Date } | null
}

async function checkCompany(
  slug: string,
  baseUrl: string,
  today: Date,
  db: DbData
): Promise<CompanyReport> {
  const checks: Check[] = []
  const todayStr = fmtDate(today)
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const yesterdayStr = fmtDate(yesterday)

  const xmlUrl = `${baseUrl}/wp-content/uploads/raporty/${slug}-dataset.xml`
  // WP hosts MD5 alongside the XML at /wp-content/uploads/raporty/; our own
  // rewrites will need to serve it at the same path after migration.
  const md5Url = `${baseUrl}/wp-content/uploads/raporty/${slug}-dataset.md5`
  const csvUrl = `${baseUrl}/wp-content/uploads/raporty/mieszkania-${slug}-${todayStr}.csv`
  const yesterdayCsvUrl = `${baseUrl}/wp-content/uploads/raporty/mieszkania-${slug}-${yesterdayStr}.csv`

  // 1-3: fetch XML, MD5, today's CSV, and yesterday's CSV in parallel
  const [xmlRes, md5Res, csvRes, ydRes] = await Promise.all([
    fetchText(xmlUrl),
    fetchText(md5Url),
    fetchText(csvUrl),
    fetchText(yesterdayCsvUrl),
  ])

  // 1. XML availability + parses
  if (!xmlRes.ok) {
    checks.push({ name: 'xml.available', status: 'critical', message: `HTTP ${xmlRes.status} for ${xmlUrl}` })
  } else {
    checks.push({ name: 'xml.available', status: 'ok' })
    const hasResource = /<resource\b/.test(xmlRes.text)
    const hasTodaysResource = new RegExp(`<date>${todayStr}T`).test(xmlRes.text)
      || new RegExp(`mieszkania-${slug}-${todayStr}\\.csv`).test(xmlRes.text)
    if (!hasResource) {
      checks.push({ name: 'xml.parses', status: 'critical', message: 'XML has no <resource> entries' })
    } else {
      checks.push({ name: 'xml.parses', status: 'ok' })
    }
    if (!hasTodaysResource) {
      checks.push({ name: `xml.has-today (${todayStr})`, status: 'critical', message: `No <resource> for today's CSV` })
    } else {
      checks.push({ name: `xml.has-today (${todayStr})`, status: 'ok' })
    }
  }

  // 2. MD5 availability + matches actual XML hash
  if (!md5Res.ok) {
    checks.push({ name: 'md5.available', status: 'critical', message: `HTTP ${md5Res.status} for ${md5Url}` })
  } else if (xmlRes.ok) {
    const actualMd5 = createHash('md5').update(xmlRes.text).digest('hex')
    const claimed = md5Res.text.trim().split(/\s+/)[0]
    if (!claimed || claimed.toLowerCase() !== actualMd5) {
      checks.push({
        name: 'md5.matches',
        status: 'critical',
        message: `MD5 file = ${claimed || '<empty>'}, actual = ${actualMd5}`,
      })
    } else {
      checks.push({ name: 'md5.matches', status: 'ok' })
    }
  }

  // 3. Today's CSV availability + parse
  let todayRowCount = 0
  if (!csvRes.ok) {
    checks.push({ name: `csv.available (${todayStr})`, status: 'critical', message: `HTTP ${csvRes.status}` })
  } else {
    const clean = csvRes.text.charCodeAt(0) === 0xfeff ? csvRes.text.slice(1) : csvRes.text
    const lines = clean.split(/\r?\n/).filter(l => l.trim().length > 0)
    if (lines.length === 0) {
      checks.push({ name: 'csv.parses', status: 'critical', message: 'CSV is completely empty (no header)' })
    } else if (lines.length === 1) {
      checks.push({ name: 'csv.rowCount', status: 'ok', message: 'all units sold (0 rows)' })
    } else {
      const header = parseCsvLine(lines[0])
      const expected = 59
      if (header.length !== expected) {
        checks.push({
          name: 'csv.columns',
          status: 'critical',
          message: `Header has ${header.length} columns, expected ${expected}`,
        })
      } else {
        checks.push({ name: 'csv.columns', status: 'ok' })
      }
      const dataRows = lines.slice(1).map(parseCsvLine)
      const malformed = dataRows.find(r => r.length !== header.length)
      if (malformed) {
        checks.push({
          name: 'csv.rows',
          status: 'critical',
          message: `At least one row has ${malformed.length} cols (expected ${header.length})`,
        })
      } else {
        checks.push({ name: 'csv.rows', status: 'ok' })
      }
      todayRowCount = dataRows.length
      checks.push({
        name: 'csv.rowCount',
        status: todayRowCount > 0 ? 'ok' : 'critical',
        message: `${todayRowCount} rows`,
      })

      // Regulator sanity: fullPrice >= totalPrice
      let fullLtTotal = 0
      for (const row of dataRows) {
        const totalPrice = parseFloat(row[40] || '') || 0
        const fullPrice = parseFloat(row[42] || '') || 0
        if (totalPrice > 0 && fullPrice > 0 && fullPrice < totalPrice - 0.5) fullLtTotal++
      }
      if (fullLtTotal > 0) {
        checks.push({
          name: 'csv.fullPrice >= totalPrice',
          status: 'warning',
          message: `${fullLtTotal} row(s) have fullPrice < totalPrice`,
        })
      }
    }
  }

  // 4. Row-count vs yesterday (warning only)
  if (csvRes.ok && todayRowCount > 0 && ydRes.ok) {
    const clean = ydRes.text.charCodeAt(0) === 0xfeff ? ydRes.text.slice(1) : ydRes.text
    const ydLines = clean.split(/\r?\n/).filter(l => l.trim().length > 0)
    const ydRowCount = Math.max(0, ydLines.length - 1)
    if (ydRowCount > 0) {
      const pctDelta = Math.abs(todayRowCount - ydRowCount) / ydRowCount
      if (pctDelta > 0.2) {
        checks.push({
          name: 'csv.rowCount vs yesterday',
          status: 'warning',
          message: `today=${todayRowCount}, yesterday=${ydRowCount} (D${(pctDelta * 100).toFixed(0)}%)`,
        })
      }
    }
  }

  // 5. DB sanity: today's GeneratedFile was written within last 24h (pre-fetched)
  if (!db.company) {
    checks.push({ name: 'db.company', status: 'critical', message: 'Company not found in DB' })
  } else if (!db.todaysFile) {
    checks.push({
      name: 'db.generatedFile',
      status: 'critical',
      message: `No GeneratedFile row for today's CSV`,
    })
  } else {
    const ageMs = Date.now() - db.todaysFile.createdAt.getTime()
    if (ageMs > 24 * 60 * 60 * 1000) {
      checks.push({
        name: 'db.generatedFile freshness',
        status: 'warning',
        message: `GeneratedFile.createdAt is ${Math.round(ageMs / 3600000)}h old`,
      })
    } else {
      checks.push({ name: 'db.generatedFile', status: 'ok' })
    }
  }

  const status = checks.reduce<CheckStatus>((acc, c) => worst(acc, c.status), 'ok')
  const csvText = csvRes.ok ? (csvRes.text.charCodeAt(0) === 0xfeff ? csvRes.text.slice(1) : csvRes.text) : null
  return { slug, status, checks, csvText }
}

export async function runMonitor(
  prisma: PrismaClient,
  baseUrl: string
): Promise<MonitorReport> {
  const today = todayUtcMidnight()
  const todayStr = fmtDate(today)

  // Fetch all DB data upfront in two queries — before any HTTP calls — so the
  // connection is established while the DB is warm and not blocked by the long
  // HTTP fetch phase that follows. Mirrors generate-reports.ts's eligibility
  // filter so the monitor stays in lockstep with what the cron actually
  // produces — onboarding a new company in the admin auto-enrolls it here.
  const dbCompanies = await withDbRetry(() => prisma.company.findMany({
    where: { extIdent: { not: null }, units: { some: {} } },
    select: { id: true, slug: true },
    orderBy: { slug: 'asc' },
  }), 'monitor.companies')

  const todaysFiles = await withDbRetry(() => prisma.generatedFile.findMany({
    where: {
      companyId: { in: dbCompanies.map(c => c.id) },
      path: { contains: `${todayStr}.csv` },
    },
    select: { companyId: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  }), 'monitor.todaysFiles')
  const fileByCompany = new Map(todaysFiles.map(f => [f.companyId, f]))

  // Run all company HTTP checks in parallel — independent of each other and DB.
  const companies = await Promise.all(
    dbCompanies.map(company => {
      const todaysFile = fileByCompany.get(company.id) ?? null
      return checkCompany(company.slug, baseUrl, today, { company, todaysFile })
    })
  )

  const status = companies.reduce<CheckStatus>((acc, c) => worst(acc, c.status), 'ok')
  return { status, companies, runAt: new Date().toISOString() }
}

export function formatMonitorEmail(report: MonitorReport): { subject: string; text: string } {
  const statusEmoji = report.status === 'critical' ? '🚨' : report.status === 'warning' ? '⚠️' : '✅'
  const subject = `${statusEmoji} dane.gov.pl daily monitor — ${report.status.toUpperCase()}`
  const lines: string[] = []
  lines.push(`Monitor run: ${report.runAt}`)
  lines.push(`Overall status: ${report.status}`)
  lines.push('')
  for (const c of report.companies) {
    const emoji = c.status === 'critical' ? 'X' : c.status === 'warning' ? '!' : 'v'
    lines.push(`${emoji} ${c.slug} — ${c.status}`)
    for (const check of c.checks) {
      if (check.status === 'ok') continue
      lines.push(`    [${check.status}] ${check.name}${check.message ? ` — ${check.message}` : ''}`)
    }
  }
  return { subject, text: lines.join('\n') }
}

// ─── CSV column indices (0-based) ────────────────────────────────────────────
const COL_COMPANY = 0   // Nazwa dewelopera
const COL_PROJECT = 1   // Nazwa przedsiewziecia
const COL_TYPE    = 36  // Rodzaj nieruchomosci
const COL_LABEL   = 37  // Nr lokalu / domu
const COL_PPS     = 38  // Cena m2
const COL_TOTAL   = 40  // Cena laczna (iloczyn m2 x pow)
const COL_FULL    = 42  // Cena pelna (art. 19a)
const COL_PARTS_T = 44  // Rodzaj czesci (parking / komorka / ogrodek)
const COL_PARTS_P = 46  // Cena czesci lacznie

function pln(s: string): string {
  const n = parseFloat(s)
  if (!s || s === 'X' || isNaN(n) || n === 0) return '—'
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' zł'
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// ─── Color palette ──────────────────────────────────────────────────────────
const C = {
  ink:       '#0f172a',  // primary headings
  body:      '#334155',  // body text
  muted:     '#64748b',  // secondary
  faint:     '#94a3b8',  // tertiary
  hairline:  '#e2e8f0',  // borders
  divider:   '#f1f5f9',  // inner dividers
  page:      '#f8fafc',  // page bg
  card:      '#ffffff',  // card bg
}

function statusDot(status: CheckStatus): string {
  const fill: Record<CheckStatus, string> = { ok: '#22c55e', warning: '#f59e0b', critical: '#ef4444' }
  return `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${fill[status]};vertical-align:middle;"></span>`
}

function statusLabel(status: CheckStatus): string {
  const fg: Record<CheckStatus, string> = { ok: '#16a34a', warning: '#b45309', critical: '#dc2626' }
  const text: Record<CheckStatus, string> = { ok: 'OK', warning: 'WARN', critical: 'CRIT' }
  return `<span style="color:${fg[status]};font-size:10px;font-weight:700;letter-spacing:.06em;">${text[status]}</span>`
}

function buildCompanyHtml(c: CompanyReport, todayStr: string): string {
  const alerts = c.checks.filter(ch => ch.status !== 'ok')
  const alertsHtml = alerts.length === 0 ? '' :
    `<tr><td style="padding:8px 24px 4px;">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fff7ed;border-left:3px solid #fb923c;border-radius:0 4px 4px 0;">` +
    `<tr><td style="padding:8px 12px;font-size:11px;color:#9a3412;line-height:1.6;">` +
    alerts.map(ch => `<div><strong style="font-weight:600;">[${esc(ch.status)}]</strong> ${esc(ch.name)}${ch.message ? ` — ${esc(ch.message)}` : ''}</div>`).join('') +
    `</td></tr></table>` +
    `</td></tr>`

  if (!c.csvText) {
    return `<tr><td style="padding:24px 24px 12px;border-top:1px solid ${C.hairline};">` +
      `<div style="font-size:13px;font-weight:700;color:${C.ink};letter-spacing:.02em;text-transform:uppercase;">${esc(c.slug)}</div>` +
      `<div style="margin-top:4px;font-size:11px;color:${C.faint};">${statusDot(c.status)}&nbsp;&nbsp;CSV niedostępne</div>` +
      `</td></tr>`
  }

  const csvLines = c.csvText.split(/\r?\n/).filter(l => l.trim())
  if (csvLines.length < 2) {
    return `<tr><td style="padding:24px 24px 12px;border-top:6px solid ${C.divider};">` +
      `<div style="font-size:13px;font-weight:700;color:${C.ink};letter-spacing:.02em;text-transform:uppercase;">${esc(c.slug)}</div>` +
      `<div style="margin-top:6px;padding:8px 12px;background:#f0fdf4;border-left:3px solid #22c55e;border-radius:0 4px 4px 0;font-size:11px;color:#166534;">Wszystkie lokale sprzedane</div>` +
      `</td></tr>`
  }
  const rows = csvLines.slice(1).map(parseCsvLine)
  const companyName = rows[0]?.[COL_COMPANY] || c.slug

  const projects = new Map<string, typeof rows>()
  for (const row of rows) {
    const proj = row[COL_PROJECT] || '(brak projektu)'
    if (!projects.has(proj)) projects.set(proj, [])
    projects.get(proj)!.push(row)
  }

  const projectsHtml = [...projects.entries()].map(([projName, units]) => {
    const unitRows = units.map(row => {
      const label = row[COL_LABEL] || '—'
      const rawType = row[COL_TYPE] || ''
      const type = rawType.startsWith('dom') ? 'dom' : rawType.startsWith('lokal') ? 'lokal' : rawType.slice(0, 10)

      const ppsVal = parseFloat(row[COL_PPS]) || 0
      const totalVal = parseFloat(row[COL_TOTAL]) || 0
      const fullVal = parseFloat(row[COL_FULL]) || 0
      const area = ppsVal > 0 && totalVal > 0 ? (totalVal / ppsVal).toFixed(2) : ''

      const partsVal = parseFloat(row[COL_PARTS_P]) || 0
      const partsType = row[COL_PARTS_T] || ''
      const partsTxt = partsVal > 0
        ? pln(row[COL_PARTS_P]) + (partsType ? ` <span style="color:${C.faint};">(${esc(partsType)})</span>` : '')
        : `<span style="color:#cbd5e1;">·</span>`

      const numStyle = `font-variant-numeric:tabular-nums;font-feature-settings:'tnum';`
      const cellBase = `padding:6px 10px;border-bottom:1px solid ${C.divider};font-size:11px;color:${C.body};white-space:nowrap;`

      return `<tr>` +
        `<td style="${cellBase}font-weight:600;color:${C.ink};">${esc(label)}</td>` +
        `<td style="${cellBase}color:${type === 'dom' ? '#1d4ed8' : type === 'lokal' ? '#15803d' : C.muted};">${esc(type)}</td>` +
        `<td style="${cellBase}text-align:right;${numStyle}">${area || '—'}</td>` +
        `<td style="${cellBase}text-align:right;${numStyle}color:${C.muted};">${pln(row[COL_PPS])}</td>` +
        `<td style="${cellBase}text-align:right;${numStyle}font-weight:600;color:${C.ink};">${pln(row[COL_FULL])}</td>` +
        `<td style="${cellBase}${numStyle}">${partsTxt}</td>` +
        `</tr>`
    }).join('')

    const TH = (label: string, align = 'left') =>
      `<th style="padding:6px 10px;text-align:${align};font-size:9px;font-weight:600;color:${C.faint};text-transform:uppercase;letter-spacing:.08em;border-bottom:1px solid ${C.hairline};white-space:nowrap;">${label}</th>`

    return `<tr><td style="padding:18px 24px 4px;">` +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:6px;">` +
      `<tr>` +
        `<td style="font-size:12px;font-weight:600;color:${C.ink};">${esc(projName)}</td>` +
        `<td style="text-align:right;font-size:10px;color:${C.faint};text-transform:uppercase;letter-spacing:.06em;">${units.length}&nbsp;${units.length === 1 ? 'lokal' : units.length < 5 ? 'lokale' : 'lokali'}</td>` +
      `</tr>` +
      `</table>` +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border-top:1px solid ${C.hairline};">` +
      `<thead><tr>` +
      TH('Nr') + TH('Typ') + TH('m²', 'right') +
      TH('Cena/m²', 'right') + TH('Cena pełna', 'right') + TH('Dopłaty') +
      `</tr></thead><tbody>${unitRows}</tbody></table>` +
      `</td></tr>`
  }).join('')

  // Company header
  const headerHtml = `<tr><td style="padding:24px 24px 0;border-top:6px solid ${C.divider};">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">` +
    `<tr>` +
      `<td style="font-size:13px;font-weight:700;color:${C.ink};letter-spacing:.02em;text-transform:uppercase;">${esc(companyName)}</td>` +
      `<td style="text-align:right;white-space:nowrap;">${statusDot(c.status)}&nbsp;&nbsp;${statusLabel(c.status)}</td>` +
    `</tr>` +
    `<tr>` +
      `<td colspan="2" style="padding-top:3px;font-size:10px;color:${C.faint};">` +
        `${rows.length} ${rows.length === 1 ? 'lokal' : 'lokali'} · ${projects.size} ${projects.size === 1 ? 'projekt' : 'projekty'} · ` +
        `<span style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">mieszkania-${esc(c.slug)}-${esc(todayStr)}.csv</span>` +
      `</td>` +
    `</tr>` +
    `</table>` +
    `</td></tr>`

  return headerHtml + alertsHtml + projectsHtml
}

function buildDailyHtml(report: MonitorReport, todayStr: string): string {
  const headerBg: Record<CheckStatus, string> = {
    ok: '#0f172a', warning: '#78350f', critical: '#7f1d1d',
  }
  const statusEmoji = report.status === 'critical' ? '&#128680;' : report.status === 'warning' ? '&#9888;&#65039;' : '&#9989;'

  // Aggregate stats for header
  let totalUnits = 0
  let totalProjects = 0
  for (const c of report.companies) {
    if (!c.csvText) continue
    const csvLines = c.csvText.split(/\r?\n/).filter(l => l.trim())
    const rows = csvLines.slice(1).map(parseCsvLine)
    totalUnits += rows.length
    const projs = new Set<string>()
    for (const r of rows) projs.add(r[COL_PROJECT] || '')
    totalProjects += projs.size
  }

  // Status overview row — small dots + names
  const statusRow = report.companies.map(c => {
    const short = c.slug.replace(/-sp-z-o-o$/, '').replace(/-sp-k$/, '').split('-').slice(0, 2).join('-')
    return `<td style="padding:6px 12px 6px 0;font-size:10px;color:${C.body};white-space:nowrap;">` +
      `${statusDot(c.status)}&nbsp;&nbsp;${esc(short)}` +
      `</td>`
  }).join('')

  const companySections = report.companies.map(c => buildCompanyHtml(c, todayStr)).join('\n')

  return `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>dane.gov.pl ${esc(todayStr)}</title>
</head>
<body style="margin:0;padding:0;background:${C.page};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${C.body};-webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.page};padding:24px 16px;">
<tr><td align="center">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:780px;background:${C.card};border:1px solid ${C.hairline};border-radius:10px;overflow:hidden;">

  <tr><td style="background:${headerBg[report.status]};color:#fff;padding:18px 24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td>
        <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.12em;opacity:.55;">Raport dzienny</div>
        <div style="margin-top:4px;font-size:18px;font-weight:700;letter-spacing:-.01em;">${statusEmoji}&nbsp; dane.gov.pl &middot; ${esc(todayStr)}</div>
      </td>
      <td align="right" valign="top" style="font-size:10px;opacity:.55;line-height:1.5;">
        ${esc(report.runAt.replace('T', ' ').slice(0, 16))} UTC<br>
        ${totalUnits} lokali · ${report.companies.length} firm
      </td>
    </tr>
    </table>
  </td></tr>

  <tr><td style="padding:10px 24px;background:${C.page};border-bottom:1px solid ${C.hairline};">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>${statusRow}</tr></table>
  </td></tr>

  ${companySections}

  <tr><td style="background:${C.page};padding:14px 24px;border-top:1px solid ${C.hairline};font-size:10px;color:${C.faint};line-height:1.5;">
    Generowane automatycznie · art.&nbsp;19b ust.&nbsp;1 Ustawy z dnia 20 maja 2021&nbsp;r. o ochronie praw nabywcy lokalu mieszkalnego lub domu jednorodzinnego (Dz.&nbsp;U.&nbsp;z 2024&nbsp;r. poz.&nbsp;695)
  </td></tr>

</table>

</td></tr>
</table>
</body>
</html>`
}

export function formatDailyEmail(
  report: MonitorReport,
  todayStr: string
): { subject: string; text: string; html: string } {
  const statusEmoji = report.status === 'critical' ? '🚨' : report.status === 'warning' ? '⚠️' : '✅'
  const subject = `${statusEmoji} dane.gov.pl daily report — ${todayStr} — ${report.status.toUpperCase()}`

  // Plain-text fallback
  const lines: string[] = []
  lines.push(`Monitor run: ${report.runAt}`)
  lines.push(`Overall status: ${report.status}`)
  lines.push('')
  for (const c of report.companies) {
    const icon = c.status === 'critical' ? 'X' : c.status === 'warning' ? '!' : 'v'
    lines.push(`${icon} ${c.slug} — ${c.status}`)
    for (const check of c.checks) {
      if (check.status === 'ok') continue
      lines.push(`    [${check.status}] ${check.name}${check.message ? ` — ${check.message}` : ''}`)
    }
  }
  const padR = (s: string, n: number) => (s.length >= n ? s : s + ' '.repeat(n - s.length))
  const padL = (s: string, n: number) => (s.length >= n ? s : ' '.repeat(n - s.length) + s)

  for (const c of report.companies) {
    lines.push('')
    lines.push('='.repeat(72))
    if (!c.csvText) {
      lines.push(`${c.slug.toUpperCase()}  [NIEDOSTEPNE]`)
      lines.push('='.repeat(72))
      continue
    }
    const csvLines = c.csvText.split(/\r?\n/).filter(l => l.trim())
    if (csvLines.length < 2) {
      lines.push(`${c.slug.toUpperCase()}  [WSZYSTKIE LOKALE SPRZEDANE]`)
      lines.push('='.repeat(72))
      continue
    }
    const rows = csvLines.slice(1).map(parseCsvLine)
    const companyName = rows[0]?.[COL_COMPANY] || c.slug

    lines.push(`${companyName.toUpperCase()}  (${rows.length} ${rows.length === 1 ? 'lokal' : 'lokali'})`)
    lines.push('='.repeat(72))

    // Group by project name (col 2 of the CSV)
    const projects = new Map<string, typeof rows>()
    for (const row of rows) {
      const proj = row[COL_PROJECT] || '(brak projektu)'
      if (!projects.has(proj)) projects.set(proj, [])
      projects.get(proj)!.push(row)
    }

    for (const [projName, units] of projects) {
      lines.push('')
      lines.push(`  ${projName}  (${units.length} ${units.length === 1 ? 'lokal' : units.length < 5 ? 'lokale' : 'lokali'})`)
      lines.push(`  ${'-'.repeat(68)}`)
      for (const row of units) {
        const ppsVal = parseFloat(row[COL_PPS]) || 0
        const totalVal = parseFloat(row[COL_TOTAL]) || 0
        const fullVal = parseFloat(row[COL_FULL]) || 0
        const label = row[COL_LABEL] || '—'

        if (ppsVal === 0 && totalVal === 0) {
          lines.push(`    ${padR(label, 8)} ${padL('—', 10)}   ${padL('(brak ceny)', 14)}`)
          continue
        }

        const area = ppsVal > 0 && totalVal > 0 ? (totalVal / ppsVal).toFixed(1) + ' m²' : '—'
        const ppsm = pln(row[COL_PPS]) + '/m²'
        const total = pln(row[COL_TOTAL])
        const extras = fullVal > totalVal + 0.5 ? `  + ${pln(String(fullVal - totalVal))}` : ''

        lines.push(
          `    ${padR(label, 8)} ${padL(area, 10)}   ${padL(ppsm, 14)}   ${padL(total, 14)}${extras}`
        )
      }
    }
  }

  return { subject, text: lines.join('\n'), html: buildDailyHtml(report, todayStr) }
}

function buildWeeklyHtml(args: {
  results: { date: Date; status: string }[]
  ok: number
  warning: number
  critical: number
  missingCount: number
  allGreen: boolean
}): string {
  const { results, ok, warning, critical, missingCount, allGreen } = args
  const headerBg = critical > 0 ? '#7f1d1d' : (warning > 0 || missingCount > 0) ? '#78350f' : '#0f172a'
  const statusEmoji = critical > 0 ? '&#128680;' : (warning > 0 || missingCount > 0) ? '&#9888;&#65039;' : '&#9989;'

  const dotFill: Record<string, string> = {
    ok: '#22c55e', warning: '#f59e0b', critical: '#ef4444',
  }

  // Sort newest first to match the text version
  const sorted = [...results].sort((a, b) => b.date.getTime() - a.date.getTime())

  const dayRows = sorted.map(r => {
    const fill = dotFill[r.status] || '#cbd5e1'
    const labelColor = r.status === 'ok' ? '#16a34a' : r.status === 'warning' ? '#b45309' : '#dc2626'
    return `<tr>
      <td style="padding:6px 0;font-size:11px;color:${C.body};font-variant-numeric:tabular-nums;width:90px;">${fmtDate(r.date)}</td>
      <td style="padding:6px 0;width:18px;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${fill};vertical-align:middle;"></span></td>
      <td style="padding:6px 0;font-size:11px;font-weight:600;color:${labelColor};text-transform:uppercase;letter-spacing:.06em;">${esc(r.status)}</td>
    </tr>`
  }).join('')

  const counterCell = (n: number, label: string, color: string) =>
    `<td align="center" style="padding:14px 8px;">
      <div style="font-size:24px;font-weight:700;color:${color};line-height:1;font-variant-numeric:tabular-nums;">${n}</div>
      <div style="margin-top:4px;font-size:9px;font-weight:600;color:${C.faint};text-transform:uppercase;letter-spacing:.1em;">${label}</div>
    </td>`

  return `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>dane.gov.pl weekly</title>
</head>
<body style="margin:0;padding:0;background:${C.page};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${C.body};-webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.page};padding:24px 16px;">
<tr><td align="center">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background:${C.card};border:1px solid ${C.hairline};border-radius:10px;overflow:hidden;">

  <tr><td style="background:${headerBg};color:#fff;padding:18px 24px;">
    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.12em;opacity:.55;">Raport tygodniowy</div>
    <div style="margin-top:4px;font-size:18px;font-weight:700;letter-spacing:-.01em;">${statusEmoji}&nbsp; dane.gov.pl &middot; ostatnie 7 dni</div>
  </td></tr>

  <tr><td style="padding:0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom:1px solid ${C.hairline};">
      <tr>
        ${counterCell(ok, 'OK', '#16a34a')}
        ${counterCell(warning, 'Warn', '#b45309')}
        ${counterCell(critical, 'Crit', '#dc2626')}
        ${missingCount > 0 ? counterCell(missingCount, 'Miss', C.muted) : ''}
      </tr>
    </table>
  </td></tr>

  <tr><td style="padding:18px 24px;">
    <div style="font-size:10px;font-weight:600;color:${C.faint};text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;">Dzień po dniu</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${dayRows}
    </table>
    ${allGreen ? `<div style="margin-top:14px;padding:10px 12px;background:#f0fdf4;border-left:3px solid #22c55e;border-radius:0 4px 4px 0;font-size:11px;color:#166534;">Wszystkie kontrole zakończone pomyślnie. Raportowanie do dane.gov.pl jest zdrowe.</div>` : ''}
  </td></tr>

  <tr><td style="background:${C.page};padding:10px 24px;border-top:1px solid ${C.hairline};font-size:10px;color:${C.faint};">
    Heartbeat tygodniowy &middot; piątek 06:00 UTC
  </td></tr>

</table>

</td></tr>
</table>
</body>
</html>`
}

export function formatWeeklyEmail(args: {
  results: { date: Date; status: string; details: unknown }[]
  expectedCount: number
}): { subject: string; text: string; html: string } {
  const { results, expectedCount } = args
  const missingCount = Math.max(0, expectedCount - results.length)
  const critical = results.filter(r => r.status === 'critical').length
  const warning = results.filter(r => r.status === 'warning').length
  const ok = results.filter(r => r.status === 'ok').length
  const allGreen = missingCount === 0 && critical === 0 && warning === 0

  const subject = allGreen
    ? '✅ dane.gov.pl weekly — all 7 days green'
    : `⚠️ dane.gov.pl weekly — ${critical} critical / ${warning} warning / ${missingCount} missing`

  const lines: string[] = []
  lines.push(`Past 7 daily monitor runs:`)
  lines.push(`  v ok:       ${ok}`)
  lines.push(`  ! warning:  ${warning}`)
  lines.push(`  X critical: ${critical}`)
  if (missingCount > 0) lines.push(`  ? missing:  ${missingCount} (daily monitor may not have run)`)
  lines.push('')
  lines.push('Day-by-day:')
  for (const r of [...results].sort((a, b) => b.date.getTime() - a.date.getTime())) {
    const emoji = r.status === 'critical' ? 'X' : r.status === 'warning' ? '!' : 'v'
    lines.push(`  ${emoji} ${fmtDate(r.date)} — ${r.status}`)
  }
  if (allGreen) {
    lines.push('')
    lines.push('All daily checks passed. dane.gov.pl reporting is healthy.')
  }

  return {
    subject,
    text: lines.join('\n'),
    html: buildWeeklyHtml({ results, ok, warning, critical, missingCount, allGreen }),
  }
}
