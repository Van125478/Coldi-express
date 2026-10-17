export function cargoMeasures(weightTon: number | null, volumeM3: number | null, packageCount: number | null): string {
  const present: string[] = [];
  const missing: string[] = [];
  if (weightTon === null) missing.push("khối lượng");
  else present.push(`${weightTon} tấn`);
  if (volumeM3 === null) missing.push("thể tích");
  else present.push(`${volumeM3} m³`);
  if (packageCount === null) missing.push("số kiện");
  else present.push(`${packageCount} thùng`);
  if (missing.length === 3) return "Chưa cập nhật khối lượng, thể tích và số kiện.";
  if (missing.length === 0) return present.join(" · ");
  const gap = missing.length === 2 ? `Chưa cập nhật ${missing[0]} và ${missing[1]}.` : `Chưa cập nhật ${missing[0]}.`;
  return `${present.join(" · ")}. ${gap}`;
}

export function assignedDriverLine(name: string | null): string {
  const value = name?.trim() ?? "";
  if (!value) return "Tài xế đã phân công";
  const folded = value.toLocaleLowerCase("vi");
  if (folded === "tài xế" || folded.startsWith("tài xế ")) return value;
  return `Tài xế ${value}`;
}

export function stopFacts(schedule: string, contactValue: string): { schedule: string | null; contact: string | null; gap: string | null } {
  const missingSchedule = schedule === "Chưa có";
  const missingContact = contactValue === "Chưa có";
  if (missingSchedule && missingContact) return { schedule: null, contact: null, gap: "Chưa cập nhật lịch và liên hệ." };
  if (missingSchedule) return { schedule: null, contact: contactValue, gap: "Chưa cập nhật lịch." };
  if (missingContact) return { schedule, contact: null, gap: "Chưa cập nhật liên hệ." };
  return { schedule, contact: contactValue, gap: null };
}
