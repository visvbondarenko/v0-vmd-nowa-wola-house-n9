import { prisma } from '@/lib/prisma'

// Exact column headers from dane.gov.pl WordPress CSVs (59 columns)
const CSV_HEADERS = [
  'Nazwa dewelopera',                                            // 1
  'Nazwa przedsięwzięcia deweloperskiego lub zadania inwestycyjnego', // 2
  'Forma prawna dewelopera',                                     // 3
  'Nr KRS',                                                      // 4
  'Nr wpisu do CEiDG',                                           // 5
  'Nr NIP',                                                      // 6
  'Nr REGON',                                                    // 7
  'Nr telefonu',                                                 // 8
  'Adres poczty elektronicznej',                                 // 9
  'Nr faxu',                                                     // 10
  'Adres strony internetowej dewelopera',                        // 11
  'Adres siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera - województwo', // 12
  'Adres siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera - powiat', // 13
  'Adres siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera - gmina', // 14
  'Adres siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera - miejscowość', // 15
  'Adres siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera - ulica', // 16
  'Adres siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera - nr nieruchomości', // 17
  'Adres siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera - nr lokalu', // 18
  'Adres siedziby/głównego miejsca wykonywania działalności gospodarczej dewelopera - kod pocztowy', // 19
  'Adres lokalu, w którym prowadzona jest sprzedaż - województwo', // 20
  'Adres lokalu, w którym prowadzona jest sprzedaż - powiat',   // 21
  'Adres lokalu, w którym prowadzona jest sprzedaż - gmina',    // 22
  'Adres lokalu, w którym prowadzona jest sprzedaż - miejscowość', // 23
  'Adres lokalu, w którym prowadzona jest sprzedaż - ulica',    // 24
  'Adres lokalu, w którym prowadzona jest sprzedaż - nr nieruchomości', // 25
  'Adres lokalu, w którym prowadzona jest sprzedaż - nr lokalu', // 26
  'Adres lokalu, w którym prowadzona jest sprzedaż - kod pocztowy', // 27
  'Dodatkowe lokalizacje, w których prowadzona jest sprzedaż',  // 28
  'Sposób kontaktu nabywcy z deweloperem',                       // 29
  'Lokalizacja przedsięwzięcia deweloperskiego lub zadania inwestycyjnego - województwo', // 30
  'Lokalizacja przedsięwzięcia deweloperskiego lub zadania inwestycyjnego - powiat', // 31
  'Lokalizacja przedsięwzięcia deweloperskiego lub zadania inwestycyjnego - gmina', // 32
  'Lokalizacja przedsięwzięcia deweloperskiego lub zadania inwestycyjnego - miejscowość', // 33
  'Lokalizacja przedsięwzięcia deweloperskiego lub zadania inwestycyjnego - ulica', // 34
  'Lokalizacja przedsięwzięcia deweloperskiego lub zadania inwestycyjnego - nr nieruchomości', // 35
  'Lokalizacja przedsięwzięcia deweloperskiego lub zadania inwestycyjnego - kod pocztowy', // 36
  'Rodzaj nieruchomości: lokal mieszkalny, dom jednorodzinny',  // 37
  'Nr lokalu lub domu jednorodzinnego nadany przez dewelopera',  // 38
  'Cena m 2 powierzchni użytkowej lokalu mieszkalnego / domu jednorodzinnego [zł]', // 39
  'Data, od której cena obowiązuje 1',                           // 40
  'Cena lokalu mieszkalnego lub domu jednorodzinnego przedmiotem umowy stanowiąca iloczym ceny m2 oraz powierzchni', // 41
  'Data, od której cena obowiązuje 2',                           // 42
  'Cena lokalu mieszkalnego lub domu jednorodzinnego uwzględniająca cenę lokalu stanowiącą iloczyn powierzchni oraz metrażu i innych składowych ceny, o których mowa w art. 19a ust. 1 pkt 1), 2) lub 3)', // 43
  'Data, od której cena obowiązuje 3',                           // 44
  'Rodzaj części nieruchomości będących przedmiotem umowy [zł]', // 45
  'Oznaczenie części nieruchomości nadany przez dewelopera',     // 46
  'Cena części nieruchomości, będących przedmiotem umowy [zł]',  // 47
  'Data, od której cena obowiązuje 4',                           // 48
  'Rodzaj pomieszczeń przynależnych, o których mowa w art. 2 ust. 4 ustawy z dnia 24 czerwca 1994 r. o własności lokali [zł]', // 49
  'Oznaczenie pomieszczeń przynależnych, o których mowa w art. 2 ust. 4 ustawy z dnia 24 czerwca 1994 r. o własności lokali [zł]', // 50
  'Wyszczególnienie cen pomieszczeń przynależnych, o których mowa w art. 2 ust. 4 ustawy z dnia 24 czerwca 1994 r. o własności lokali [zł]', // 51
  'Data, od której obowiązuje cena 5',                           // 52
  'Wyszczególnienie praw niezbędnych do korzystania z lokalu mieszkalnego lub domu jednorodzinnego', // 53
  'Wartość praw niezbędnych do korzystania z lokalu mieszkalnego lub domu jednorodzinnego [zł]', // 54
  'Data, od której obowiązuje cena 6',                           // 55
  'Wyszczególnienie rodzajów innych świadczeń pieniężnych, które nabywca zobowiązany jest spełnić na rzecz dewelopera w wykonaniu umowy przenoszącej własność', // 56
  'Wartość innych świadczeń pieniężnych, które nabywca zobowiązany jest spełnić na rzecz dewelopera w wykonaniu umowy przenoszącej własność [zł]', // 57
  'Data, od której obowiązuje cena 7',                           // 58
  'Adres strony internetowej, pod którym dostępny jest prospekt informacyjny', // 59
]

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}:${s}`
}

function formatDateShort(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function val(v: string | null | undefined): string {
  return v || 'X'
}

// Unit-level optional text fields (partsType/Label, roomsType/Label, rightsDesc,
// otherDesc): WP writes literal empty when null, not "X".
function valEmpty(v: string | null | undefined): string {
  return v || ''
}

function numVal(v: number | null | undefined): string {
  if (v === null || v === undefined) return '0'
  return v.toFixed(2)
}

// WP writes fullPrice (col 43) as an integer with no decimals.
function intVal(v: number | null | undefined): string {
  if (v === null || v === undefined) return '0'
  return String(Math.round(v))
}

// Quote only when the field contains a semicolon, quote, newline, or whitespace —
// matches the WordPress plugin's CSV output so byte-level diffs stay clean.
function csvEscape(v: string): string {
  if (v === '') return ''
  if (/[;"\r\n\s]/.test(v)) return `"${v.replace(/"/g, '""')}"`
  return v
}

