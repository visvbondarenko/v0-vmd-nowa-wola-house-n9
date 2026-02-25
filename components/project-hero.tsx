"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function ProjectHero({
  title,
  subtitle,
  location,
  image,
}: {
  title: string;
  subtitle: string;
  location: string;
  image: string;
}) {
  return (
    <section className="relative flex min-h-[70vh] items-end overflow-hidden pb-16 pt-32">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={image}
          alt={`${title} - wizualizacja architektoniczna`}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />
      </div>

      {/* Back link */}
      <Link
        href="/"
        className="absolute top-24 left-6 z-20 inline-flex items-center gap-2 text-sm font-medium text-primary-foreground/70 transition-colors hover:text-primary-foreground lg:left-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Wszystkie projekty
      </Link>

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 lg:px-8">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary-foreground/50">
          {location}
        </p>
        <h1 className="mt-3 font-serif text-4xl font-bold text-primary-foreground md:text-6xl lg:text-7xl text-balance">
          {title}
        </h1>
        <p className="mt-4 text-lg text-primary-foreground/70 md:text-xl">
          {subtitle}
        </p>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="h-6 w-6 text-primary-foreground/50" />
      </div>
    </section>
  );
}
