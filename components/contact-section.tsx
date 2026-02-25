"use client";

import { useState } from "react";
import { Send, Phone, Mail, MapPin } from "lucide-react";

export function ContactSection() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section id="kontakt" className="bg-foreground py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-2">
          {/* Left - Info */}
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary-foreground/50">
              Kontakt
            </p>
            <h2 className="mt-4 font-serif text-3xl font-bold text-primary-foreground md:text-5xl text-balance">
              Porozmawiajmy o Twoim nowym domu
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-primary-foreground/70 text-pretty">
              Masz pytania dotyczące inwestycji? Chętnie odpowiemy na wszystkie
              wątpliwości i umówimy się na prezentację.
            </p>

            <div className="mt-12 flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center bg-primary-foreground/10">
                  <Phone className="h-5 w-5 text-primary-foreground/70" />
                </div>
                <div>
                  <p className="text-sm text-primary-foreground/50">Telefon</p>
                  <p className="font-medium text-primary-foreground">
                    +48 123 456 789
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center bg-primary-foreground/10">
                  <Mail className="h-5 w-5 text-primary-foreground/70" />
                </div>
                <div>
                  <p className="text-sm text-primary-foreground/50">E-mail</p>
                  <p className="font-medium text-primary-foreground">
                    kontakt@vmd-development.pl
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center bg-primary-foreground/10">
                  <MapPin className="h-5 w-5 text-primary-foreground/70" />
                </div>
                <div>
                  <p className="text-sm text-primary-foreground/50">
                    Lokalizacja
                  </p>
                  <p className="font-medium text-primary-foreground">
                    Polska
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Form */}
          <div>
            {submitted ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center bg-primary/20">
                    <Send className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <h3 className="mt-6 font-serif text-2xl font-bold text-primary-foreground">
                    Dziękujemy!
                  </h3>
                  <p className="mt-3 text-primary-foreground/70">
                    Twoja wiadomość została wysłana. Skontaktujemy się z Tobą
                    najszybciej, jak to możliwe.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="mb-2 block text-sm font-medium text-primary-foreground/70"
                    >
                      Imię
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      required
                      className="w-full border-b border-primary-foreground/20 bg-transparent py-3 text-primary-foreground placeholder:text-primary-foreground/30 focus:border-primary-foreground/60 focus:outline-none transition-colors"
                      placeholder="Jan"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="lastName"
                      className="mb-2 block text-sm font-medium text-primary-foreground/70"
                    >
                      Nazwisko
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      required
                      className="w-full border-b border-primary-foreground/20 bg-transparent py-3 text-primary-foreground placeholder:text-primary-foreground/30 focus:border-primary-foreground/60 focus:outline-none transition-colors"
                      placeholder="Kowalski"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-primary-foreground/70"
                  >
                    E-mail
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    className="w-full border-b border-primary-foreground/20 bg-transparent py-3 text-primary-foreground placeholder:text-primary-foreground/30 focus:border-primary-foreground/60 focus:outline-none transition-colors"
                    placeholder="jan@example.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-medium text-primary-foreground/70"
                  >
                    Telefon
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    className="w-full border-b border-primary-foreground/20 bg-transparent py-3 text-primary-foreground placeholder:text-primary-foreground/30 focus:border-primary-foreground/60 focus:outline-none transition-colors"
                    placeholder="+48 000 000 000"
                  />
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="mb-2 block text-sm font-medium text-primary-foreground/70"
                  >
                    Wiadomość
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    className="w-full border-b border-primary-foreground/20 bg-transparent py-3 text-primary-foreground placeholder:text-primary-foreground/30 focus:border-primary-foreground/60 focus:outline-none resize-none transition-colors"
                    placeholder="Jestem zainteresowany/a inwestycją..."
                  />
                </div>

                <button
                  type="submit"
                  className="mt-4 flex items-center justify-center gap-3 bg-primary px-8 py-4 text-sm font-semibold uppercase tracking-widest text-primary-foreground transition-all duration-300 hover:bg-primary/90 hover:scale-[1.02]"
                >
                  Wyślij wiadomość
                  <Send className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
