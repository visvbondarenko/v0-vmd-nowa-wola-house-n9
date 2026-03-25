'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

type GalleryImage = { id: string; src: string; alt: string; label: string; order: number }

export function DynamicGallerySection({ images }: { images: GalleryImage[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const closeLightbox = () => setLightboxIndex(null)
  const prevImage = useCallback(() =>
    setLightboxIndex((prev) =>
      prev !== null ? (prev - 1 + images.length) % images.length : null
    ), [images.length])
  const nextImage = useCallback(() =>
    setLightboxIndex((prev) =>
      prev !== null ? (prev + 1) % images.length : null
    ), [images.length])

  useEffect(() => {
    if (lightboxIndex === null) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevImage()
      else if (e.key === 'ArrowRight') nextImage()
      else if (e.key === 'Escape') closeLightbox()
    }
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (e.deltaY > 0 || e.deltaX > 0) nextImage()
      else prevImage()
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('wheel', handleWheel)
    }
  }, [lightboxIndex, prevImage, nextImage])

  if (images.length === 0) return null

  return (
    <section id="galeria" className="bg-secondary/30 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">
            Galeria
          </p>
          <h2 className="mt-4 font-serif text-3xl font-bold text-foreground md:text-5xl text-balance">
            Wizualizacje projektu
          </h2>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3 auto-rows-max">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setLightboxIndex(index)}
              className={`group relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-4 focus:ring-offset-background shadow-xl${index === 0 ? ' lg:col-span-2 lg:row-span-2' : ''}`}
            >
              <img
                src={image.src}
                alt={image.alt || image.label}
                className="h-full w-full object-cover transition-all duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              {image.label && (
                <div className="absolute bottom-0 left-0 p-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="inline-block px-3 py-1.5 bg-primary text-xs font-semibold uppercase tracking-wider text-primary-foreground rounded-sm">
                    {image.label}
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
          onClick={closeLightbox}
          onTouchStart={(e) => {
            const touch = e.touches[0]
            ;(e.currentTarget as HTMLElement).dataset.touchX = String(touch.clientX)
          }}
          onTouchEnd={(e) => {
            const startX = Number((e.currentTarget as HTMLElement).dataset.touchX)
            const endX = e.changedTouches[0].clientX
            const diff = startX - endX
            if (Math.abs(diff) > 50) {
              if (diff > 0) nextImage()
              else prevImage()
            }
          }}
          role="dialog"
          aria-label="Powiekszone zdjecie"
        >
          <button onClick={closeLightbox} className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-10" aria-label="Zamknij">
            <X size={32} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); prevImage() }} className="absolute left-6 text-white/70 hover:text-white transition-colors z-10" aria-label="Poprzednie zdjecie">
            <ChevronLeft size={48} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); nextImage() }} className="absolute right-6 text-white/70 hover:text-white transition-colors z-10" aria-label="Nastepne zdjecie">
            <ChevronRight size={48} />
          </button>
          <div className="flex flex-col items-center gap-6">
            <img
              src={images[lightboxIndex].src}
              alt={images[lightboxIndex].alt || images[lightboxIndex].label}
              className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="text-center">
              {images[lightboxIndex].label && (
                <span className="inline-block px-4 py-2 bg-primary text-xs font-bold uppercase tracking-widest text-primary-foreground rounded-sm">
                  {images[lightboxIndex].label}
                </span>
              )}
              <p className="mt-2 text-sm text-white/60">
                {lightboxIndex + 1} / {images.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
