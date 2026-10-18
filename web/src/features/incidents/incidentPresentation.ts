export function formatIncidentWhen(value: string | null): string {
  if (!value) return "Chưa có";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có";
  const parts = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  const clock = `${read("hour")}:${read("minute")}`;
  const day = `${read("day")}/${read("month")}/${read("year")}`;
  if (clock === ":" || day === "//") return "Chưa có";
  return `${clock}, ${day}`;
}

export function timelineStatusText(event: {
  action: string;
  statusBeforeLabel: string;
  statusAfterLabel: string;
}): string {
  if (event.action === "CREATED") return `Trạng thái ban đầu: ${event.statusAfterLabel}`;
  if (event.statusBeforeLabel === event.statusAfterLabel) return `Giữ trạng thái ${event.statusAfterLabel}`;
  return `${event.statusBeforeLabel} → ${event.statusAfterLabel}`;
}
