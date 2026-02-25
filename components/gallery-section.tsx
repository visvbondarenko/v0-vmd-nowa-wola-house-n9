"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const images = [
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/now_get_back_lower_part_a_a_br_Nano_Banana_Pro_67357-CH4slykgCukLyUn9JsGHpDNNIzrRc5.jpg",
    alt: "Widok z przodu - nowoczesny dom bliźniaczy",
    label: "Elewacja frontowa",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Please_remove_one_section_of_a_Nano_Banana_Pro_70829-1fWGmrMdoEO1GwdUtb9vBDF8xkP4No.jpg",
    alt: "Widok z tyłu - ogród i taras",
    label: "Elewacja ogrodowa",
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
    <section id="galeria" className="bg-secondary/50 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">
            Galeria
          </p>
          <h2 className="mt-4 font-serif text-3xl font-bold text-foreground md:text-5xl text-balance">
            Wizualizacje architektoniczne
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground text-pretty">
            Każdy widok budynku oddaje charakter nowoczesnej architektury z
            harmonijnym połączeniem cegły klinkierowej i ciemnego metalu.
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="mt-16 grid gap-4 md:grid-cols-2">
          {images.map((image, index) => (
            <button
              key={image.src}
              onClick={() => openLightbox(index)}
              className="group relative aspect-[4/3] overflow-hidden bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <img
                src={image.src}
                alt={image.alt}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 transition-all duration-300 group-hover:bg-black/20" />
              <div className="absolute bottom-0 left-0 right-0 translate-y-full bg-gradient-to-t from-black/70 to-transparent p-6 transition-transform duration-300 group-hover:translate-y-0">
                <span className="text-sm font-medium text-primary-foreground">
                  {image.label}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={closeLightbox}
          role="dialog"
          aria-label="Powiększone zdjęcie"
        >
          <button
            onClick={closeLightbox}
            className="absolute top-6 right-6 text-primary-foreground/70 hover:text-primary-foreground transition-colors"
            aria-label="Zamknij"
          >
            <X size={28} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
            className="absolute left-4 text-primary-foreground/70 hover:text-primary-foreground transition-colors"
            aria-label="Poprzednie zdjęcie"
          >
            <ChevronLeft size={36} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            className="absolute right-4 text-primary-foreground/70 hover:text-primary-foreground transition-colors"
            aria-label="Następne zdjęcie"
          >
            <ChevronRight size={36} />
          </button>
          <img
            src={images[lightboxIndex].src}
            alt={images[lightboxIndex].alt}
            className="max-h-[85vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
}
