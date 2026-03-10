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
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
        <h1 className="font-serif text-4xl font-bold leading-tight text-primary-foreground md:text-6xl lg:text-7xl text-balance whitespace-pre-line">
          {"Tworzymy przestrzenie,\nktóre inspirują"}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-primary-foreground/80 md:text-xl text-pretty">
          {"Tworzymy wyjątkowe domy, które oferują więcej przestrzeni użytkowej niż standardowe projekty — połączone z nowoczesnym designem i najwyższą jakością wykonania."}
        </p>
        <a
          href="#projekty"
          className="mt-10 inline-flex items-center gap-2 bg-primary px-8 py-4 text-sm font-semibold uppercase tracking-widest text-primary-foreground transition-all duration-300 hover:bg-primary/90 hover:scale-105"
        >
          Zobacz projekty
        </a>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="h-6 w-6 text-primary-foreground/50" />
      </div>
    </section>
  );
}
