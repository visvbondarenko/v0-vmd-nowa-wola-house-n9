import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { Navbar } from '@/components/navbar'
import { ProjectHero } from '@/components/project-hero'
import { ContactSection } from '@/components/contact-section'
import { Footer } from '@/components/footer'
import { DynamicAvailabilitySection } from '@/components/dynamic-availability-section'

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
      units: { orderBy: { label: 'asc' } },
      houseTypes: {
        include: {
          floorPlans: {
            include: { rooms: true },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!project) notFound()

  return (
    <main>
      <Navbar />
      <ProjectHero
        title={project.name}
        subtitle={project.description ?? ''}
        location={project.location}
        image={project.imageUrl ?? '/placeholder.jpg'}
      />
      <DynamicAvailabilitySection project={project} />
      <ContactSection />
      <Footer />
    </main>
  )
}
