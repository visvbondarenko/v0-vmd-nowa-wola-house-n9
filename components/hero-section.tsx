"use client";

import { ChevronDown } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/make_view_from_another_angle_i_Nano_Banana_Pro_76680-zOVtr1QoOyEdW5AUA8GE8kamthrQz4.jpg"
          alt="VMD Development - wizualizacja architektoniczna"
          className="h-full w-full object-cover brightness-110"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <h1 className="font-serif text-3xl font-bold leading-tight text-primary-foreground md:text-4xl lg:text-5xl text-balance whitespace-pre-line">
          {"Tworzymy przestrzenie,\nktóre inspirują"}
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-primary-foreground/80 md:text-lg text-pretty">
          {"Tworzymy wyjątkowe domy, które oferują więcej przestrzeni użytkowej niż standardowe projekty."}
        </p>
      </div>

      {/* Button pinned to bottom */}
      <div className="absolute bottom-16 left-1/2 z-10 -translate-x-1/2">
        <a
          href="#projekty"
          className="inline-flex items-center gap-2 bg-primary px-6 py-3 text-xs font-semibold uppercase tracking-widest text-primary-foreground transition-all duration-300 hover:bg-primary/90 hover:scale-105"
        >
          Zobacz projekty
        </a>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="h-5 w-5 text-primary-foreground/50" />
      </div>
    </section>
  );
}
