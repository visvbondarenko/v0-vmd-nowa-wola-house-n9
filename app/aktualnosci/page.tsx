import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Calendar, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AktualnosciPage() {
  const posts = await prisma.newsPost.findMany({
    where: { published: true },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    include: {
      blocks: {
        where: { type: 'image' },
        orderBy: { order: 'asc' },
        take: 1,
      },
    },
  })

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <div className="pt-24 pb-20 lg:pb-32">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center mb-16">
              <h1
                className="font-serif text-4xl lg:text-5xl font-semibold mb-4"
                style={{ color: 'var(--color-foreground)' }}
              >
                Aktualności
              </h1>
              <p className="text-muted-foreground text-base lg:text-lg max-w-2xl mx-auto">
                Najnowsze informacje z życia naszej firmy i inwestycji
              </p>
            </div>

            {posts.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <p className="text-lg">Brak aktualności.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post) => {
                  const thumb = post.coverImageUrl ?? post.blocks[0]?.imageUrl
                  const date = post.publishedAt ?? post.createdAt
                  return (
                    <Link
                      key={post.id}
                      href={`/aktualnosci/${post.slug}`}
                      className="group bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-1 border border-border/50 flex flex-col"
                    >
                      {thumb ? (
                        <div className="relative aspect-[16/9] overflow-hidden">
                          <Image
                            src={thumb}
                            alt={post.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        </div>
                      ) : (
                        <div className="aspect-[16/9] bg-muted flex items-center justify-center">
                          <span className="text-muted-foreground text-sm">Brak zdjęcia</span>
                        </div>
                      )}

                      <div className="p-6 flex flex-col flex-grow">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                          <Calendar className="h-3.5 w-3.5" />
                          {date.toLocaleDateString('pl-PL', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                        <h2
                          className="font-serif text-xl font-semibold mb-3"
                          style={{ color: 'var(--color-foreground)' }}
                        >
                          {post.title}
                        </h2>
                        {post.description && (
                          <p className="text-sm text-muted-foreground line-clamp-3 flex-grow">
                            {post.description}
                          </p>
                        )}
                        <span
                          className="mt-4 inline-flex items-center gap-1 text-sm font-medium"
                          style={{ color: 'var(--color-primary)' }}
                        >
                          Czytaj więcej
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
