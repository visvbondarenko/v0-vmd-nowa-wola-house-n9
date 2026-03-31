import { Building2, Award, Target } from "lucide-react";

export function AboutCompanySection() {
  return (
    <section id="o-nas" className="py-24 lg:py-32 bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-24 items-center">
          {/* Text Content */}
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">
              O nas
            </p>
            <h2 className="mt-4 font-serif text-3xl font-bold text-foreground md:text-5xl text-balance">
              VMD Development
            </h2>
            
            <div className="mt-8 space-y-6 text-base leading-relaxed text-muted-foreground">
              <p>
                Nasza firma powstała z doświadczenia w inwestowaniu w budowę domów. Przez lata obserwowaliśmy cały proces – od projektu po realizację – co pozwoliło nam zdobyć praktyczną wiedzę i zrozumienie branży od podstaw.
              </p>
              <p>
                Dziś sami realizujemy inwestycje budowlane, wykorzystując zdobyte doświadczenie oraz sprawdzone rozwiązania. W branży budowlanej działamy już od około 8 lat, stawiając na jakość, rzetelność i profesjonalne podejście do każdego projektu.
              </p>
              <p>
                Naszym celem jest tworzenie lepszych projektów w uczciwej i konkurencyjnej cenie, tak aby każdy klient otrzymał najwyższą jakość w rozsądnym budżecie.
              </p>
            </div>
          </div>

          {/* Stats/Features */}
          <div className="grid gap-6 sm:grid-cols-1">
            <div className="border border-border bg-card p-8 transition-all duration-300 hover:border-primary/30 hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-6 font-serif text-lg font-semibold text-card-foreground">
                8 lat doświadczenia
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Wieloletnia obecność w branży budowlanej pozwoliła nam wypracować sprawdzone metody i nawiązać współpracę z najlepszymi wykonawcami.
              </p>
            </div>

            <div className="border border-border bg-card p-8 transition-all duration-300 hover:border-primary/30 hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center bg-primary/10">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-6 font-serif text-lg font-semibold text-card-foreground">
                Jakość i rzetelność
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Każdy projekt realizujemy z najwyższą starannością, dbając o każdy detal i dotrzymując ustalonych terminów.
              </p>
            </div>

            <div className="border border-border bg-card p-8 transition-all duration-300 hover:border-primary/30 hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center bg-primary/10">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-6 font-serif text-lg font-semibold text-card-foreground">
                Uczciwa cena
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Oferujemy konkurencyjne ceny bez kompromisów w kwestii jakości — najwyższy standard w rozsądnym budżecie.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
