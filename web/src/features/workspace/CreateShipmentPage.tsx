import { PublishShipmentPage } from "@/features/shipments/PublishShipmentPage";
import { useAuth } from "@/features/auth/useAuth";

export function CreateShipmentPage() {
  const { snapshot } = useAuth();
  if (snapshot.status !== "authenticated") return null;
  return <PublishShipmentPage email={snapshot.user.email} />;
}
