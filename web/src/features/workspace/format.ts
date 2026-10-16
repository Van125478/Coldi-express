export function money(amount: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(amount)} đ`;
}

export function civil(date: string | null): string {
  if (!date) return "Chưa có";
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return date;
  return `${day}/${month}/${year}`;
}

export function windowText(date: string | null, from: string | null, to: string | null): string {
  if (!date || !from || !to) return "Chưa có";
  return `${civil(date)}, ${from}–${to}`;
}

export function shipmentTone(status: string, vehicleId: string | null, driverId: string | null): "open" | "waiting" | "assigned" | "neutral" {
  if (status === "PUBLISHED") return "open";
  if (status === "MATCHED" && (vehicleId === null || driverId === null)) return "waiting";
  if (status === "MATCHED") return "assigned";
  return "neutral";
}

export const primaryLinkClass =
  "inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-navy px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-navy-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy";
