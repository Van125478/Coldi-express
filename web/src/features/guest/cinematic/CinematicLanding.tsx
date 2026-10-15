import { AudienceSolutions } from "@/features/guest/home/AudienceSolutions";
import { EditorialBridge } from "@/features/guest/home/EditorialBridge";
import { JourneyMilestones } from "@/features/guest/home/JourneyMilestones";
import { CinematicJourney } from "@/features/transition-lab/PhaseOnePreview";

export function CinematicLanding() {
  return (
    <>
      <CinematicJourney />
      <EditorialBridge />
      <AudienceSolutions />
      <JourneyMilestones />
    </>
  );
}
