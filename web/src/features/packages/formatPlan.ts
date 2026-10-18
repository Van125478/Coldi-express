export function formatVnd(value: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(value)} VND`;
}

export function formatRate(bps: number): string {
  const percent = bps / 100;
  const text = Number.isInteger(percent) ? String(percent) : percent.toFixed(1).replace(".", ",");
  return `${text}%`;
}

export function formatWhen(value: string | null): string {
  if (!value) return "Không thời hạn";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
