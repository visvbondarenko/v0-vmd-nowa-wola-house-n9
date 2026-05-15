import { put } from '@vercel/blob'
import { prisma, withDbRetry } from '@/lib/prisma'
import { generateCsvForCompany, getCsvFileName } from './csv-generator'
import { generateXmlForCompany, generateMd5, getXmlFileName, getMd5FileName, buildResourceEntries } from './xml-generator'

const BLOB_PREFIX = 'dane-gov'

function formatDateShort(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

async function saveBlobUrl(companyId: string, path: string, blobUrl: string) {
  await prisma.generatedFile.upsert({
    where: { path },
    create: { companyId, path, blobUrl },
    update: { blobUrl },
  })
}

export async function generateReportsForCompany(companyId: string, baseUrl: string): Promise<{
  csvUrl: string
  xmlUrl: string
  md5Url: string
}> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  })

  if (!company) throw new Error(`Company not found: ${companyId}`)
  if (!company.extIdent) throw new Error(`Company ${company.name} has no extIdent configured`)

  const today = new Date()
  const dateStr = formatDateShort(today)

  // 1. Generate and upload CSV
  const csvContent = await generateCsvForCompany(companyId)
  const csvFileName = getCsvFileName(company.slug, today)
  const csvPath = `${BLOB_PREFIX}/${company.slug}/${csvFileName}`

  const csvBlob = await put(csvPath, csvContent, {
    access: 'public',
    contentType: 'text/csv; charset=utf-8',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 3600,
  })

  // Save public blob URL to DB
  const csvServingPath = `mieszkania-${company.slug}-${dateStr}.csv`
  await saveBlobUrl(companyId, csvServingPath, csvBlob.url)

  // 2. Build resource list from all stored CSV files for this company,
  //    including their stable extIdent values
  const csvFiles = await prisma.generatedFile.findMany({
    where: {
      companyId,
      path: { startsWith: `mieszkania-${company.slug}-` },
    },
    orderBy: { path: 'asc' },
  })

  // Build date → extIdent map from stored values
  const fileExtIdents = new Map<string, string>()
  for (const f of csvFiles) {
    const match = f.path.match(/(\d{4}-\d{2}-\d{2})\.csv$/)
    if (!match) continue
    const date = match[1]
    // Use stored extIdent if available, otherwise leave empty (will be derived)
    if (f.extIdent) {
      fileExtIdents.set(date, f.extIdent)
    } else {
      fileExtIdents.set(date, '')
    }
  }

  const resources = buildResourceEntries(
    company.name,
    company.slug,
    company.extIdent,
    baseUrl,
    company.csvBasePath,
    fileExtIdents
  )

  // Persist newly derived extIdent values back to DB for stability
  for (const r of resources) {
    const csvFile = csvFiles.find(f => f.path.match(new RegExp(`${r.dataDate}\\.csv$`)))
    if (csvFile && !csvFile.extIdent) {
      await prisma.generatedFile.update({
        where: { id: csvFile.id },
        data: { extIdent: r.extIdent },
      })
    }
  }

  // 3. Generate XML
  const xmlContent = await generateXmlForCompany(companyId, baseUrl, resources)
  const xmlFileName = getXmlFileName(company.slug)
  const xmlPath = `${BLOB_PREFIX}/${company.slug}/${xmlFileName}`

  const xmlBlob = await put(xmlPath, xmlContent, {
    access: 'public',
    contentType: 'application/xml; charset=utf-8',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 3600,
  })

  await saveBlobUrl(companyId, `${company.slug}-dataset.xml`, xmlBlob.url)

  // 4. Generate and upload MD5
  const md5Content = generateMd5(xmlContent)
  const md5FileName = getMd5FileName(company.slug)
  const md5Path = `${BLOB_PREFIX}/${company.slug}/${md5FileName}`

  const md5Blob = await put(md5Path, md5Content, {
    access: 'public',
    contentType: 'text/plain; charset=utf-8',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 3600,
  })

  await saveBlobUrl(companyId, `${company.slug}-dataset.md5`, md5Blob.url)

  // 5. Update company tracking
  await prisma.company.update({
    where: { id: companyId },
    data: {
      lastXmlGeneratedAt: today,
      lastXmlError: null,
    },
  })

  return {
    csvUrl: csvBlob.url,
    xmlUrl: xmlBlob.url,
    md5Url: md5Blob.url,
  }
}

export async function generateAllReports(baseUrl: string): Promise<{
  success: string[]
  errors: { company: string; error: string }[]
}> {
  // Warm Neon up before the real query — a SELECT 1 returns in milliseconds
  // once the compute is awake, whereas the first real findMany would otherwise
  // pay the wake-up cost (and risk a P1001) inside its own retry loop.
  await withDbRetry(() => prisma.$queryRaw`SELECT 1`, 'wakeup')

  const companies = await withDbRetry(
    () => prisma.company.findMany({
      where: {
        extIdent: { not: null },
        units: { some: {} },
      },
    }),
    'companies.findMany'
  )

  const success: string[] = []
  const errors: { company: string; error: string }[] = []

  // Intentionally serial — each company does ~10 sequential DB writes plus
  // 3 blob uploads. Running companies in parallel would multiply the pool
  // pressure (5 companies × 5 connections = 25 vs our limit of 5) and
  // overwhelm Neon's compute. Scales to 20+ companies safely; only the wall-
  // clock time grows linearly. If we ever hit maxDuration=300s, split the
  // cron in two (e.g., A-J then K-Z).
  for (const company of companies) {
    try {
      await withDbRetry(
        () => generateReportsForCompany(company.id, baseUrl),
        company.slug
      )
      success.push(company.name)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      errors.push({ company: company.name, error: message })
      // Best-effort: if logging the error itself fails (e.g. the same pool
      // exhaustion that just killed the company), swallow it so the loop
      // can keep trying the remaining companies.
      await prisma.company.update({
        where: { id: company.id },
        data: { lastXmlError: message },
      }).catch(() => {})
    }
  }

  return { success, errors }
}
