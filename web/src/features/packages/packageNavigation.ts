import { authPath, paths } from "../../app/paths";
import type { BusinessRole } from "../../models/session";

export type PackageLink = { href: string; label: "Gói dịch vụ" };

export function publicPackageNav(role: BusinessRole | null): PackageLink | null {
  if (role === "DRIVER") return null;
  if (role === "SHIPPER") return { href: paths.shipperPlan, label: "Gói dịch vụ" };
  if (role === "CARRIER") return { href: paths.carrierPlan, label: "Gói dịch vụ" };
  return { href: paths.packages, label: "Gói dịch vụ" };
}

export function packageAwareNext(role: BusinessRole, nextPath: string | null): string | null {
  if (nextPath !== paths.packages) return nextPath;
  if (role === "SHIPPER") return paths.shipperPlan;
  if (role === "CARRIER") return paths.carrierPlan;
  return null;
}

export function catalogPrimaryCta(role: BusinessRole | null): { href: string; label: string } {
  if (role === "SHIPPER") return { href: paths.shipperPlan, label: "Xem gói của tôi" };
  if (role === "CARRIER") return { href: paths.carrierPlan, label: "Xem gói của tôi" };
  if (role === "DRIVER") return { href: paths.driverHome, label: "Về khu tài xế" };
  if (role === "ADMIN") return { href: paths.adminHome, label: "Về khu quản trị" };
  return { href: authPath("general", paths.packages), label: "Đăng nhập để xem gói" };
}
