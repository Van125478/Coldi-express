export function canonicalPositiveDecimal(raw: string): string | null {
  const trimmed = raw.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;
  const [whole = "0", fraction = ""] = trimmed.split(".");
  const wholeNormalized = whole.replace(/^0+(?=\d)/, "");
  const fractionNormalized = fraction.replace(/0+$/, "");
  if (wholeNormalized === "0" && fractionNormalized === "") return null;
  if (fractionNormalized === "") return wholeNormalized;
  return `${wholeNormalized}.${fractionNormalized}`;
}

export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (year === undefined || month === undefined || day === undefined) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function addIsoDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, (day ?? 1) + days));
  return date.toISOString().slice(0, 10);
}

export function redactSecrets(message: string, secrets: readonly string[]): string {
  let output = message;
  for (const secret of secrets) {
    if (secret.length < 4) continue;
    output = output.split(secret).join("[redacted]");
  }
  return output.slice(0, 200);
}
