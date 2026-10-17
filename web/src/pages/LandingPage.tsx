import { CinematicLanding } from "@/features/guest/cinematic/CinematicLanding";
import { usePageTitle } from "@/hooks/usePageTitle";

export function LandingPage() {
  usePageTitle("COLDI");
  return <CinematicLanding />;
}
