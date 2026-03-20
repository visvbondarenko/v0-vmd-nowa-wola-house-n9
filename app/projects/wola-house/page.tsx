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
    "Nowoczesny dom w zabudowie bliźniaczej w dzielnicy Wola, Warszawa. Dwa niezależne segmenty po 130 m². Cegła klinkierowa i ciemna elewacja metalowa.",
};

export default function WolaHousePage() {
  return (
    <main>
      <Navbar />
      <ProjectHero
        title="Wola House"
        subtitle="Nowoczesny dom w zabudowie bliźniaczej"
        location="Nowa Wola, Warszawa"
        image="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/generate_new_render_another_vi_Nano_Banana_Pro_49228-nQrBnyrpTy4QEGHVF70e823mUX2brZ.jpg"
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
