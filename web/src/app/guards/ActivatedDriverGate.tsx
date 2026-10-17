import { Navigate, Outlet } from "react-router-dom";
import { paths } from "@/app/paths";
import { needsPasswordChange } from "@/features/auth/driverAccess";
import { useAuth } from "@/features/auth/useAuth";

export function ActivatedDriverGate() {
  const { snapshot } = useAuth();
  if (snapshot.status !== "authenticated") return null;
  if (needsPasswordChange(snapshot.user)) return <Navigate to={paths.driverPassword} replace />;
  return <Outlet />;
}