export async function generateCsvForCompany(companyId: string): Promise<string> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  })

  if (!company) throw new Error(`Company not found: ${companyId}`)

  const units = await prisma.unit.findMany({
    where: {
      companyId,
      status: { not: 'sold' },
    },
    include: {
      project: true,
      priceHistory: {
        orderBy: { date: 'desc' },
        take: 1,
      },
    },
    orderBy: [{ projectId: 'asc' }, { label: 'asc' }],
  })

  const rows: string[] = []

  // BOM + header
  rows.push('\uFEFF' + CSV_HEADERS.map(h => csvEscape(h)).join(';'))

  for (const unit of units) {
    const project = unit.project
    const latestPrice = unit.priceHistory[0]
    const priceDate = latestPrice ? formatDate(latestPrice.date) : formatDate(unit.updatedAt)

    const pricePerSqm = latestPrice?.pricePerSqm
      ?? (unit.area && unit.area > 0 && unit.price ? unit.price / unit.area : null)
    const totalPrice = unit.price
    // fullPrice per regulator = totalPrice + art. 19a components (parking/storage/rights/other).
    // Always compute from components — the stored unit.fullPrice column can go stale if
    // parts are edited without resaving price (and the admin UI already shows it as a
    // derived read-only field).
    const fullPrice = totalPrice != null
      ? totalPrice
        + (unit.parkingPrice ?? 0)
        + (unit.storagePrice ?? 0)
        + (unit.rightsPrice ?? 0)
        + (unit.otherPrice ?? 0)
      : null
    // Side date columns use priceDate only when the unit has at least one main price;
    // otherwise WP emits X for those dates even when the type/desc field is set.
    const effectiveDate = (pricePerSqm || totalPrice || fullPrice) ? priceDate : 'X'

    const fields: string[] = [
      val(company.name),                      // 1  Nazwa dewelopera
      val(project.name),                      // 2  Nazwa przedsięwzięcia
      val(company.legalForm),                 // 3  Forma prawna
      val(company.krs),                       // 4  Nr KRS
      val(company.ceidg),                     // 5  Nr CEiDG
      val(company.nip),                       // 6  Nr NIP
      val(company.regon),                     // 7  Nr REGON
      val(company.contactPhone),              // 8  Nr telefonu
      val(company.contactEmail),              // 9  Adres email
      val(company.contactFax),                // 10 Nr faxu
      val(company.websiteUrl),                // 11 Strona www
      val(company.addrVoivodeship),           // 12 Siedziba - woj
      val(company.addrCounty),                // 13 Siedziba - powiat
      val(company.addrMunicipality),          // 14 Siedziba - gmina
      val(company.addrCity),                  // 15 Siedziba - miejscowość
      val(company.addrStreet),                // 16 Siedziba - ulica
      val(company.addrBuildingNr),            // 17 Siedziba - nr nieruchomości
      val(company.addrUnitNr),                // 18 Siedziba - nr lokalu
      val(company.addrPostalCode),            // 19 Siedziba - kod pocztowy
      val(company.salesVoivodeship),          // 20 Sprzedaż - woj
      val(company.salesCounty),               // 21 Sprzedaż - powiat
      val(company.salesMunicipality),         // 22 Sprzedaż - gmina
      val(company.salesCity),                 // 23 Sprzedaż - miejscowość
      val(company.salesStreet),               // 24 Sprzedaż - ulica
      val(company.salesBuildingNr),           // 25 Sprzedaż - nr nieruchomości
      val(company.salesUnitNr),               // 26 Sprzedaż - nr lokalu
      val(company.salesPostalCode),           // 27 Sprzedaż - kod pocztowy
      val(company.salesAdditional),           // 28 Dodatkowe lokalizacje
      val(company.salesContact),              // 29 Sposób kontaktu
      val(project.investVoivodeship),         // 30 Inwestycja - woj
      val(project.investCounty),              // 31 Inwestycja - powiat
      val(project.investMunicipality),        // 32 Inwestycja - gmina
      val(project.investCity),                // 33 Inwestycja - miejscowość
      val(project.investStreet),              // 34 Inwestycja - ulica
      val(project.investBuildingNr),          // 35 Inwestycja - nr nieruchomości
      val(project.investPostalCode),          // 36 Inwestycja - kod pocztowy
      val(project.propertyType),              // 37 Rodzaj nieruchomości
      val(unit.label),                        // 38 Nr lokalu
      pricePerSqm ? numVal(pricePerSqm) : 'X', // 39 Cena m2
      pricePerSqm ? priceDate : 'X',           // 40 Data ceny 1
      totalPrice ? numVal(totalPrice) : 'X',   // 41 Cena lokalu (iloczyn m2 × pow)
      totalPrice ? priceDate : 'X',            // 42 Data ceny 2
      fullPrice ? intVal(fullPrice) : 'X',     // 43 Cena pełna (art. 19a) — int in WP
      fullPrice ? priceDate : 'X',             // 44 Data ceny 3
      valEmpty(unit.partsType),                // 45 Części - rodzaj
      valEmpty(unit.partsLabel),               // 46 Części - oznaczenie
      // WP convention: all art. 19a add-ons (parking, komórka, ogródek, inne)
      // are summed into col 47 "Cena części nieruchomości", and cols 51/54/57
      // always emit 0. The breakdown lives only in the DB / admin / public UI.
      ((unit.parkingPrice ?? 0) + (unit.storagePrice ?? 0) + (unit.rightsPrice ?? 0) + (unit.otherPrice ?? 0)) > 0
        ? numVal((unit.parkingPrice ?? 0) + (unit.storagePrice ?? 0) + (unit.rightsPrice ?? 0) + (unit.otherPrice ?? 0))
        : '0',                                 // 47 Części - cena (parking + komórka + ogródek + inne)
      ((unit.parkingPrice ?? 0) + (unit.storagePrice ?? 0) + (unit.rightsPrice ?? 0) + (unit.otherPrice ?? 0)) > 0 || unit.partsType
        ? effectiveDate : 'X',                 // 48 Części - data ceny 4
      valEmpty(unit.roomsType),                // 49 Pomieszczenia - rodzaj
      valEmpty(unit.roomsLabel),               // 50 Pomieszczenia - oznaczenie
      '0',                                     // 51 Pomieszczenia - cena (WP convention: always 0; komórka folded into col 47)
      unit.roomsType ? effectiveDate : 'X',    // 52 Pomieszczenia - data ceny 5
      valEmpty(unit.rightsDesc),               // 53 Prawa - wyszczególnienie
      '0',                                     // 54 Prawa - wartość (WP convention: always 0)
      unit.rightsDesc ? effectiveDate : 'X',   // 55 Prawa - data ceny 6
      valEmpty(unit.otherDesc),                // 56 Inne świadczenia - wyszczególnienie
      '0',                                     // 57 Inne świadczenia - wartość (WP convention: always 0; inne folded into col 47)
      unit.otherDesc ? effectiveDate : 'X',    // 58 Inne świadczenia - data ceny 7
      val(project.prospektUrl),                // 59 Prospekt URL
    ]

    rows.push(fields.map(f => csvEscape(f)).join(';'))
  }

  return rows.join('\r\n')
}

export function getCsvFileName(companySlug: string, date: Date): string {
  return `mieszkania-${companySlug}-${formatDateShort(date)}.csv`
}
