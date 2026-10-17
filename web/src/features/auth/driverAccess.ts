import { isRolePath, paths, workspaceHome } from "@/app/paths";
import { chooseDestination, type AccessRole } from "@/features/auth/driverAccountRules";
import type { AuthUser } from "@/models/session";

export {
  accountStatusLabel,
  activationLabel,
  isAssignableDriver,
  needsPasswordChange,
  validateDriverDraft,
  validateReplacementPassword,
} from "@/features/auth/driverAccountRules";

export function destinationAfterLogin(user: Pick<AuthUser, "role" | "mustChangePassword">, nextPath: string | null): string {
  return chooseDestination(user, nextPath, {
    password: paths.driverPassword,
    home: (role: AccessRole) => workspaceHome(role),
    owns: (role: AccessRole, pathname: string) => isRolePath(role, pathname),
  });
}
