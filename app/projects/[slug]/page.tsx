import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { Navbar } from '@/components/navbar'
import { ProjectHero } from '@/components/project-hero'
import { ContactSection } from '@/components/contact-section'
import { Footer } from '@/components/footer'
import { ProjectNavigator } from '@/components/project-navigator'

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
      <ProjectHero
        title={project.name}
        subtitle={project.description ?? ''}
        location={project.location}
        image={project.imageUrl ?? '/placeholder.jpg'}
      />
      <section id="dostepnosc" className="py-24 lg:py-32 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">Dostępność</p>
            <h2 className="mt-4 font-serif text-3xl font-bold text-foreground md:text-5xl text-balance">
              Wybierz swoją działkę
            </h2>
            {project.units.length > 0 && (
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                Kliknij na wybraną działkę aby poznać szczegóły.
              </p>
            )}
          </div>
          <ProjectNavigator
            svgContent={project.svgContent}
            planImageUrl={project.planImageUrl}
            units={project.units as any}
            houseTypes={project.houseTypes as any}
            planViews={project.planViews}
          />
        </div>
      </section>
      <ContactSection />
      <Footer />
    </main>
  )
}
