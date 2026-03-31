export const dynamic = "force-dynamic";

import { Navbar } from "@/components/navbar";
import { HeroSection } from "@/components/hero-section";
import { AboutCompanySection } from "@/components/about-company-section";
import { ProjectsSection } from "@/components/projects-section";
import { MapSection } from "@/components/map-section";
import { ContactSection } from "@/components/contact-section";
import { Footer } from "@/components/footer";

export default function Page() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <AboutCompanySection />
      <ProjectsSection />
      <MapSection />
      <ContactSection />
      <Footer />
    </main>
  );
}
