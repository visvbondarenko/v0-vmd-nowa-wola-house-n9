import { prisma } from '@/lib/prisma'
import { createHash } from 'crypto'

/**
 * Generate a deterministic extIdent for a new resource.
 * Uses HMAC-like derivation: "DEWA" + MD5(companyExtIdent + "|" + date)[0:32] uppercased.
 * This ensures stability across regenerations while being unique per company+date.
 */
function deriveResourceExtIdent(companyExtIdent: string, date: string): string {
  const hash = createHash('md5')
    .update(`${companyExtIdent}|${date}`)
    .digest('hex')
    .toUpperCase()
  return 'DEWA' + hash
}

/**
 * Derive a stable dataset extIdent per year.
 * - For the original year (where company.extIdent was first created): use company.extIdent as-is
 * - For subsequent years: take first 32 chars of company.extIdent + year string
 *
 * This matches the WordPress plugin behavior observed in reference XMLs.
 */
function deriveDatasetExtIdent(companyExtIdent: string, year: number): string {
  const yearStr = String(year)
  const derived = companyExtIdent.substring(0, 36 - yearStr.length) + yearStr
  // If the derived form equals the original, or the original doesn't end with a year,
  // we need to check: the original extIdent is used for the earliest year in the data.
  // We return the derived form for all years — for the original year (2025),
  // the company.extIdent itself is the correct value and should be used directly.
  return derived
}

