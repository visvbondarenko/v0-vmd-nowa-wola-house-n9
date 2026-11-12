/**
 * Regenerates today's dane.gov.pl CSV + dataset XML + MD5 for every company — the same call the daily cron
 * makes (generateAllReports), run locally against the production DB/Blob from .env.local.
 * Overwrites today's files in place (same URLs). Base URL is pinned to production's NEXT_PUBLIC_BASE_URL so
 * the XML resource URLs stay identical.
 *
 *   npx tsx scripts/regenerate-dane-gov.ts
 */
import { readFileSync } from 'fs'

const BASE_URL = 'https://vmd-development.com'

for (const line of readFileSync('.env.local', 'utf-8').split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (!m) continue
  let v = m[2].trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
  if (!process.env[m[1].trim()]) process.env[m[1].trim()] = v
}
// Prisma in this repo reads POSTGRES_PRISMA_URL; prefer the direct URL for a one-off script.
if (process.env.POSTGRES_URL_NON_POOLING) process.env.POSTGRES_PRISMA_URL = process.env.POSTGRES_URL_NON_POOLING

async function main() {
  const { generateAllReports } = await import('../lib/dane-gov/generate-reports')
  const result = await generateAllReports(BASE_URL)
  console.log(JSON.stringify(result, null, 2))
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
