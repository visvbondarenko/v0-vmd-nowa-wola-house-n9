export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { HeroSection } from "@/components/hero-section";
import { AboutCompanySection } from "@/components/about-company-section";
import { ProjectsSection } from "@/components/projects-section";
import { CityMap } from "@/components/lokalizacja/city-map";
import { loadLokalizacjaPoints } from "@/lib/lokalizacja-points";
import { NewsScroll } from "@/components/news-scroll";
import { ContactSection } from "@/components/contact-section";
import { Footer } from "@/components/footer";

export default async function Page() {
  const [rawPosts, mapPoints] = await Promise.all([
    prisma.newsPost.findMany({
      where: { published: true },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 12,
      include: {
        blocks: {
          where: { type: "image" },
          orderBy: { order: "asc" },
          take: 1,
        },
      },
    }),
    loadLokalizacjaPoints(),
  ]);

  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || null;
  const mapsMapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || undefined;

  // NewsScroll takes plain-serialisable posts and only renders a cover image;
  // fall back to the first image block when no explicit cover is set.
  const posts = rawPosts.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description,
    coverImageUrl: p.coverImageUrl ?? p.blocks[0]?.imageUrl ?? null,
    publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
  }));

  return (
    <main>
      <Navbar />
      <HeroSection />
      <AboutCompanySection />
      <ProjectsSection />

      <section id="lokalizacja" className="py-20 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2
              className="font-serif text-3xl lg:text-4xl font-semibold mb-4"
              style={{ color: "var(--color-foreground)" }}
            >
              Lokalizacje inwestycji
            </h2>
            <p className="text-muted-foreground text-base lg:text-lg max-w-2xl mx-auto">
              Znajdź nasze inwestycje na mapie w wybranym mieście
            </p>
          </div>
          <CityMap apiKey={mapsApiKey} mapId={mapsMapId} points={mapPoints} />
        </div>
      </section>

      <NewsScroll posts={posts} />
      <ContactSection />
      <Footer />
    </main>
  );
}
