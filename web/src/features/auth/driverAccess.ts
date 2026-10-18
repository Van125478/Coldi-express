import { isRolePath, paths, workspaceHome } from "../../app/paths";
import { chooseDestination, type AccessRole } from "./driverAccountRules";
import { packageAwareNext } from "../packages/packageNavigation";
import type { AuthUser } from "../../models/session";

export {
  accountStatusLabel,
  activationLabel,
  isAssignableDriver,
  needsPasswordChange,
  driverDraftErrors,
  validateReplacementPassword,
} from "./driverAccountRules";

export function destinationAfterLogin(user: Pick<AuthUser, "role" | "mustChangePassword">, nextPath: string | null): string {
  return chooseDestination(user, packageAwareNext(user.role, nextPath), {
    password: paths.driverPassword,
    home: (role: AccessRole) => workspaceHome(role),
    owns: (role: AccessRole, pathname: string) => isRolePath(role, pathname),
  });
}
