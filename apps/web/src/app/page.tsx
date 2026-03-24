import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { PrestigeMarquee } from "@/components/PrestigeMarquee";
import { ExoticPillars } from "@/components/ExoticPillars";
import { ConfiguratorPreview } from "@/components/ConfiguratorPreview";
import { FeaturedInventory } from "@/components/FeaturedInventory";
import { PremiumServices } from "@/components/PremiumServices";
import { TestDriveStrip } from "@/components/TestDriveStrip";
import { TrustStrip } from "@/components/TrustStrip";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <PrestigeMarquee />
        <ExoticPillars />
        <ConfiguratorPreview />
        <FeaturedInventory />
        <PremiumServices />
        <TestDriveStrip />
        <TrustStrip />
      </main>
    </>
  );
}
