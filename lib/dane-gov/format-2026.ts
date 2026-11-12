// dane.gov.pl price data — structure in force from 2026-11-11.
//
// Legal basis: Rozporządzenie Ministra Cyfryzacji z dnia 10 listopada 2026 r. w sprawie struktury danych
// zawartych w informacjach dotyczących sprzedaży lokali mieszkalnych i domów jednorodzinnych
// (Dz.U. 2026 poz. 1489), issued under art. 19b ust. 2a of the developer act (Dz.U. 2026 poz. 880, 1077).
// Layout: the ministry's model CSV published on dane.gov.pl on 2026-11-10 ("Wzorcowe dokumenty elektroniczne
// służące do realizacji obowiązków deweloperów mieszkaniowych – 11.11.2026",
// https://cms.dane.gov.pl/documents/289/ceny-ofertowe-mieszkan-dewelopera-nazwafirmy-YYYY-MM-DD.csv.csv).
//
// Rules taken from the regulation + model file:
//   - 48 fields in groups A–H, headers verbatim from the model CSV; UTF-8 with BOM, ';' separator, CRLF.
//   - Amounts: 2 decimals, decimal comma, no thousands separator, no currency (e.g. 655000,00).
//   - Coordinates (D8 longitude, D9 latitude): WGS-84, 6 decimals, decimal comma.
//   - Dates: RRRR-MM-DD GG:MM:SS (Polish civil time).
//   - Empty / not applicable fields: "X".
//   - E1 is exactly "lokal mieszkalny" or "dom jednorodzinny".
//   - F (pomieszczenia przynależne), G (prawa niezbędne), H (inne świadczenia) are filled ONLY for items whose
//     price is NOT included in E5. Each item gets its own row; the unit's A–E data is repeated on every row,
//     and the unit identifier (E2) is repeated in F5/G4/H4. Row i of a unit carries the i-th item of each group.
//
// This file is pure (no DB, no imports) and is kept identical in JPW, Nowa Wola House and Dewelo.

