export const dieselProduct = "DIESEL_005S" as const;
export const dieselProductLabel = "Dầu diesel 0.05S";
export const dieselUnit = "VND/lít" as const;
export const dieselPriceKinds = ["OFFICIAL_CEILING", "RETAIL"] as const;
export type DieselPriceKind = (typeof dieselPriceKinds)[number];

export const dieselPriceKindLabels: Record<DieselPriceKind, string> = {
  OFFICIAL_CEILING: "Giá bán tối đa do Bộ Công Thương công bố",
  RETAIL: "Giá bán lẻ của thương nhân",
};

export const dieselOfficialIndexUrl = "https://minhbach.moit.gov.vn/";
export const dieselOfficialBulletinUrl =
  "https://moit.gov.vn/van-ban-phap-luat/van-ban-dieu-hanh/van-ban-so-8480-bct-tttn-thong-bao-dieu-hanh-gia-ban-xang-dau.html";

export const dieselUnavailableMessage = "Chưa có dữ liệu diesel được xác minh";

export const dieselDisclaimer =
  "Giá diesel trên COLDI chỉ hiển thị sau khi một quản trị xác minh văn bản gốc. Đây không phải giá bơm lẻ, không đổi cước, gói dịch vụ, thù lao tài xế hoặc hoa hồng.";

export const latestKnownDieselDocument = {
  number: "8480/BCT-TTTN",
  announcedOn: "2026-10-15",
  sourceUrl: dieselOfficialBulletinUrl,
  note: "Bộ Công Thương đã đăng thông báo điều hành ngày 15/10/2026. COLDI chưa đọc được mức giá trần từ văn bản gốc nên không hiển thị số.",
} as const;

const officialHosts = new Set(["moit.gov.vn", "www.moit.gov.vn", "minhbach.moit.gov.vn"]);

export function officialDieselSourceUrl(value: string): string | null {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:") return null;
    if (!officialHosts.has(parsed.hostname.toLowerCase())) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}
