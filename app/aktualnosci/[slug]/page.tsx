import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { NewsPostContent } from '@/components/news-post-content'
import { Calendar, ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await prisma.newsPost.findUnique({ where: { slug } })
  if (!post || !post.published) return { title: 'Aktualności' }
  return {
    title: `${post.title} — Aktualności`,
    description: post.description ?? undefined,
    openGraph: post.coverImageUrl ? { images: [post.coverImageUrl] } : undefined,
  }
}

export default async function NewsPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await prisma.newsPost.findUnique({
    where: { slug },
    include: { blocks: { orderBy: { order: 'asc' } } },
  })

  if (!post || !post.published) notFound()

  const date = post.publishedAt ?? post.createdAt

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <article className="pt-24 pb-20 lg:pb-32">
          <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
            <Link
              href="/aktualnosci"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Wszystkie aktualności
            </Link>

            <header className="mb-10">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
                <Calendar className="h-4 w-4" />
                {date.toLocaleDateString('pl-PL', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
              <h1
                className="font-serif text-3xl lg:text-5xl font-semibold mb-5 leading-tight"
                style={{ color: 'var(--color-foreground)' }}
              >
                {post.title}
              </h1>
              {post.description && (
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {post.description}
                </p>
              )}
            </header>

            {post.coverImageUrl && (
              <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-12 shadow-lg">
                <Image
                  src={post.coverImageUrl}
                  alt={post.title}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 896px"
                />
              </div>
            )}

            <NewsPostContent blocks={post.blocks} />
          </div>
        </article>
      </main>
      <Footer />
    </>
  )
}
