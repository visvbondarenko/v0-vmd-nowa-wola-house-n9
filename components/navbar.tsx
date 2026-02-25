"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "O inwestycji", href: "#o-inwestycji" },
  { label: "Galeria", href: "#galeria" },
  { label: "Dostępność", href: "#dostepnosc" },
  { label: "Kontakt", href: "#kontakt" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/95 backdrop-blur-md border-b border-border shadow-sm"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <a href="#" className="flex items-center gap-2">
          <span
            className={`font-serif text-xl font-bold tracking-wide transition-colors duration-500 ${
              scrolled ? "text-foreground" : "text-primary-foreground"
            }`}
          >
            VMD
          </span>
          <span
            className={`text-xs font-medium uppercase tracking-[0.2em] transition-colors duration-500 ${
              scrolled ? "text-muted-foreground" : "text-primary-foreground/70"
            }`}
          >
            Development
          </span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-sm font-medium tracking-wide transition-colors duration-300 hover:opacity-70 ${
                scrolled ? "text-foreground" : "text-primary-foreground"
              }`}
            >
              {link.label}
            </a>
          ))}
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={`md:hidden transition-colors ${
            scrolled ? "text-foreground" : "text-primary-foreground"
          }`}
          aria-label={mobileOpen ? "Zamknij menu" : "Otwórz menu"}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="border-t border-border bg-background/95 backdrop-blur-md md:hidden">
          <div className="flex flex-col gap-1 px-6 py-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="py-3 text-sm font-medium text-foreground transition-colors hover:text-primary"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
