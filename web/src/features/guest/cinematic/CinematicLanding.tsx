import { BusinessClose } from "@/features/guest/cinematic/BusinessClose";
import { CinematicJourney } from "@/features/transition-lab/PhaseOnePreview";

export function CinematicLanding() {
  return (
    <>
      <CinematicJourney />
      <BusinessClose />
    </>
  );
}
