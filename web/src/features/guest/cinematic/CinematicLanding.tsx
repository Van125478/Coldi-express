import { AudienceSolutions } from "@/features/guest/home/AudienceSolutions";
import { EditorialBridge } from "@/features/guest/home/EditorialBridge";
import { FinalCTA } from "@/features/guest/home/FinalCTA";
import { GuestFAQ } from "@/features/guest/home/GuestFAQ";
import { JourneyMilestones } from "@/features/guest/home/JourneyMilestones";
import { OperatingPrinciples } from "@/features/guest/home/OperatingPrinciples";
import { PilotFocus } from "@/features/guest/home/PilotFocus";
import { WorldOilPriceWidget } from "@/features/market/WorldOilPriceWidget";
import { CinematicJourney } from "@/features/transition-lab/PhaseOnePreview";

export function CinematicLanding() {
  return (
    <>
      <CinematicJourney />
      <EditorialBridge />
      <AudienceSolutions />
      <JourneyMilestones />
      <OperatingPrinciples />
      <PilotFocus />
      <WorldOilPriceWidget variant="landing" />
      <GuestFAQ />
      <FinalCTA />
    </>
  );
}
