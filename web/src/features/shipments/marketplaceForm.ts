export const marketplaceSorts = ["newest", "pickup", "price", "weight"] as const;

export type MarketplaceSort = (typeof marketplaceSorts)[number];

export type MarketplaceForm = {
  q: string;
  temperature: "" | "COOL" | "FROZEN" | "DEEP_FROZEN";
  pickup: string;
  delivery: string;
  weightMin: string;
  weightMax: string;
  pickupFrom: string;
  pickupTo: string;
  sort: MarketplaceSort;
};

export const emptyMarketplaceForm: MarketplaceForm = {
  q: "",
  temperature: "",
  pickup: "",
  delivery: "",
  weightMin: "",
  weightMax: "",
  pickupFrom: "",
  pickupTo: "",
  sort: "newest",
};

const temperatures = ["COOL", "FROZEN", "DEEP_FROZEN"] as const;

function text(params: URLSearchParams, key: string): string {
  return (params.get(key) ?? "").trim();
}

export function formFromParams(params: URLSearchParams): MarketplaceForm {
  const temperature = text(params, "temperature");
  const sort = text(params, "sort");
  return {
    q: text(params, "q"),
    temperature: temperatures.includes(temperature as (typeof temperatures)[number]) ? (temperature as MarketplaceForm["temperature"]) : "",
    pickup: text(params, "pickup"),
    delivery: text(params, "delivery"),
    weightMin: text(params, "weightMin"),
    weightMax: text(params, "weightMax"),
    pickupFrom: text(params, "pickupFrom"),
    pickupTo: text(params, "pickupTo"),
    sort: marketplaceSorts.includes(sort as MarketplaceSort) ? (sort as MarketplaceSort) : "newest",
  };
}

function weight(value: string): number | undefined {
  const trimmed = value.trim().replace(",", ".");
  if (!trimmed) return undefined;
  if (!/^\d+(\.\d{1,3})?$/.test(trimmed)) throw new Error("Tải trọng cần là số lớn hơn 0, tối đa 3 chữ số thập phân.");
  const number = Number(trimmed);
  if (!(number > 0) || number > 100_000) throw new Error("Tải trọng cần lớn hơn 0 và không quá 100.000 tấn.");
  return number;
}

const temperatureLabels: Record<MarketplaceForm["temperature"], string> = {
  "": "Tất cả",
  COOL: "Lạnh mát",
  FROZEN: "Đông",
  DEEP_FROZEN: "Cực lạnh",
};

const sortLabels: Record<MarketplaceSort, string> = {
  newest: "Mới đăng",
  pickup: "Thời gian lấy hàng",
  price: "Giá thấp đến cao",
  weight: "Tải trọng nặng đến nhẹ",
};

export function appliedFilterLabels(form: MarketplaceForm): { key: keyof MarketplaceForm; label: string }[] {
  const labels: { key: keyof MarketplaceForm; label: string }[] = [];
  if (form.q) labels.push({ key: "q", label: `Tìm: ${form.q}` });
  if (form.temperature) labels.push({ key: "temperature", label: temperatureLabels[form.temperature] });
  if (form.pickup) labels.push({ key: "pickup", label: `Lấy: ${form.pickup}` });
  if (form.delivery) labels.push({ key: "delivery", label: `Giao: ${form.delivery}` });
  if (form.weightMin || form.weightMax) labels.push({ key: "weightMin", label: `Tải trọng ${form.weightMin || "…"}–${form.weightMax || "…"} tấn` });
  if (form.pickupFrom || form.pickupTo) labels.push({ key: "pickupFrom", label: `Lấy hàng ${form.pickupFrom || "…"} → ${form.pickupTo || "…"}` });
  if (form.sort !== "newest") labels.push({ key: "sort", label: sortLabels[form.sort] });
  return labels;
}

export function searchFromForm(form: MarketplaceForm): string {
  const min = weight(form.weightMin);
  const max = weight(form.weightMax);
  if (min !== undefined && max !== undefined && min > max) {
    throw new Error("Tải trọng từ phải nhỏ hơn hoặc bằng tải trọng đến.");
  }
  if (form.pickupFrom && form.pickupTo && form.pickupFrom > form.pickupTo) {
    throw new Error("Ngày lấy từ phải trước hoặc trùng ngày lấy đến.");
  }

  const params = new URLSearchParams();
  const set = (key: string, value: string) => {
    const trimmed = value.trim();
    if (trimmed) params.set(key, trimmed);
  };
  set("q", form.q);
  set("temperature", form.temperature);
  set("pickup", form.pickup);
  set("delivery", form.delivery);
  if (min !== undefined) params.set("weightMin", String(min));
  if (max !== undefined) params.set("weightMax", String(max));
  set("pickupFrom", form.pickupFrom);
  set("pickupTo", form.pickupTo);
  params.set("sort", form.sort);
  return params.toString();
}
