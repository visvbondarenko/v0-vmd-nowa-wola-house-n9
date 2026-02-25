import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { ProjectHero } from "@/components/project-hero";
import { AboutSection } from "@/components/about-section";
import { GallerySection } from "@/components/gallery-section";
import { AvailabilitySection } from "@/components/availability-section";
import { MapSection } from "@/components/map-section";
import { ContactSection } from "@/components/contact-section";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Wola House | VMD Development",
  description:
    "Nowoczesny dom w zabudowie bli\u017aniaczej w dzielnicy Wola, Warszawa. Dwa niezale\u017cne segmenty po 144 m\u00B2. Ceg\u0142a klinkierowa i ciemna elewacja metalowa.",
};

export default function WolaHousePage() {
  return (
    <main>
      <Navbar />
      <ProjectHero
        title="Wola House"
        subtitle="Nowoczesny dom w zabudowie bli\u017aniaczej"
        location="Wola, Warszawa"
        image="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/now_get_back_lower_part_a_a_br_Nano_Banana_Pro_67357-CH4slykgCukLyUn9JsGHpDNNIzrRc5.jpg"
      />
      <AboutSection />
      <GallerySection />
      <AvailabilitySection />
      <MapSection />
      <ContactSection />
      <Footer />
    </main>
  );
}
