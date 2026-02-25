"use client";

import { ChevronDown } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/now_get_back_lower_part_a_a_br_Nano_Banana_Pro_67357-CH4slykgCukLyUn9JsGHpDNNIzrRc5.jpg"
          alt="VMD Development - wizualizacja architektoniczna"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
        <p className="mb-6 text-sm font-medium uppercase tracking-[0.3em] text-primary-foreground/60">
          VMD Development
        </p>
        <h1 className="font-serif text-4xl font-bold leading-tight text-primary-foreground md:text-6xl lg:text-7xl text-balance">
          {
            "Tworzymy przestrzenie,\nkt\u00f3re inspiruj\u0105"
          }
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-primary-foreground/80 md:text-xl text-pretty">
          Nowoczesna architektura, najwy\u017csze standardy wykonania i
          dba\u0142o\u015b\u0107 o ka\u017cdy detal. Poznaj nasze inwestycje.
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
