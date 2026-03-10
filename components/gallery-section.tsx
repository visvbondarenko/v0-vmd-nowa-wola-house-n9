"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const images = [
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/generate_new_render_another_vi_Nano_Banana_Pro_49228-ws0SHRBuZw2BlQ8wPvSZicLGGEaElF.jpg",
    alt: "Widok z góry - perspektywa lotnicza całego projektu",
    label: "Perspektywa lotnicza",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/make_strict_front_view__Nano_Banana_Pro_96468-RwFXUWuezpRFIXa9JZwE0HD1Ax15yN.jpg",
    alt: "Widok z przodu - symetryczna elewacja frontowa",
    label: "Widok od ulicy",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/make_view_from_another_angle_i_Nano_Banana_Pro_76680-P2MMiziUtZbCeOG4yJ6aW8laGI49VT.jpg",
    alt: "Widok z ogrodu - perspektywa z tarasu i zielenią",
    label: "Perspektywa ogrodowa",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/I_need_realistic_renders_for_m_Nano_Banana_Pro_26318-n8XuoUSdQjygVI9Pw5YRLlY6NvYnoP.jpg",
    alt: "Widok z podjazdu - perspektywa wjazdowa z ogrodzeniem",
    label: "Widok z podjazdu",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/make_view_from_another_angle_i_Nano_Banana_Pro_37739-j5HWoyZ9SuwzwMEKhc30YXLuTFexbB.jpg",
    alt: "Widok z terasu - perspektywa z drewnianym tarasem",
    label: "Taras i ogród",
  },
];

export function GallerySection() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const prevImage = () =>
    setLightboxIndex((prev) =>
      prev !== null ? (prev - 1 + images.length) % images.length : null
    );
  const nextImage = () =>
    setLightboxIndex((prev) =>
      prev !== null ? (prev + 1) % images.length : null
    );

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
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground text-pretty">
            {"Pięć unikalnych perspektyw projektu — od widoku lotniczego, przez elewację frontową, po intymne ujęcia tarasu i ogrodu."}
          </p>
        </div>

        {/* Main Gallery - Five Images */}
        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3 auto-rows-max">
          {/* Image 1 - Perspektywa lotnicza */}
          <button
            onClick={() => openLightbox(0)}
            className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-4 focus:ring-offset-background shadow-xl lg:col-span-2 lg:row-span-2"
          >
            <img
              src={images[0].src}
              alt={images[0].alt}
              className="h-full w-full object-cover transition-all duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6">
              <span className="inline-block px-3 py-1.5 bg-primary text-xs font-semibold uppercase tracking-wider text-primary-foreground rounded-sm">
                {images[0].label}
              </span>
            </div>
            <div className="absolute top-6 right-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            </div>
          </button>

          {/* Image 2 - Widok od ulicy */}
          <button
            onClick={() => openLightbox(1)}
            className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-4 focus:ring-offset-background shadow-xl"
          >
            <img
              src={images[1].src}
              alt={images[1].alt}
              className="h-full w-full object-cover transition-all duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6">
              <span className="inline-block px-3 py-1.5 bg-primary text-xs font-semibold uppercase tracking-wider text-primary-foreground rounded-sm">
                {images[1].label}
              </span>
            </div>
            <div className="absolute top-6 right-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            </div>
          </button>

          {/* Image 3 - Perspektywa ogrodowa */}
          <button
            onClick={() => openLightbox(2)}
            className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-4 focus:ring-offset-background shadow-xl"
          >
            <img
              src={images[2].src}
              alt={images[2].alt}
              className="h-full w-full object-cover transition-all duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6">
              <span className="inline-block px-3 py-1.5 bg-primary text-xs font-semibold uppercase tracking-wider text-primary-foreground rounded-sm">
                {images[2].label}
              </span>
            </div>
            <div className="absolute top-6 right-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            </div>
          </button>

          {/* Image 4 - Widok z podjazdu */}
          <button
            onClick={() => openLightbox(3)}
            className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-4 focus:ring-offset-background shadow-xl"
          >
            <img
              src={images[3].src}
              alt={images[3].alt}
              className="h-full w-full object-cover transition-all duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6">
              <span className="inline-block px-3 py-1.5 bg-primary text-xs font-semibold uppercase tracking-wider text-primary-foreground rounded-sm">
                {images[3].label}
              </span>
            </div>
            <div className="absolute top-6 right-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            </div>
          </button>

          {/* Image 5 - Taras i ogród */}
          <button
            onClick={() => openLightbox(4)}
            className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-4 focus:ring-offset-background shadow-xl"
          >
            <img
              src={images[4].src}
              alt={images[4].alt}
              className="h-full w-full object-cover transition-all duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6">
              <span className="inline-block px-3 py-1.5 bg-primary text-xs font-semibold uppercase tracking-wider text-primary-foreground rounded-sm">
                {images[4].label}
              </span>
            </div>
            <div className="absolute top-6 right-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
          onClick={closeLightbox}
          role="dialog"
          aria-label="Powiekszone zdjecie"
        >
          <button
            onClick={closeLightbox}
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-10"
            aria-label="Zamknij"
          >
            <X size={32} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
            className="absolute left-6 text-white/70 hover:text-white transition-colors z-10"
            aria-label="Poprzednie zdjecie"
          >
            <ChevronLeft size={48} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            className="absolute right-6 text-white/70 hover:text-white transition-colors z-10"
            aria-label="Nastepne zdjecie"
          >
            <ChevronRight size={48} />
          </button>
          <div className="flex flex-col items-center gap-6">
            <img
              src={images[lightboxIndex].src}
              alt={images[lightboxIndex].alt}
              className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="text-center">
              <span className="inline-block px-4 py-2 bg-primary text-xs font-bold uppercase tracking-widest text-primary-foreground rounded-sm">
                {images[lightboxIndex].label}
              </span>
              <p className="mt-2 text-sm text-white/60">
                {lightboxIndex + 1} / {images.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
