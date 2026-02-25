export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <span className="font-serif text-lg font-bold text-foreground">
              VMD
            </span>
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Development
            </span>
          </div>

          <div className="flex items-center gap-8">
            <a
              href="#o-inwestycji"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              O inwestycji
            </a>
            <a
              href="#galeria"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Galeria
            </a>
            <a
              href="#dostepnosc"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Dostępność
            </a>
            <a
              href="#kontakt"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Kontakt
            </a>
          </div>

          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} VMD Development. Wszelkie prawa
            zastrzeżone.
          </p>
        </div>
      </div>
    </footer>
  );
}
