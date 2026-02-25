import { Navbar } from "@/components/navbar";
import { HeroSection } from "@/components/hero-section";
import { AboutSection } from "@/components/about-section";
import { GallerySection } from "@/components/gallery-section";
import { AvailabilitySection } from "@/components/availability-section";
import { ContactSection } from "@/components/contact-section";
import { Footer } from "@/components/footer";

export default function Page() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <AboutSection />
      <GallerySection />
      <AvailabilitySection />
      <ContactSection />
      <Footer />
    </main>
  );
}
