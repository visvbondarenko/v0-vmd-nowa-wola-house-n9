import { generateCsvForCompany } from './csv-generator'
import { validateCsv2026 } from './format-2026'

// Dry run of today's dane.gov.pl CSV (Dz.U. 2026 poz. 1489) for one company: renders it exactly like the cron
// and lists what would make it incomplete, in admin language. Nothing is written or published.
// Same rules as Dewelo's lib/dane-gov/readiness.ts.

export type ReadinessIssue = { what: string; field: string; where: string; units: string[] }

const GROUPS: Record<string, { what: string; where: string }> = {
  A: { what: 'Dane spółki', where: 'Firmy → nazwa i NIP' },
  B: { what: 'Adres siedziby spółki', where: 'Firmy → adres siedziby' },
  C: { what: 'Biuro sprzedaży', where: 'Firmy → adres sprzedaży i sposób kontaktu' },
  D: { what: 'Lokalizacja inwestycji', where: 'Projekty → dane inwestycji (adres, mapa w sekcji Lokalizacja)' },
  E: { what: 'Lokal', where: 'Lokale → cena i powierzchnia' },
  F: { what: 'Pomieszczenie przynależne', where: 'Lokale → komórka' },
  G: { what: 'Prawa', where: 'Lokale → prawa' },
  H: { what: 'Inne świadczenia', where: 'Lokale → parking / ogródek' },
}
const FIELDS: Record<string, string> = {
  A1: 'nazwa spółki', A2: 'NIP (10 cyfr)', B1: 'województwo', B2: 'powiat', B3: 'gmina', B4: 'miejscowość', B6: 'numer budynku', B8: 'kod pocztowy',
  C1: 'województwo', C2: 'powiat', C3: 'gmina', C4: 'miejscowość', C6: 'numer budynku', C8: 'kod pocztowy', C10: 'sposób kontaktu (telefon, e-mail)',
  D1: 'województwo', D2: 'powiat', D3: 'gmina', D4: 'miejscowość', D7: 'kod pocztowy',
  D8: 'współrzędne (pinezka na mapie)', D9: 'współrzędne (pinezka na mapie)',
  E1: 'rodzaj nieruchomości', E3: 'cena za m² (cena i powierzchnia)', E4: 'data ceny za m²', E5: 'cena', E6: 'data ceny',
}

export async function reportReadiness(companyId: string): Promise<{ units: number; issues: ReadinessIssue[] }> {
  const csv = await generateCsvForCompany(companyId)
  const rows = csv.replace(/^﻿/, '').split('\r\n').filter(Boolean).map(splitRow)
  const data = rows.slice(1)
  const units = new Set(data.map(r => `${r[23]}|${r[30]}`)).size
  const byKey = new Map<string, ReadinessIssue>()
  for (const p of validateCsv2026(rows[0], data)) {
    const code = p.match(/\b([A-H]\d{1,2})\b/)?.[1] ?? '?'
    const unitList = p.match(/\(([^)]*)\)$/)?.[1].split(', ').filter(u => !u.startsWith('+')) ?? []
    const g = GROUPS[code[0]] ?? { what: 'Raport', where: '' }
    // D8 and D9 are one fix (the pin) — report them once.
    const field = `${p.startsWith('required field') ? 'brak' : 'zły format'}: ${FIELDS[code] ?? code}`
    const key = `${g.what}|${field}`
    const cur = byKey.get(key) ?? { what: g.what, field, where: g.where, units: [] }
    for (const u of unitList) if (!cur.units.includes(u)) cur.units.push(u)
    byKey.set(key, cur)
  }
  return { units, issues: [...byKey.values()] }
}

/** The 2026 renderer quotes only fields containing ; " CR LF — a small RFC 4180 split is enough. */
function splitRow(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let q = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (q) {
      if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++ } else q = false } else cur += ch
    } else if (ch === '"') q = true
    else if (ch === ';') { out.push(cur); cur = '' }
    else cur += ch
  }
  out.push(cur)
  return out
}
