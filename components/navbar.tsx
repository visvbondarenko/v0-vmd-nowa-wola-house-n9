"use client";

import { useState, useEffect } from "react";
import { Menu, X, Phone, Mail } from "lucide-react";
import Link from "next/link";
import { ContactModal } from "@/components/contact-modal";

const navLinks = [
  { label: "O nas", href: "/#o-nas" },
  { label: "Projekty", href: "/#projekty" },
  { label: "Kontakt", href: "/#kontakt" },
];

// Public contact details, mirrored from the contact section.
const CONTACT_PHONE = "+48 452 068 785";
const CONTACT_PHONE_HREF = "tel:+48452068785";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Shared outline treatment so mail and phone buttons look identical.
  const outline = scrolled
    ? "border-border text-foreground hover:bg-muted"
    : "border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/95 backdrop-blur-md border-b border-border shadow-sm"
          : "bg-black/20 backdrop-blur-[2px]"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-6">
        <Link href="/" className="flex items-center gap-2 -ml-2">
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
        </Link>

        {/* Right side — nav links + contact buttons (desktop) + hamburger (mobile) */}
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium tracking-wide transition-colors duration-300 hover:opacity-70 ${
                  scrolled ? "text-foreground" : "text-primary-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              aria-label="Napisz do nas"
              title="Napisz do nas"
              className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors duration-300 ${outline}`}
            >
              <Mail className="h-4 w-4" />
            </button>
            <a
              href={CONTACT_PHONE_HREF}
              className={`flex h-9 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors duration-300 ${outline}`}
            >
              <Phone className="h-4 w-4" />
              {CONTACT_PHONE}
            </a>
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
        </div>
      </nav>

      {mobileOpen && (
        <div className="border-t border-border bg-background/95 backdrop-blur-md md:hidden">
          <div className="flex flex-col gap-1 px-6 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="py-3 text-sm font-medium text-foreground transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}

            <div className="mt-2 flex flex-col gap-3 border-t border-border pt-4">
              <a
                href={CONTACT_PHONE_HREF}
                className="flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Phone className="h-4 w-4" />
                {CONTACT_PHONE}
              </a>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  setContactOpen(true);
                }}
                className="flex items-center justify-center gap-2 rounded-full border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Mail className="h-4 w-4" />
                Napisz do nas
              </button>
            </div>
          </div>
        </div>
      )}

      <ContactModal isOpen={contactOpen} onClose={() => setContactOpen(false)} />
    </header>
  );
}
