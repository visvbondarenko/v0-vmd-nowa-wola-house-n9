import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { Navbar } from '@/components/navbar'
import { ContactSection } from '@/components/contact-section'
import { Footer } from '@/components/footer'
import { WolaHouseSchema } from '@/components/wola-house-schema'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const project = await prisma.project.findFirst({ where: { slug } })
  if (!project) return {}
  return {
    title: `${project.name} | VMD Development`,
    description: project.description ?? undefined,
  }
}

export default async function DynamicProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const project = await prisma.project.findFirst({
    where: { slug },
    include: {
      units: {
        orderBy: { label: 'asc' },
        include: {
          houseType: {
            include: {
              floorPlans: {
                include: { rooms: true },
                orderBy: { createdAt: 'asc' },
              },
            },
          },
        },
      },
      houseTypes: {
        include: {
          floorPlans: {
            include: { rooms: true },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      planViews: {
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!project) notFound()

  return (
    <main>
      <Navbar />
      <WolaHouseSchema
        projectName={project.name}
        description={project.units.length > 0 ? 'Kliknij na wybraną działkę aby poznać szczegóły.' : undefined}
        svgContent={project.svgContent}
        planImageUrl={project.planImageUrl}
        units={project.units as any}
        houseTypes={project.houseTypes as any}
        planViews={project.planViews}
      />
      <ContactSection />
      <Footer />
    </main>
  )
}
