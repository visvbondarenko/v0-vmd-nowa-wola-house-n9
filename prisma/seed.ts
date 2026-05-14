import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding Nowa Wola House data…')

  // Singleton developer company for Nowa Wola House
  const company = await prisma.company.upsert({
    where: { slug: 'nowa-wola-house' },
    update: {},
    create: {
      slug: 'nowa-wola-house',
      name: 'Nowa Wola House sp. z o. o.',
      legalForm: 'SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ',
      nip: '0000000000',
      regon: '000000000',
    },
  })
  console.log(`Company ready: ${company.name}`)

  // Singleton "about us" section
  await prisma.aboutSection.upsert({
    where: { id: 'main' },
    update: {},
    create: {
      id: 'main',
      companyName: 'Nowa Wola House',
      description:
        'Tworzymy nowoczesne osiedla domów jednorodzinnych w Nowej Woli — z dbałością o detal, komfort i prywatność mieszkańców.',
      photos: [],
    },
  })

  console.log('Seeding complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
