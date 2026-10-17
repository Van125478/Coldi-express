import { Link } from "react-router-dom";
import { paths } from "@/app/paths";

export function FleetNav({ current }: { current: "vehicles" | "drivers" }) {
  const item = (active: boolean) =>
    `inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold ${active ? "bg-navy text-white" : "border border-line text-ink"}`;
  return (
    <div className="flex flex-wrap gap-2">
      <Link to={paths.carrierFleet} className={item(current === "vehicles")}>
        Xe
      </Link>
      <Link to={paths.carrierDrivers} className={item(current === "drivers")}>
        Tài xế
      </Link>
    </div>
  );
}

export const fieldClass = "flex h-12 w-full rounded-xl border border-line bg-surface px-3 text-base text-ink";
