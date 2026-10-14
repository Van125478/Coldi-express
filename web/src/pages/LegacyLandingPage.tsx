import { HeroSection } from "@/components/guest/HeroSection";
import { ColdChainScroll } from "@/components/guest/cinematic/ColdChainScroll";
import { ProofStrip } from "@/components/guest/ProofStrip";
import { usePageTitle } from "@/hooks/usePageTitle";

export function LegacyLandingPage() {
  usePageTitle("Coldi Freight");

  return (
    <>
      <HeroSection />
      <ColdChainScroll />
      <ProofStrip />
    </>
  );
}