export const CSV_HEADERS_2026 = [
  // A. Dane identyfikacyjne podmiotu obowiązanego
  'Firma', // A1
  'Numer identyfikacji podatkowej (NIP)', // A2
  // B. Adres siedziby albo głównego miejsca wykonywania działalności gospodarczej
  'Województwo adresu siedziby albo głównego miejsca wykonywania działalności gospodarczej', // B1
  'Powiat adresu siedziby albo głównego miejsca wykonywania działalności gospodarczej', // B2
  'Gmina adresu siedziby albo głównego miejsca wykonywania działalności gospodarczej', // B3
  'Miejscowość adresu siedziby albo głównego miejsca wykonywania działalności gospodarczej', // B4
  'Ulica adresu siedziby albo głównego miejsca wykonywania działalności gospodarczej', // B5
  'Numer nieruchomości adresu siedziby albo głównego miejsca wykonywania działalności gospodarczej', // B6
  'Numer lokalu adresu siedziby albo głównego miejsca wykonywania działalności gospodarczej', // B7
  'Kod pocztowy adresu siedziby albo głównego miejsca wykonywania działalności gospodarczej', // B8
  // C. Adres lokalu, w którym jest prowadzona sprzedaż
  'Województwo adresu lokalu, w którym jest prowadzona sprzedaż', // C1
  'Powiat adresu lokalu, w którym jest prowadzona sprzedaż', // C2
  'Gmina adresu lokalu, w którym jest prowadzona sprzedaż', // C3
  'Miejscowość adresu lokalu, w którym jest prowadzona sprzedaż', // C4
  'Ulica adresu lokalu, w którym jest prowadzona sprzedaż', // C5
  'Numer nieruchomości adresu lokalu, w którym jest prowadzona sprzedaż', // C6
  'Numer lokalu adresu lokalu, w którym jest prowadzona sprzedaż', // C7
  'Kod pocztowy adresu lokalu, w którym jest prowadzona sprzedaż', // C8
  'Dodatkowe lokalizacje, w których jest prowadzona sprzedaż', // C9
  'Sposób kontaktu nabywcy z podmiotem obowiązanym', // C10
  // D. Lokalizacja przedsięwzięcia deweloperskiego lub zadania inwestycyjnego
  'Województwo lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego', // D1
  'Powiat lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego', // D2
  'Gmina lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego', // D3
  'Miejscowość lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego', // D4
  'Ulica lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego', // D5
  'Numer nieruchomości lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego', // D6
  'Kod pocztowy lokalizacji przedsięwzięcia deweloperskiego lub zadania inwestycyjnego', // D7
  'Długość geograficzna punktu określającego lokalizację przestrzenną przedsięwzięcia deweloperskiego lub zadania inwestycyjnego', // D8
  'Szerokość geograficzna punktu określającego lokalizację przestrzenną przedsięwzięcia deweloperskiego lub zadania inwestycyjnego', // D9
  // E. Dane dotyczące lokalu mieszkalnego albo domu jednorodzinnego lub ich części
  'Rodzaj nieruchomości', // E1
  'Identyfikator lokalu mieszkalnego albo domu jednorodzinnego', // E2
  'Cena 1 m2 powierzchni użytkowej lokalu mieszkalnego albo domu jednorodzinnego', // E3
  'Data i czas, od których obowiązuje cena 1 m2 powierzchni użytkowej lokalu mieszkalnego albo domu jednorodzinnego', // E4
  'Cena lokalu mieszkalnego albo domu jednorodzinnego lub ich części będących przedmiotem umowy', // E5
  'Data i czas, od których obowiązuje cena lokalu mieszkalnego albo domu jednorodzinnego lub ich części', // E6
  // F. Pomieszczenia przynależne
  'Rodzaj pomieszczenia przynależnego, o którym mowa w art. 2 ust. 4 ustawy z dnia 24 czerwca 1994 r. o własności lokali', // F1
  'Identyfikator pomieszczenia przynależnego, o którym mowa w art. 2 ust. 4 ustawy z dnia 24 czerwca 1994 r. o własności lokali', // F2
  'Cena pomieszczenia przynależnego, o którym mowa w art. 2 ust. 4 ustawy z dnia 24 czerwca 1994 r. o własności lokali', // F3
  'Data i czas, od których obowiązuje cena pomieszczenia przynależnego, o którym mowa w art. 2 ust. 4 ustawy z dnia 24 czerwca 1994 r. o własności lokali', // F4
  'Identyfikator lokalu mieszkalnego albo domu jednorodzinnego dla pomieszczenia przynależnego', // F5
  // G. Prawa niezbędne do korzystania z lokalu mieszkalnego albo domu jednorodzinnego
  'Wyszczególnienie praw niezbędnych do korzystania z lokalu mieszkalnego albo domu jednorodzinnego', // G1
  'Wartość praw niezbędnych do korzystania z lokalu mieszkalnego albo domu jednorodzinnego', // G2
  'Data i czas, od których obowiązuje wartość praw niezbędnych do korzystania z lokalu mieszkalnego albo domu jednorodzinnego', // G3
  'Identyfikator lokalu mieszkalnego albo domu jednorodzinnego dla prawa niezbędnego', // G4
  // H. Inne świadczenia pieniężne
  'Wyszczególnienie rodzaju innego świadczenia pieniężnego, które nabywca jest zobowiązany spełnić na rzecz podmiotu obowiązanego w wykonaniu umowy przenoszącej własność', // H1
  'Wartość innego świadczenia pieniężnego, które nabywca jest zobowiązany spełnić na rzecz podmiotu obowiązanego w wykonaniu umowy przenoszącej własność', // H2
  'Data i czas, od których obowiązuje wartość innego świadczenia pieniężnego, które nabywca jest zobowiązany spełnić na rzecz podmiotu obowiązanego w wykonaniu umowy przenoszącej własność', // H3
  'Identyfikator lokalu mieszkalnego albo domu jednorodzinnego dla innego świadczenia', // H4
] as const

export const COLUMN_COUNT_2026 = CSV_HEADERS_2026.length // 48

// 0-based column indexes used by the monitor and tests.
export const COL_2026 = {
  firma: 0,
  nip: 1,
  investCity: 23,
  investStreet: 24,
  lng: 27,
  lat: 28,
  type: 29,
  unitId: 30,
  pps: 31,
  ppsDate: 32,
  price: 33,
  priceDate: 34,
  roomType: 35,
  roomPrice: 37,
  rightDesc: 40,
  rightValue: 41,
  otherDesc: 44,
  otherValue: 45,
} as const

// Required fields (0-based) — "wymagane" in the regulation. Conditional fields may be "X".
export const REQUIRED_COLUMNS_2026 = [
  0, 1, // A1-A2
  2, 3, 4, 5, 7, 9, // B1-B4, B6, B8
  10, 11, 12, 13, 15, 17, 19, // C1-C4, C6, C8, C10
  20, 21, 22, 23, 26, 27, 28, // D1-D4, D7, D8, D9
  29, 30, 31, 32, 33, 34, // E1-E6
]

