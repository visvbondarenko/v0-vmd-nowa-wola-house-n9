import type { MetadataRoute } from 'next'

// Canonical host. Override with NEXT_PUBLIC_BASE_URL in the environment.
const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://www.vmd-development.com').replace(/\/$/, '')

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // The admin panel and its APIs are never public content.
      disallow: ['/admin', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
