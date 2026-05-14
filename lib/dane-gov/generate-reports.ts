import { put } from '@vercel/blob'
import { prisma } from '@/lib/prisma'
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

// Wraps a DB-bound async fn in retry-with-backoff. Only retries on transient
// connection-level errors (Neon waking up, pool drained, brief network blip).
// Real errors (FK violation, validation, missing record) propagate immediately
// so we don't mask logic bugs.
async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  attempts = 3
): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      const isTransient =
        msg.includes('connection pool') ||
        msg.includes('P1001') ||      // Can't reach database server
        msg.includes('P1002') ||      // Database server timed out
        msg.includes('P2024') ||      // Timed out fetching connection
        msg.includes('ECONNREFUSED') ||
        msg.includes('ECONNRESET') ||
        msg.includes('ETIMEDOUT')
      if (!isTransient || i === attempts - 1) throw err
      const delay = 2000 * Math.pow(2, i) // 2s, 4s, 8s
      console.warn(`[generate-reports] ${label} attempt ${i + 1} failed (${msg}); retrying in ${delay}ms`)
      await new Promise(r => setTimeout(r, delay))
    }
  }
  // Unreachable — loop either returns or throws.
  throw new Error('withRetry: exhausted')
}

export async function generateAllReports(baseUrl: string): Promise<{
  success: string[]
  errors: { company: string; error: string }[]
}> {
  const companies = await withRetry(
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
      await withRetry(
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