export const PROPERTY_TYPES_2026 = ['lokal mieszkalny', 'dom jednorodzinny'] as const

type Num = number | null | undefined
type Str = string | null | undefined

export type Company2026 = {
  name: string
  nip: string
  addrVoivodeship: Str; addrCounty: Str; addrMunicipality: Str; addrCity: Str
  addrStreet: Str; addrBuildingNr: Str; addrUnitNr: Str; addrPostalCode: Str
  salesVoivodeship: Str; salesCounty: Str; salesMunicipality: Str; salesCity: Str
  salesStreet: Str; salesBuildingNr: Str; salesUnitNr: Str; salesPostalCode: Str
  salesAdditional: Str
  salesContact: Str
  contactPhone: Str
  contactEmail: Str
  websiteUrl: Str
}

export type Project2026 = {
  investVoivodeship: Str; investCounty: Str; investMunicipality: Str; investCity: Str
  investStreet: Str; investBuildingNr: Str; investPostalCode: Str
  latitude: Num
  longitude: Num
  propertyType: Str
}

export type PriceSnapshot2026 = {
  date: Date
  totalPrice: Num
  parkingPrice: Num
  storagePrice: Num
  rightsPrice: Num
  otherPrice: Num
}

export type Unit2026 = {
  label: string
  /** Usable floor area in m² (already resolved by the caller: room sum / effective area). */
  area: Num
  price: Num
  parkingPrice: Num
  storagePrice: Num
  rightsPrice: Num
  otherPrice: Num
  roomsType: Str
  roomsLabel: Str
  rightsDesc: Str
  updatedAt: Date
  project: Project2026
  /** Price history, newest first. Used to find since when each component has had its current value. */
  history: PriceSnapshot2026[]
}

type PriceKey = 'totalPrice' | 'parkingPrice' | 'storagePrice' | 'rightsPrice' | 'otherPrice'

/** One art. 19a add-on that is NOT included in E5 and therefore gets its own F/G/H entry. */
type Item = { desc: string; id?: string; amount: number; date: Date }

// --- formatting ---------------------------------------------------------------------------------

const warsaw = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Warsaw',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  hour12: false,
})

/** "2026-11-12 08:05:09" in Polish civil time, whatever the server timezone. */
export function formatDateTime2026(d: Date): string {
  return warsaw.format(d)
}

/** 655000 → "655000,00" (2 decimals, decimal comma, no grouping). */
export function formatAmount2026(n: number): string {
  return n.toFixed(2).replace('.', ',')
}

/** 21.0123456 → "21,012346" (WGS-84, 6 decimals, decimal comma). */
export function formatCoord2026(n: number): string {
  return n.toFixed(6).replace('.', ',')
}

