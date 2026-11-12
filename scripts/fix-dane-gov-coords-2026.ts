/**
 * One-off fix for the Dz.U. 2026 poz. 1489 CSV (2026-11-12): D8/D9 (coordinates) are required, but
 * Project.latitude/longitude are empty. Fills them with what /lokalizacja already shows (parsed from the
 * project's Google Maps link). Dry-run by default; --apply writes. Only fills empty fields.
 *
 *   npx tsx scripts/fix-dane-gov-coords-2026.ts [--apply]
 */
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'

if (!process.env.POSTGRES_PRISMA_URL) {
  try {
    for (const line of readFileSync('.env.local', 'utf-8').split('\n')) {
      const m = line.match(/^([^#=]+)=(.*)$/)
      if (!m) continue
      let v = m[2].trim()
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
      if (!process.env[m[1].trim()]) process.env[m[1].trim()] = v
    }
  } catch {}
}

const prisma = new PrismaClient()
const APPLY = process.argv.includes('--apply')
const COORDS: Record<string, { latitude: number; longitude: number }> = {
  'Wola House': { latitude: 52.093261, longitude: 20.967812 },
}

async function main() {
  console.log(APPLY ? '=== APPLY ===' : '=== DRY RUN (pass --apply to write) ===')
  for (const [name, c] of Object.entries(COORDS)) {
    const ps = await prisma.project.findMany({ where: { name } })
    if (ps.length !== 1) { console.log(`${name}: found ${ps.length}, expected 1 — skipped`); continue }
    const p = ps[0]
    if (p.latitude != null || p.longitude != null) { console.log(`${name}: already ${p.latitude}, ${p.longitude} — skipped`); continue }
    console.log(`${name}: SET latitude/longitude null → ${c.latitude}, ${c.longitude}`)
    if (APPLY) await prisma.project.update({ where: { id: p.id }, data: c })
  }
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