function escapeXml(str: string): string {
  // Only escape the characters that are strictly required in text content.
  // Apostrophes and double-quotes do not need escaping in text (only in
  // attribute values quoted with the same character). WP's XML leaves them
  // raw, and we match that exactly.
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export type ResourceEntry = {
  extIdent: string
  url: string
  titlePl: string
  titleEn: string
  descriptionPl: string
  descriptionEn: string
  dataDate: string
}

const LEGAL_REF = 'zgodnie z art. 19b. ust. 1 Ustawy z dnia 20 maja 2021 r. o ochronie praw nabywcy lokalu mieszkalnego lub domu jednorodzinnego oraz Deweloperskim Funduszu Gwarancyjnym (Dz. U. z 2024 r. poz. 695)'

export function buildResourceEntries(
  companyName: string,
  companySlug: string,
  companyExtIdent: string,
  baseUrl: string,
  csvBasePath: string | null,
  fileExtIdents: Map<string, string>
): ResourceEntry[] {
  const csvBase = csvBasePath
    ? `${baseUrl}${csvBasePath}`
    : `${baseUrl}/wp-content/uploads/raporty/mieszkania-${companySlug}`

  const dates = [...fileExtIdents.keys()].sort()

  return dates.map((dateStr) => {
    // Use stored extIdent if available (imported from WordPress), otherwise derive deterministically
    const extIdent = fileExtIdents.get(dateStr) || deriveResourceExtIdent(companyExtIdent, dateStr)
    return {
      extIdent,
      url: `${csvBase}-${dateStr}.csv`,
      titlePl: `Ceny ofertowe mieszkań dewelopera ${companyName} ${dateStr}`,
      titleEn: `Offer prices for developer's apartments ${companyName} ${dateStr}`,
      descriptionPl: `Dane dotyczące cen ofertowych mieszkań dewelopera ${companyName} udostępnione ${dateStr} ${LEGAL_REF}.`,
      descriptionEn: `Data on offer prices of apartments of the developer ${companyName} made available ${dateStr} in accordance with art. 19b. ust. 1 Ustawy z dnia 20 maja 2021 r. o ochronie praw nabywcy lokalu mieszkalnego lub domu jednorodzinnego oraz Deweloperskim Funduszu Gwarancyjnym (Dz. U. z 2024 r. poz. 695).`,
      dataDate: dateStr,
    }
  })
}

function buildResourceXml(r: ResourceEntry): string {
  return `<resource status="published">` +
    `<extIdent>${escapeXml(r.extIdent)}</extIdent>` +
    `<url>${escapeXml(r.url)}</url>` +
    `<title><polish>${escapeXml(r.titlePl)}</polish><english>${escapeXml(r.titleEn)}</english></title>` +
    `<description><polish>${escapeXml(r.descriptionPl)}</polish><english>${escapeXml(r.descriptionEn)}</english></description>` +
    `<availability>remote</availability>` +
    `<dataDate>${r.dataDate}</dataDate>` +
    `<specialSigns><specialSign>X</specialSign></specialSigns>` +
    `<hasDynamicData>false</hasDynamicData>` +
    `<hasHighValueData>true</hasHighValueData>` +
    `<hasHighValueDataFromEuropeanCommissionList>false</hasHighValueDataFromEuropeanCommissionList>` +
    `<hasResearchData>false</hasResearchData>` +
    `<containsProtectedData>false</containsProtectedData>` +
    `</resource>`
}

function buildDatasetXml(companyName: string, extIdent: string, year: number, resources: ResourceEntry[]): string {
  const titlePl = `Ceny ofertowe mieszkań dewelopera ${companyName} w ${year} r.`
  const titleEn = `Offer prices of apartments of developer ${companyName} in ${year}.`
  // WP truncates this at "20 maja 2021 r." — we match that exactly so the
  // generated XML is byte-identical to the WordPress output.
  const descPl = `Zbiór danych zawiera informacje o cenach ofertowych mieszkań dewelopera ${companyName} w ${year} r., udostępniane zgodnie z art. 19b. ust. 1 Ustawy z dnia 20 maja 2021 r.`
  const descEn = `The dataset contains offer price information for apartments of developer ${companyName} in ${year}.`

  const resourcesXml = resources.map(buildResourceXml).join('')

  return `<dataset status="published">` +
    `<extIdent>${escapeXml(extIdent)}</extIdent>` +
    `<title><polish>${escapeXml(titlePl)}</polish><english>${escapeXml(titleEn)}</english></title>` +
    `<description><polish>${escapeXml(descPl)}</polish><english>${escapeXml(descEn)}</english></description>` +
    `<updateFrequency>daily</updateFrequency>` +
    `<hasDynamicData>false</hasDynamicData>` +
    `<hasHighValueData>true</hasHighValueData>` +
    `<hasHighValueDataFromEuropeanCommissionList>false</hasHighValueDataFromEuropeanCommissionList>` +
    `<hasResearchData>false</hasResearchData>` +
    `<categories><category>ECON</category></categories>` +
    `<tags><tag lang="pl">Deweloper</tag></tags>` +
    `<resources>${resourcesXml}</resources>` +
    `</dataset>`
}

export async function generateXmlForCompany(
  companyId: string,
  baseUrl: string,
  resources: ResourceEntry[]
): Promise<string> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  })

  if (!company) throw new Error(`Company not found: ${companyId}`)
  if (!company.extIdent) throw new Error(`Company ${company.name} has no extIdent configured`)

  // Group resources by year — one <dataset> per year
  const byYear = new Map<number, ResourceEntry[]>()
  for (const r of resources) {
    const year = parseInt(r.dataDate.substring(0, 4), 10)
    if (!byYear.has(year)) byYear.set(year, [])
    byYear.get(year)!.push(r)
  }

  // Sort years ascending
  const years = [...byYear.keys()].sort((a, b) => a - b)

  // First year uses company.extIdent as-is, subsequent years derive from it
  const firstYear = years[0]
  const datasetsXml = years.map(year => {
    const datasetExtIdent = year === firstYear
      ? company.extIdent!
      : deriveDatasetExtIdent(company.extIdent!, year)
    return buildDatasetXml(company.name, datasetExtIdent, year, byYear.get(year)!)
  }).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ns2:datasets xmlns:ns2="urn:otwarte-dane:harvester:1.13" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">` +
    datasetsXml +
    `</ns2:datasets>`

  return xml
}

export function generateMd5(content: string): string {
  return createHash('md5').update(content, 'utf8').digest('hex')
}

export function getXmlFileName(companySlug: string): string {
  return `${companySlug}-dataset.xml`
}

export function getMd5FileName(companySlug: string): string {
  return `${companySlug}-dataset.md5`
}
