// One-shot data corrections for the dane.gov.pl feed, from the 2026-08-11 review.
// Idempotent: re-running it is a no-op. Run with:
//   node --env-file=.env.local scripts/fix-dane-gov-data.mjs
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const COMPANY = {
  // "sp. z.o.o." -> "sp. z o.o." (the space belongs after the z)
  name: 'VMD DEVELOPMENT sp. z o.o.',
  contactEmail: 'kontakt@vmd-development.com',
  // Wawer is a dzielnica of m.st. Warszawa, not a gmina. In TERYT the gmina is
  // Warszawa (146501) under powiat Warszawa — a miasto na prawach powiatu.
  addrMunicipality: 'Warszawa',
  salesMunicipality: 'Warszawa',
}

const WOLA_HOUSE = {
  contactEmail: 'kontakt@vmd-development.com',
  // was "05‑500" — U+2011 NON-BREAKING HYPHEN pasted from a document
  investPostalCode: '05-500',
  // was a literal "-"; null makes the generator emit the schema's "X" marker
  investBuildingNr: null,
  // match the uppercase form the company rows already use
  investVoivodeship: 'MAZOWIECKIE',
  propertyType: 'lokal mieszkalny',
  prospektUrl: 'https://vmd-development.com/inwestycje/wola-house',
}

function diff(before, patch) {
  return Object.entries(patch).filter(([k, v]) => before[k] !== v)
}

const company = await prisma.company.findUnique({ where: { slug: 'vmd-development' } })
if (!company) throw new Error('company vmd-development not found')
const companyChanges = diff(company, COMPANY)
for (const [k, v] of companyChanges) console.log(`Company.${k}: ${JSON.stringify(company[k])} -> ${JSON.stringify(v)}`)
if (companyChanges.length) {
  await prisma.company.update({ where: { id: company.id }, data: Object.fromEntries(companyChanges) })
}

const project = await prisma.project.findUnique({ where: { slug: 'wola-house' } })
if (!project) throw new Error('project wola-house not found')
const projectChanges = diff(project, WOLA_HOUSE)
for (const [k, v] of projectChanges) console.log(`Project(wola-house).${k}: ${JSON.stringify(project[k])} -> ${JSON.stringify(v)}`)
if (projectChanges.length) {
  await prisma.project.update({ where: { id: project.id }, data: Object.fromEntries(projectChanges) })
}

// Any other project still carrying the off-schema "Mieszkanie".
const stale = await prisma.project.updateMany({
  where: { propertyType: { notIn: ['lokal mieszkalny', 'dom jednorodzinny'] } },
  data: { propertyType: 'lokal mieszkalny' },
})
if (stale.count) console.log(`Project.propertyType: normalised ${stale.count} other project(s)`)

if (!companyChanges.length && !projectChanges.length && !stale.count) console.log('nothing to change')
await prisma.$disconnect()
