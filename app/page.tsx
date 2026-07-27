export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import { HeroSection } from "@/components/hero-section";
import { AboutCompanySection } from "@/components/about-company-section";
import { ProjectsSection } from "@/components/projects-section";
import { MapSection } from "@/components/map-section";
import { NewsScroll } from "@/components/news-scroll";
import { ContactSection } from "@/components/contact-section";
import { Footer } from "@/components/footer";

export default async function Page() {
  const rawPosts = await prisma.newsPost.findMany({
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
  });

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
      <MapSection />
      <NewsScroll posts={posts} />
      <ContactSection />
      <Footer />
    </main>
  );
}
