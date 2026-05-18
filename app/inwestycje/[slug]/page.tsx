import { notFound } from 'next/navigation'
import { FileText, Download } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { prisma } from '@/lib/prisma'
import { DynamicProjectHero } from '@/components/project-sections/hero'
import { DynamicPlanSection } from '@/components/project-sections/plan'
import { DynamicKeyFeatures } from '@/components/project-sections/key-features'
import { DynamicTwoColumnSection } from '@/components/project-sections/two-column-section'
import { DynamicStandardSection } from '@/components/project-sections/standard-section'
import { DynamicGallerySection } from '@/components/project-sections/gallery-section'
import { DynamicContactSection } from '@/components/project-sections/contact-section'

export const dynamic = 'force-dynamic'

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const project = await prisma.project.findUnique({
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
      planViews: { orderBy: { order: 'asc' } },
      sections: {
        where: { enabled: true },
        include: { items: { orderBy: { order: 'asc' } } },
        orderBy: { order: 'asc' },
      },
      galleryImages: { orderBy: { order: 'asc' } },
      documents: { orderBy: { order: 'asc' } },
    },
  })

  if (!project) notFound()

  const getSection = (type: string) => project.sections.find(s => s.type === type)

  const keyFeatures = getSection('key_features')
  const lokalizacja = getSection('lokalizacja')
  const otoczenie = getSection('otoczenie')
  const oInwestycji = getSection('o_inwestycji')
  const udogodnienia = getSection('udogodnienia')
  const dodatki = getSection('dodatki')
  const dom = getSection('dom')
  const standard = getSection('standard')
  const jakKupic = getSection('jak_kupic')
  const jakPomoc = getSection('jak_pomoc')
  const oInwestorze = getSection('o_inwestorze')

  const STATUS_MAP: Record<string, string> = {
    active: 'W sprzedaży',
    planned: 'Wkrótce',
    completed: 'Zakończona',
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      {project.imageUrl && (
        <DynamicProjectHero
          title={project.name}
          subtitle={project.heroSubtitle || ''}
          location={project.location}
          status={STATUS_MAP[project.status] || project.status}
          imageUrl={project.imageUrl}
        />
      )}

      {/* Key Features Strip */}
      {keyFeatures && keyFeatures.items.length > 0 && (
        <DynamicKeyFeatures items={keyFeatures.items} />
      )}

      {/* Lokalizacja */}
      {lokalizacja && (
        <DynamicTwoColumnSection
          section={lokalizacja}
          imagePosition="right"
          mapRight
          projectMap={{
            name: project.name,
            lat: project.latitude,
            lng: project.longitude,
            apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || null,
            mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || undefined,
          }}
        />
      )}

      {/* Otoczenie */}
      {otoczenie && (
        <DynamicTwoColumnSection
          section={otoczenie}
          imagePosition="left"
        />
      )}

      {/* O Inwestycji */}
      {oInwestycji && (
        <DynamicTwoColumnSection
          section={oInwestycji}
          imagePosition="right"
          dualImage
        />
      )}

      {/* Udogodnienia */}
      {udogodnienia && (
        <DynamicTwoColumnSection
          section={udogodnienia}
          imagePosition="left"
        />
      )}

      {/* Dodatki */}
      {dodatki && (
        <DynamicTwoColumnSection
          section={dodatki}
          imagePosition="right"
          showCta
        />
      )}

      {/* Dom */}
      {dom && (
        <DynamicTwoColumnSection
          section={dom}
          imagePosition="left"
        />
      )}

      {/* Standard */}
      {standard && standard.items.length > 0 && (
        <DynamicStandardSection section={standard} />
      )}

      {/* Gallery */}
      {project.galleryImages.length > 0 && (
        <DynamicGallerySection images={project.galleryImages} />
      )}

      {/* Plan Osiedla — hidden for planned projects (no units yet) */}
      {project.status !== 'planned' &&
        (project.svgContent || project.planImageUrl || project.planViews.length > 0) && (
          <DynamicPlanSection slug={project.slug} projectName={project.name} />
        )}

      {/* Informacje dodatkowe */}
      {(project.additionalInfo || project.documents.length > 0) && (
        <section className="py-16 lg:py-24 bg-[#faf9f7]">
          <div className="container mx-auto px-4 lg:px-8">

            {/* Badge + heading above the grid */}
            <div className="mb-10">
              <span
                className="inline-block px-4 py-1.5 rounded-full text-xs font-medium tracking-wide uppercase mb-4"
                style={{ backgroundColor: 'rgba(110, 46, 42, 0.1)', color: 'var(--color-primary)' }}
              >
                Dokumenty i cennik
              </span>
              <h2 className="font-serif text-3xl lg:text-4xl font-semibold" style={{ color: 'var(--color-foreground)' }}>
                Informacje dodatkowe
              </h2>
            </div>

            {/* Documents left, text right — both start at the same level */}
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">

              {/* Left: documents */}
              <div className="space-y-6">
                {project.documents.map((doc) => (
                  <div key={doc.id} className="bg-white rounded-2xl p-8 shadow-sm border border-border/50">
                    <div className="flex items-center gap-3 mb-6">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: 'rgba(110, 46, 42, 0.1)' }}
                      >
                        <FileText className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                      </div>
                      <div>
                        <h3 className="font-serif text-xl font-semibold" style={{ color: 'var(--color-foreground)' }}>
                          {doc.label}
                        </h3>
                        <p className="text-sm text-muted-foreground">Dokument do pobrania</p>
                      </div>
                    </div>
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 px-4 py-3 rounded-xl border border-border/50 bg-[#faf9f7] hover:bg-white transition-all hover:shadow-md"
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors bg-[var(--color-foreground)] group-hover:bg-[var(--color-primary)]">
                        <Download className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {doc.label}
                      </span>
                    </a>
                  </div>
                ))}
              </div>

              {/* Right: info text */}
              {project.additionalInfo && (
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {project.additionalInfo}
                </p>
              )}

            </div>
          </div>
        </section>
      )}

      {/* Jak kupić — section content only; no global BuyingProcess fallback in N9. */}
      {jakKupic && (
        <DynamicStandardSection section={jakKupic} />
      )}

      {/* Jak jeszcze możemy pomóc? */}
      {jakPomoc && (
        <DynamicTwoColumnSection
          section={jakPomoc}
          imagePosition="right"
        />
      )}

      {/* O inwestorze */}
      {oInwestorze && (
        <DynamicTwoColumnSection
          section={oInwestorze}
          imagePosition="left"
        />
      )}

      {/* Contact — show DynamicContactSection only when project has contact info.
          No brand-wide Contact fallback in N9; users land on the homepage form. */}
      {(project.contactPhone || project.contactEmail || project.contactAddress) && (
        <DynamicContactSection
          phone={project.contactPhone}
          email={project.contactEmail}
          address={project.contactAddress}
        />
      )}

      <Footer />
    </div>
  )
}
