"use client";

import { useState, useEffect } from "react";
import { Menu, X, Phone, Mail } from "lucide-react";
import Link from "next/link";

const navLinks = [
  { label: "O nas", href: "/#o-nas" },
  { label: "Projekty", href: "/#projekty" },
  { label: "Kontakt", href: "/#kontakt" },
];

// Public contact details, mirrored from the contact section.
const CONTACT_PHONE = "+48 452 068 785";
const CONTACT_PHONE_HREF = "tel:+48452068785";
const CONTACT_EMAIL = "vlad@qualops.io";
const CONTACT_EMAIL_HREF = "mailto:vlad@qualops.io";

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

          {/* Contact buttons */}
          <div className="flex items-center gap-3 pl-2">
            <a
              href={CONTACT_EMAIL_HREF}
              aria-label={`Napisz e-mail: ${CONTACT_EMAIL}`}
              title={CONTACT_EMAIL}
              className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors duration-300 ${
                scrolled
                  ? "border-border text-foreground hover:bg-muted"
                  : "border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10"
              }`}
            >
              <Mail className="h-4 w-4" />
            </a>
            <a
              href={CONTACT_PHONE_HREF}
              className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors duration-300 hover:bg-primary/90"
            >
              <Phone className="h-4 w-4" />
              <span className="hidden lg:inline">{CONTACT_PHONE}</span>
            </a>
          </div>
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
              <a
                href={CONTACT_EMAIL_HREF}
                className="flex items-center justify-center gap-2 rounded-full border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Mail className="h-4 w-4" />
                {CONTACT_EMAIL}
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
