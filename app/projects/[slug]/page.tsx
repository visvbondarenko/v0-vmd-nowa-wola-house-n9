import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { Navbar } from '@/components/navbar'
import { ProjectHero } from '@/components/project-hero'
import { DynamicAboutSection } from '@/components/dynamic-about-section'
import { DynamicGallerySection } from '@/components/dynamic-gallery-section'
import { WolaHouseSchema } from '@/components/wola-house-schema'
import { DynamicMapSection } from '@/components/dynamic-map-section'
import { DynamicContactSection } from '@/components/dynamic-contact-section'
import { Footer } from '@/components/footer'

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
      aboutFeatures: { orderBy: { order: 'asc' } },
      galleryImages: { orderBy: { order: 'asc' } },
    },
  })

  if (!project) notFound()

  const hasHero = !!(project.imageUrl && project.heroSubtitle)
  const hasAbout = !!(project.aboutHeading && project.aboutText)
  const hasGallery = project.galleryImages.length > 0
  const hasMap = !!project.mapEmbedUrl
  const hasContact = !!(project.contactPhone || project.contactEmail || project.contactAddress)

  return (
    <main>
      <Navbar />

      {hasHero && (
        <ProjectHero
          title={project.name}
          subtitle={project.heroSubtitle!}
          location={project.location}
          image={project.imageUrl!}
        />
      )}

      {hasAbout && (
        <DynamicAboutSection
          heading={project.aboutHeading!}
          text={project.aboutText!}
          features={project.aboutFeatures}
        />
      )}

      {hasGallery && (
        <DynamicGallerySection images={project.galleryImages} />
      )}

      <WolaHouseSchema
        projectName={project.name}
        description={project.units.length > 0 ? 'Kliknij na wybraną działkę aby poznać szczegóły.' : undefined}
        svgContent={project.svgContent}
        planImageUrl={project.planImageUrl}
        units={project.units as any}
        houseTypes={project.houseTypes as any}
        planViews={project.planViews}
      />

      {hasMap && (
        <DynamicMapSection
          mapEmbedUrl={project.mapEmbedUrl!}
          address={project.locationAddress}
          transport={project.locationTransport}
          surroundings={project.locationSurroundings}
        />
      )}

      {hasContact ? (
        <DynamicContactSection
          phone={project.contactPhone}
          email={project.contactEmail}
          address={project.contactAddress}
        />
      ) : (
        <DynamicContactSection />
      )}

      <Footer />
    </main>
  )
}
