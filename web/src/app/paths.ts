import type { BusinessRole } from "@/models/session";

export const paths = {
  home: "/",
  shipments: "/tim-chuyen-hang",
  publish: "/dang-don",
  about: "/ve-chung-toi",
  shipperSolution: "/giai-phap/chu-hang",
  carrierSolution: "/giai-phap/nha-xe",
  login: "/dang-nhap",
  register: "/dang-ky",
  platform: "/nen-tang",
  legacy: "/phien-ban-cu",
  motionLab: "/motion-lab",
  transitionLab: "/transition-lab",
  shipperHome: "/shipper",
  shipperCreate: "/shipper/tao-don",
  shipperShipments: "/shipper/don-hang",
  shipperPlan: "/shipper/goi",
  packages: "/goi-dich-vu",
  carrierHome: "/carrier",
  carrierFind: "/carrier/tim-chuyen",
  carrierTrips: "/carrier/chuyen-cua-toi",
  carrierFleet: "/carrier/doi-xe",
  carrierFleetNew: "/carrier/doi-xe/xe/moi",
  carrierDrivers: "/carrier/doi-xe/tai-xe",
  carrierPlan: "/carrier/goi",
  driverHome: "/driver",
  driverTrips: "/driver/chuyen",
  driverPassword: "/driver/doi-mat-khau",
  adminHome: "/admin",
} as const;

export function carrierVehiclePath(vehicleId: string): string {
  return `${paths.carrierFleet}/xe/${vehicleId}`;
}

export function carrierVehicleEditPath(vehicleId: string): string {
  return `${paths.carrierFleet}/xe/${vehicleId}/sua`;
}

export function carrierDriverPath(driverId: string): string {
  return `${paths.carrierDrivers}/${driverId}`;
}

export function assignmentPath(shipmentId: string): string {
  return `${paths.carrierTrips}#phan-cong-${shipmentId}`;
}

export function workspaceHome(role: BusinessRole): string {
  if (role === "SHIPPER") return paths.shipperHome;
  if (role === "CARRIER") return paths.carrierHome;
  if (role === "DRIVER") return paths.driverHome;
  return paths.adminHome;
}

export function isRolePath(role: BusinessRole, pathname: string): boolean {
  if (role === "SHIPPER") {
    return pathname === paths.publish || pathname === paths.shipperHome || pathname.startsWith(`${paths.shipperHome}/`);
  }
  if (role === "CARRIER") {
    return pathname === paths.shipments || pathname === paths.carrierHome || pathname.startsWith(`${paths.carrierHome}/`);
  }
  if (role === "DRIVER") {
    return pathname === paths.driverHome || pathname.startsWith(`${paths.driverHome}/`);
  }
  return pathname === paths.adminHome || pathname.startsWith(`${paths.adminHome}/`);
}

export type AuthAction = "publish" | "claim" | "account" | "general";

const authActions: readonly AuthAction[] = ["publish", "claim", "account", "general"];

export function parseAuthAction(value: string | null): AuthAction {
  if (value && authActions.includes(value as AuthAction)) {
    return value as AuthAction;
  }
  return "general";
}

export function authPath(action: AuthAction, next?: string) {
  const params = new URLSearchParams();
  if (action !== "general") {
    params.set("action", action);
  }
  if (next) {
    params.set("next", next);
  }
  const query = params.toString();
  return query ? `${paths.login}?${query}` : paths.login;
}
