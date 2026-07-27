"use client";

import { useEffect, useState } from "react";

// Custom event name a "Ustawienia cookies" link can dispatch to reopen the
// banner after a choice has been made.
export const OPEN_COOKIE_SETTINGS_EVENT = "open-cookie-settings";

const COOKIE_NAME = "cookie_consent";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 180 days

function readConsentCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)cookie_consent=([^;]+)/);
  return match ? match[1] : null;
}

function writeConsentCookie(value: "granted" | "denied"): void {
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show only when no choice has been stored yet.
    if (!readConsentCookie()) setVisible(true);

    const reopen = () => setVisible(true);
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen);
  }, []);

  const accept = () => {
    writeConsentCookie("granted");
    setVisible(false);
  };

  const reject = () => {
    writeConsentCookie("denied");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Zgoda na pliki cookies"
      className="fixed inset-x-0 bottom-0 z-[9998] px-4 pb-4 sm:px-6 sm:pb-6"
    >
      <div className="container mx-auto max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-2xl sm:p-7">
        <h2 className="font-serif text-xl font-semibold text-foreground mb-2">
          Pliki cookies
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Ta strona używa plików cookies, aby zapewnić najlepsze wrażenia z
          korzystania z serwisu. Kontynuując przeglądanie, akceptujesz warunki
          korzystania z witryny.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={reject}
            className="rounded-full border border-border bg-background px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Odrzucam
          </button>
          <button
            type="button"
            onClick={accept}
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            Akceptuję
          </button>
        </div>
      </div>
    </div>
  );
}
