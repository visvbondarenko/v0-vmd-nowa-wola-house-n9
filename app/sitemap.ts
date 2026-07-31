import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

// Canonical host. Override with NEXT_PUBLIC_BASE_URL in the environment.
const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://www.vmd-development.com').replace(/\/$/, '')

// Generated on each request so newly published investments/articles appear
// without a rebuild.
export const dynamic = 'force-dynamic'

/** Absolutise an image URL on the canonical host (Blob URLs are already absolute). */
function abs(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`
}

/** Unique, absolute image URLs (drops empties). */
function imageUrls(...urls: (string | null | undefined)[]): string[] {
  return Array.from(new Set(urls.filter((u): u is string => !!u).map(abs)))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static public routes. Add new top-level pages here.
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/inwestycje`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/aktualnosci`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/lokalizacja`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ]

  const [projects, posts] = await Promise.all([
    // Mirror the /inwestycje list visibility filter (published, non-archived).
    prisma.project.findMany({
      where: { published: true, status: { not: 'archived' } },
      select: {
        slug: true,
        updatedAt: true,
        imageUrl: true,
        galleryImages: { select: { src: true }, orderBy: { order: 'asc' } },
      },
    }),
    // Mirror the /aktualnosci list visibility filter.
    prisma.newsPost.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true, coverImageUrl: true },
    }),
  ])

  const investmentRoutes: MetadataRoute.Sitemap = projects.map((p) => ({
    url: `${baseUrl}/inwestycje/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
    images: imageUrls(p.imageUrl, ...p.galleryImages.map((g) => g.src)),
  }))

  const articleRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${baseUrl}/aktualnosci/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.5,
    images: imageUrls(p.coverImageUrl),
  }))

  return [...staticRoutes, ...investmentRoutes, ...articleRoutes]
}