/** RFC 4180 quoting, only where needed (the model file leaves spaces and commas unquoted). */
function csvEscape(v: string): string {
  if (/[;"\r\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`
  return v
}

/** Maps legacy values ("Mieszkanie", "Dom jednorodzinny", "dom") onto the two allowed E1 values. */
export function propertyType2026(v: Str): (typeof PROPERTY_TYPES_2026)[number] {
  const s = (v ?? '').trim().toLowerCase()
  if (s.startsWith('dom')) return 'dom jednorodzinny'
  return 'lokal mieszkalny'
}

function nipDigits(v: string): string {
  return v.replace(/\D/g, '')
}

// --- dates --------------------------------------------------------------------------------------

/**
 * Since when the component has had its current value: walk the history (newest first) while the
 * stored value equals the current one; the oldest snapshot in that run is the effective date.
 * Falls back to the newest snapshot, then to unit.updatedAt.
 */
function since(unit: Unit2026, key: PriceKey, current: Num): Date {
  const cur = current ?? 0
  let date: Date | null = null
  for (const h of unit.history) {
    if ((h[key] ?? 0) !== cur) break
    date = h.date
  }
  return date ?? unit.history[0]?.date ?? unit.updatedAt
}

// --- add-ons → groups F / G / H -----------------------------------------------------------------

/**
 * Mapping of the four add-on price fields onto the regulation's groups. An add-on with a price of 0 / null is
 * treated as included in E5 (or not offered) and is not reported — per the regulation F/G/H are filled only
 * when the price was NOT included in E5.
 *
 *   storagePrice (komórka lokatorska)           → F  pomieszczenie przynależne
 *   parkingPrice (miejsce postojowe)            → G  prawo do wyłącznego korzystania z miejsca postojowego
 *   otherPrice   (ogródek — public label)       → G  prawo do wyłącznego korzystania z ogródka
 *   rightsPrice  (prawa)                        → G  rightsDesc or a generic description
 *
 * Group H (inne świadczenia pieniężne) has no source field yet and stays "X".
 */
function itemsOf(unit: Unit2026, text: (s: string) => string): { F: Item[]; G: Item[]; H: Item[] } {
  const F: Item[] = []
  const G: Item[] = []
  const H: Item[] = []
  if (unit.storagePrice && unit.storagePrice > 0) {
    F.push({
      desc: text(unit.roomsType || 'komórka lokatorska'),
      id: text(unit.roomsLabel || `${unit.label}-KL`),
      amount: unit.storagePrice,
      date: since(unit, 'storagePrice', unit.storagePrice),
    })
  }
  if (unit.parkingPrice && unit.parkingPrice > 0) {
    G.push({
      desc: 'prawo do wyłącznego korzystania z miejsca postojowego',
      amount: unit.parkingPrice,
      date: since(unit, 'parkingPrice', unit.parkingPrice),
    })
  }
  if (unit.otherPrice && unit.otherPrice > 0) {
    G.push({
      desc: 'prawo do wyłącznego korzystania z ogródka',
      amount: unit.otherPrice,
      date: since(unit, 'otherPrice', unit.otherPrice),
    })
  }
  if (unit.rightsPrice && unit.rightsPrice > 0) {
    G.push({
      desc: text(unit.rightsDesc || 'prawa niezbędne do korzystania z lokalu mieszkalnego albo domu jednorodzinnego'),
      amount: unit.rightsPrice,
      date: since(unit, 'rightsPrice', unit.rightsPrice),
    })
  }
  return { F, G, H }
}

// --- render -------------------------------------------------------------------------------------

export type Render2026Options = {
  /** Text normaliser applied to every free-text field (e.g. look-alike character folding). */
  text?: (s: string) => string
}

/**
 * Renders the CSV. `units` must already be the on-sale set, in the desired order.
 * Returns BOM + header + rows, CRLF line endings, trailing CRLF (as in the model file).
 */
export function renderCsv2026(company: Company2026, units: Unit2026[], opts: Render2026Options = {}): string {
  const text = opts.text ?? ((s: string) => s)
  const X = 'X'
  const t = (v: Str): string => {
    const s = v == null ? '' : text(String(v)).trim()
    return s || X
  }

  // C10: explicit override, else the channels a buyer can actually use.
  const contact = company.salesContact
    || [company.contactPhone, company.contactEmail, company.websiteUrl].filter(Boolean).join(', ')

  const companyFields = [
    t(company.name), // A1
    company.nip ? nipDigits(company.nip) : X, // A2
    t(company.addrVoivodeship), t(company.addrCounty), t(company.addrMunicipality), t(company.addrCity), // B1-B4
    t(company.addrStreet), t(company.addrBuildingNr), t(company.addrUnitNr), t(company.addrPostalCode), // B5-B8
    t(company.salesVoivodeship), t(company.salesCounty), t(company.salesMunicipality), t(company.salesCity), // C1-C4
    t(company.salesStreet), t(company.salesBuildingNr), t(company.salesUnitNr), t(company.salesPostalCode), // C5-C8
    t(company.salesAdditional), // C9
    t(contact), // C10
  ]

  const lines: string[] = [CSV_HEADERS_2026.map(csvEscape).join(';')]

  for (const unit of units) {
    const p = unit.project
    const area = unit.area && unit.area > 0 ? unit.area : null
    const price = unit.price && unit.price > 0 ? unit.price : null
    const priceDate = price ? formatDateTime2026(since(unit, 'totalPrice', unit.price)) : X

    const unitFields = [
      ...companyFields,
      t(p.investVoivodeship), t(p.investCounty), t(p.investMunicipality), t(p.investCity), // D1-D4
      t(p.investStreet), t(p.investBuildingNr), t(p.investPostalCode), // D5-D7
      p.longitude != null ? formatCoord2026(p.longitude) : X, // D8
      p.latitude != null ? formatCoord2026(p.latitude) : X, // D9
      propertyType2026(p.propertyType), // E1
      t(unit.label), // E2
      price && area ? formatAmount2026(price / area) : X, // E3 (E5 = area × E3)
      price && area ? priceDate : X, // E4
      price ? formatAmount2026(price) : X, // E5
      priceDate, // E6
    ]

    const { F, G, H } = itemsOf(unit, text)
    const rowCount = Math.max(1, F.length, G.length, H.length)
    const unitId = t(unit.label)
    for (let i = 0; i < rowCount; i++) {
      const f = F[i]
      const g = G[i]
      const h = H[i]
      const row = [
        ...unitFields,
        f ? f.desc : X, f?.id ?? X, f ? formatAmount2026(f.amount) : X, f ? formatDateTime2026(f.date) : X, f ? unitId : X, // F1-F5
        g ? g.desc : X, g ? formatAmount2026(g.amount) : X, g ? formatDateTime2026(g.date) : X, g ? unitId : X, // G1-G4
        h ? h.desc : X, h ? formatAmount2026(h.amount) : X, h ? formatDateTime2026(h.date) : X, h ? unitId : X, // H1-H4
      ]
      lines.push(row.map(csvEscape).join(';'))
    }
  }

  return '﻿' + lines.join('\r\n') + '\r\n'
}

// --- validation (used by the daily monitor) -----------------------------------------------------

const AMOUNT = /^\d+,\d{2}$/
const COORD = /^-?\d{1,3},\d{6}$/
const DATETIME = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/
const POSTAL = /^\d{2}-\d{3}$/

/**
 * Checks a parsed CSV (header + data rows) against the 2026 structure. Returns human-readable problems,
 * each with the affected unit identifiers (deduplicated), empty when the file is compliant.
 */
export function validateCsv2026(header: string[], rows: string[][]): string[] {
  const problems = new Map<string, Set<string>>()
  const add = (msg: string, unit: string) => {
    if (!problems.has(msg)) problems.set(msg, new Set())
    problems.get(msg)!.add(unit)
  }
  if (header.length !== COLUMN_COUNT_2026) return [`header has ${header.length} columns, expected ${COLUMN_COUNT_2026}`]
  header.forEach((h, i) => {
    if (h !== CSV_HEADERS_2026[i]) add(`header ${i + 1} differs from the model file`, h.slice(0, 40))
  })
  for (const r of rows) {
    const unit = r[COL_2026.unitId] || '?'
    if (r.length !== COLUMN_COUNT_2026) { add(`row has ${r.length} columns`, unit); continue }
    for (const c of REQUIRED_COLUMNS_2026) {
      if (!r[c] || r[c] === 'X') add(`required field ${fieldCode(c)} is empty`, unit)
    }
    if (r[1] !== 'X' && !/^\d{10}$/.test(r[1])) add('A2 NIP is not 10 digits', unit)
    for (const c of [9, 17, 26]) if (r[c] !== 'X' && !POSTAL.test(r[c])) add(`${fieldCode(c)} postal code is not NN-NNN`, unit)
    for (const c of [27, 28]) if (r[c] !== 'X' && !COORD.test(r[c])) add(`${fieldCode(c)} is not a coordinate with 6 decimals`, unit)
    if (!PROPERTY_TYPES_2026.includes(r[29] as (typeof PROPERTY_TYPES_2026)[number])) add('E1 is not "lokal mieszkalny" / "dom jednorodzinny"', unit)
    for (const c of [31, 33, 37, 41, 45]) if (r[c] !== 'X' && !AMOUNT.test(r[c])) add(`${fieldCode(c)} amount format`, unit)
    for (const c of [32, 34, 38, 42, 46]) if (r[c] !== 'X' && !DATETIME.test(r[c])) add(`${fieldCode(c)} date format`, unit)
  }
  return [...problems].map(([msg, units]) => {
    const list = [...units]
    return `${msg} (${list.slice(0, 5).join(', ')}${list.length > 5 ? `, +${list.length - 5}` : ''})`
  })
}

const GROUPS: [string, number][] = [['A', 2], ['B', 8], ['C', 10], ['D', 9], ['E', 6], ['F', 5], ['G', 4], ['H', 4]]

/** 0-based column → "D8". */
export function fieldCode(col: number): string {
  let i = col
  for (const [g, n] of GROUPS) {
    if (i < n) return `${g}${i + 1}`
    i -= n
  }
  return `#${col + 1}`
}

/** Parses the amount format back to a number ("X" → 0). */
export function parseAmount2026(s: string | undefined): number {
  if (!s || s === 'X') return 0
  return parseFloat(s.replace(',', '.')) || 0
}
