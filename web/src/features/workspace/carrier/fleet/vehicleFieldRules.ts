export type VehicleDraft = {
  label: string;
  plate: string;
  vehicleKind: string;
  temperatureGroup: string;
  capacityTon: string;
};

const kinds = new Set(["REEFER_TRUCK", "REEFER_CONTAINER", "REEFER_VAN"]);
const temperatures = new Set(["COOL", "FROZEN", "DEEP_FROZEN"]);

export function vehicleFieldErrors(draft: VehicleDraft): Partial<Record<keyof VehicleDraft, string>> {
  const errors: Partial<Record<keyof VehicleDraft, string>> = {};
  const label = draft.label.trim();
  if (label.length < 1 || label.length > 160) errors.label = "Tên xe cần từ 1 đến 160 ký tự.";
  const plate = draft.plate.trim();
  if (plate.length < 2 || plate.length > 20) errors.plate = "Biển số cần từ 2 đến 20 ký tự.";
  else if (!/^[\p{L}\p{N}][\p{L}\p{N} ./-]*$/u.test(plate)) {
    errors.plate = "Biển số chỉ gồm chữ, số, khoảng trắng, dấu chấm, gạch hoặc gạch chéo.";
  }
  if (!kinds.has(draft.vehicleKind)) errors.vehicleKind = "Loại phương tiện không hợp lệ.";
  if (!temperatures.has(draft.temperatureGroup)) errors.temperatureGroup = "Nhóm nhiệt độ không hợp lệ.";
  const capacity = Number(draft.capacityTon.trim().replace(",", "."));
  if (!Number.isFinite(capacity) || capacity <= 0 || capacity > 100) {
    errors.capacityTon = "Tải trọng phải lớn hơn 0 và không quá 100 tấn.";
  } else {
    const thousandths = Math.round(capacity * 1000);
    if (Math.abs(capacity * 1000 - thousandths) > 1e-6) errors.capacityTon = "Tải trọng chỉ được tối đa 3 chữ số thập phân.";
  }
  return errors;
}

export const vehicleFieldOrder: (keyof VehicleDraft)[] = ["label", "plate", "vehicleKind", "temperatureGroup", "capacityTon"];
