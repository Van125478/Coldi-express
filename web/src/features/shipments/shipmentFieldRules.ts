export type ShipmentFieldName =
  | "pickupCompany"
  | "pickupLocation"
  | "pickupContactName"
  | "pickupPhone"
  | "pickupEmail"
  | "pickupDate"
  | "pickupTimeFrom"
  | "pickupTimeTo"
  | "deliveryCompany"
  | "deliveryLocation"
  | "deliveryContactName"
  | "deliveryPhone"
  | "deliveryEmail"
  | "deliveryDate"
  | "deliveryTimeFrom"
  | "deliveryTimeTo"
  | "cargoDescription"
  | "temperatureGroup"
  | "cargoWeightTon"
  | "cargoVolumeM3"
  | "packageCount"
  | "vehicleRequirement"
  | "listedPriceVnd"
  | "cargoImages";

export type ShipmentFieldValues = Record<Exclude<ShipmentFieldName, "cargoImages">, string>;

export const shipmentStepFields: Record<1 | 2 | 3, readonly ShipmentFieldName[]> = {
  1: ["pickupCompany", "pickupLocation", "pickupContactName", "pickupPhone", "pickupEmail", "pickupDate", "pickupTimeFrom", "pickupTimeTo"],
  2: ["deliveryCompany", "deliveryLocation", "deliveryContactName", "deliveryPhone", "deliveryEmail", "deliveryDate", "deliveryTimeFrom", "deliveryTimeTo"],
  3: ["cargoDescription", "temperatureGroup", "cargoWeightTon", "cargoVolumeM3", "packageCount", "vehicleRequirement", "listedPriceVnd", "cargoImages"],
};

export function shipmentFieldErrors(form: ShipmentFieldValues, cargoImageCount = 0): Partial<Record<ShipmentFieldName, string>> {
  const errors: Partial<Record<ShipmentFieldName, string>> = {};
  if (form.pickupCompany.trim().length === 0) errors.pickupCompany = "Nhập tên công ty hoặc kho gửi.";
  if (form.pickupLocation.trim().length === 0) errors.pickupLocation = "Nhập địa chỉ lấy hàng.";
  if (form.pickupContactName.trim().length === 0) errors.pickupContactName = "Nhập người bốc hàng.";
  if (!phoneOk(form.pickupPhone)) errors.pickupPhone = "Nhập số điện thoại lấy hàng.";
  if (!optionalEmail(form.pickupEmail)) errors.pickupEmail = "Email nhận thông báo chưa hợp lệ.";
  if (form.pickupDate === "") errors.pickupDate = "Chọn ngày lấy hàng.";
  assignTimeWindow(errors, form.pickupTimeFrom, form.pickupTimeTo, "pickupTimeFrom", "pickupTimeTo", "bốc hàng");
  if (form.deliveryCompany.trim().length === 0) errors.deliveryCompany = "Nhập tên công ty hoặc kho nhận.";
  if (form.deliveryLocation.trim().length === 0) errors.deliveryLocation = "Nhập địa chỉ giao hàng.";
  if (form.deliveryContactName.trim().length === 0) errors.deliveryContactName = "Nhập người nhận hàng.";
  if (!phoneOk(form.deliveryPhone)) errors.deliveryPhone = "Nhập số điện thoại giao hàng.";
  if (!optionalEmail(form.deliveryEmail)) errors.deliveryEmail = "Email kho nhận chưa hợp lệ.";
  if (form.deliveryDate === "") errors.deliveryDate = "Chọn ngày giao hàng.";
  if (form.pickupDate !== "" && form.deliveryDate !== "" && form.deliveryDate < form.pickupDate) {
    errors.deliveryDate = "Ngày giao muộn nhất không được trước ngày lấy hàng.";
  }
  assignTimeWindow(errors, form.deliveryTimeFrom, form.deliveryTimeTo, "deliveryTimeFrom", "deliveryTimeTo", "nhận hàng");
  if (form.cargoDescription.trim().length === 0) errors.cargoDescription = "Nhập mô tả hàng hóa.";
  if (form.temperatureGroup === "") errors.temperatureGroup = "Chọn nhóm nhiệt.";
  if (!measureOk(form.cargoWeightTon)) errors.cargoWeightTon = "Nhập trọng lượng bằng tấn, lớn hơn 0.";
  if (!measureOk(form.cargoVolumeM3)) errors.cargoVolumeM3 = "Nhập thể tích bằng mét khối, lớn hơn 0.";
  if (!/^[1-9]\d*$/.test(form.packageCount) || Number(form.packageCount) > 1000000) {
    errors.packageCount = "Nhập số thùng bằng số nguyên, lớn hơn 0.";
  }
  if (form.vehicleRequirement.trim().length === 0) errors.vehicleRequirement = "Nhập yêu cầu xe.";
  if (!/^[1-9]\d*$/.test(form.listedPriceVnd)) errors.listedPriceVnd = "Nhập giá cước bằng số nguyên đồng, lớn hơn 0.";
  if (cargoImageCount < 1) errors.cargoImages = "Thêm ít nhất 1 ảnh hàng hóa.";
  if (cargoImageCount > 5) errors.cargoImages = "Chỉ được tối đa 5 ảnh hàng hóa.";
  return errors;
}

export function shipmentStepErrors(form: ShipmentFieldValues, step: 1 | 2 | 3, cargoImageCount = 0): Partial<Record<ShipmentFieldName, string>> {
  const names = new Set<ShipmentFieldName>(shipmentStepFields[step]);
  if (step === 2) names.add("deliveryDate");
  return Object.fromEntries(Object.entries(shipmentFieldErrors(form, cargoImageCount)).filter(([name]) => names.has(name as ShipmentFieldName))) as Partial<
    Record<ShipmentFieldName, string>
  >;
}

function assignTimeWindow(
  errors: Partial<Record<ShipmentFieldName, string>>,
  from: string,
  to: string,
  fromKey: ShipmentFieldName,
  toKey: ShipmentFieldName,
  action: string,
) {
  const fromOk = /^([01]\d|2[0-3]):[0-5]\d$/.test(from);
  const toOk = /^([01]\d|2[0-3]):[0-5]\d$/.test(to);
  if (from.trim() === "") errors[fromKey] = `Chọn giờ bắt đầu ${action}.`;
  else if (!fromOk) errors[fromKey] = `Giờ bắt đầu ${action} chưa hợp lệ.`;
  if (to.trim() === "") errors[toKey] = `Chọn giờ kết thúc ${action}.`;
  else if (!toOk) errors[toKey] = `Giờ kết thúc ${action} chưa hợp lệ.`;
  if (fromOk && toOk && from >= to) errors[toKey] = `Giờ kết thúc ${action} phải muộn hơn giờ bắt đầu.`;
}

function digits(value: string): string {
  return value.replace(/\D/g, "");
}

function optionalEmail(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length === 0) return true;
  return trimmed.length <= 160 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

function phoneOk(value: string): boolean {
  const count = digits(value).length;
  return value.trim().length >= 8 && value.trim().length <= 20 && count >= 8 && count <= 15;
}

function measureOk(value: string): boolean {
  const normalized = value.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,3})?$/.test(normalized)) return false;
  const number = Number(normalized);
  return number > 0 && number <= 100000;
}
