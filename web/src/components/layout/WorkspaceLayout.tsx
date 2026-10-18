import type { LucideIcon } from "lucide-react";
import { AlertTriangle, ClipboardList, Container, Layers, LayoutDashboard, PackagePlus, Receipt, Route, Search, Truck, Users } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { paths } from "@/app/paths";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/features/auth/useAuth";
import { logoDestination } from "@/features/workspace/logoDestination";
import type { BusinessRole } from "@/models/session";
import { cn } from "@/lib/cn";

const roleLabels: Record<BusinessRole, string> = {
  SHIPPER: "Chủ hàng",
  CARRIER: "Nhà xe",
  DRIVER: "Tài xế",
  ADMIN: "Quản trị",
};

const navigation: Record<BusinessRole, readonly { to: string; label: string; icon: LucideIcon }[]> = {
  SHIPPER: [
    { to: paths.shipperHome, label: "Trang chủ", icon: LayoutDashboard },
    { to: paths.shipperCreate, label: "Tạo đơn", icon: PackagePlus },
    { to: paths.shipperShipments, label: "Quản lý đơn", icon: ClipboardList },
    { to: paths.shipperIncidents, label: "Sự cố", icon: AlertTriangle },
    { to: paths.shipperCommission, label: "Hoa hồng", icon: Receipt },
    { to: paths.shipperPlan, label: "Gói dịch vụ", icon: Layers },
  ],
  CARRIER: [
    { to: paths.carrierHome, label: "Sàn chuyến", icon: LayoutDashboard },
    { to: paths.carrierFind, label: "Tìm chuyến", icon: Search },
    { to: paths.carrierTrips, label: "Chuyến của tôi", icon: Route },
    { to: paths.carrierIncidents, label: "Sự cố", icon: AlertTriangle },
    { to: paths.carrierCommission, label: "Hoa hồng", icon: Receipt },
    { to: paths.carrierFleet, label: "Đội xe", icon: Container },
    { to: paths.carrierDrivers, label: "Tài xế", icon: Users },
    { to: paths.carrierPlan, label: "Gói dịch vụ", icon: Layers },
  ],
  DRIVER: [
    { to: paths.driverHome, label: "Trang chủ", icon: Truck },
    { to: paths.driverTrips, label: "Chuyến của tôi", icon: Route },
    { to: paths.driverIncidents, label: "Sự cố", icon: AlertTriangle },
  ],
  ADMIN: [{ to: paths.adminHome, label: "Khu quản trị", icon: LayoutDashboard }],
};

export function WorkspaceLayout() {
  const { snapshot, logout } = useAuth();
  if (snapshot.status !== "authenticated") return null;
  const role = snapshot.user.role;
  const items = navigation[role];
  const carrier = role === "CARRIER";
  const home = logoDestination(role);

  return (
    <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)]">
      <a
        href="#khu-lam-viec"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-navy"
      >
        Đi tới nội dung
      </a>
      <aside className={cn("hidden border-r lg:sticky lg:top-0 lg:flex lg:h-dvh lg:max-h-dvh lg:flex-col lg:self-start lg:overflow-hidden", carrier ? "border-navy-deep bg-navy text-white" : "border-line bg-surface")}>
        <div className={cn("shrink-0 border-b px-5 py-5", carrier ? "border-white/15" : "border-line")}>
          <Logo to={home} tone={carrier ? "inverse" : "default"} mark={carrier ? "light" : "brand"} />
          <p className={cn("mt-4 text-xs font-semibold tracking-[0.14em]", carrier ? "text-white/80" : "text-navy")}>{roleLabels[role].toUpperCase()}</p>
        </div>
        <nav aria-label="Khu làm việc" className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          {items.map((item) => (
            <WorkspaceLink key={item.to} to={item.to} label={item.label} icon={item.icon} carrier={carrier} />
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 border-b border-line bg-surface">
          <div className="flex min-h-16 flex-wrap items-center gap-3 px-4 sm:px-6 lg:px-8">
            <div className="lg:hidden">
              <Logo to={home} />
            </div>
            <nav aria-label="Khu làm việc" className="flex min-w-0 gap-1 overflow-x-auto lg:hidden">
              {items.map((item) => (
                <WorkspaceLink key={item.to} to={item.to} label={item.label} icon={item.icon} compact />
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-3">
              <p className="hidden text-right sm:block">
                <span className="block text-sm font-semibold text-ink">{snapshot.user.email}</span>
                <span className="block text-xs text-muted">{roleLabels[role]}</span>
              </p>
              <Button type="button" variant="outline" onClick={() => void logout()}>
                Đăng xuất
              </Button>
            </div>
          </div>
        </header>
        <main id="khu-lam-viec" tabIndex={-1} className="min-w-0 flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function WorkspaceLink({ to, label, icon: Icon, compact = false, carrier = false }: { to: string; label: string; icon: LucideIcon; compact?: boolean; carrier?: boolean }) {
  return (
    <NavLink
      to={to}
      end={to === paths.shipperHome || to === paths.carrierHome || to === paths.driverHome || to === paths.adminHome || to === paths.carrierFleet}
      className={({ isActive }) =>
        cn(
          "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy",
          compact ? "shrink-0" : "w-full",
          carrier && !compact
            ? isActive
              ? "bg-white text-navy"
              : "text-white hover:bg-white/10"
            : isActive
              ? "bg-navy text-white"
              : "text-ink hover:bg-canvas",
        )
      }
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {label}
    </NavLink>
  );
}
