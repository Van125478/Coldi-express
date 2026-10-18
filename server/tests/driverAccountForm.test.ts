import assert from "node:assert/strict";
import test from "node:test";
import { chooseDestination, driverDraftErrors, isAssignableDriver, needsPasswordChange, validateReplacementPassword } from "../../web/src/features/auth/driverAccountRules.ts";
import { vehicleFieldErrors } from "../../web/src/features/workspace/carrier/fleet/vehicleFieldRules.ts";
import { shipmentStepErrors, type ShipmentFieldValues } from "../../web/src/features/shipments/shipmentFieldRules.ts";
import { assignmentDetail } from "../src/shipments/shipmentEvents.ts";
import { readVehicleInput } from "../src/fleet/vehicleInput.ts";
import { operatingVehicleText } from "../../web/src/features/packages/planPresentation.ts";

const emptyShipment = {
  pickupCompany: "",
  pickupLocation: "",
  pickupContactName: "",
  pickupPhone: "",
  pickupEmail: "",
  pickupDate: "",
  pickupTimeFrom: "",
  pickupTimeTo: "",
  deliveryCompany: "",
  deliveryLocation: "",
  deliveryContactName: "",
  deliveryPhone: "",
  deliveryEmail: "",
  deliveryDate: "",
  deliveryTimeFrom: "",
  deliveryTimeTo: "",
  cargoDescription: "",
  temperatureGroup: "",
  cargoWeightTon: "",
  cargoVolumeM3: "",
  packageCount: "",
  vehicleRequirement: "",
  listedPriceVnd: "",
} satisfies ShipmentFieldValues;

test("driver creation reports every invalid field and accepts a username password pair", () => {
  const blank = driverDraftErrors({ displayName: "", username: "", password: "short", confirmPassword: "other" });
  assert.equal(blank.displayName, "Tên hiển thị cần từ 1 đến 80 ký tự.");
  assert.equal(typeof blank.username, "string");
  assert.equal(blank.password, "Mật khẩu cần từ 8 đến 72 ký tự.");
  assert.equal(blank.confirmPassword, "Mật khẩu nhập lại chưa khớp.");
  const corrected = driverDraftErrors({ displayName: "Tài xế", username: "TaiXe.01", password: "long-enough", confirmPassword: "long-enough" });
  assert.deepEqual(corrected, {});
});

test("a legacy temporary-password driver is still sent to the change screen", () => {
  const user = { role: "DRIVER" as const, mustChangePassword: true };
  const paths = {
    password: "/driver/doi-mat-khau",
    home: (role: "SHIPPER" | "CARRIER" | "DRIVER" | "ADMIN") => (role === "CARRIER" ? "/carrier" : "/driver"),
    owns: () => true,
  };
  assert.equal(needsPasswordChange(user), true);
  assert.equal(chooseDestination(user, "/driver/chuyen", paths), "/driver/doi-mat-khau");
  assert.equal(needsPasswordChange({ role: "DRIVER", mustChangePassword: false }), false);
  assert.equal(chooseDestination({ role: "CARRIER", mustChangePassword: false }, null, paths), "/carrier");
  assert.equal(isAssignableDriver({ accountStatus: "LOCKED", mustChangePassword: false }), false);
  assert.equal(isAssignableDriver({ mustChangePassword: true }), false);
  assert.equal(isAssignableDriver({}), true);
  assert.equal(validateReplacementPassword("short"), "Mật khẩu cần từ 8 đến 72 ký tự.");
  assert.equal(validateReplacementPassword("long-enough"), null);
});

test("vehicle form and server collect every blank field, then clear a corrected value", () => {
  const blank = vehicleFieldErrors({ label: "", plate: "", vehicleKind: "", temperatureGroup: "", capacityTon: "" });
  assert.equal(Object.keys(blank).length, 5);
  const corrected = vehicleFieldErrors({ label: "Xe lạnh", plate: "51C-100.01", vehicleKind: "REEFER_TRUCK", temperatureGroup: "FROZEN", capacityTon: "8.5" });
  assert.deepEqual(corrected, {});
  try {
    readVehicleInput({});
    assert.fail("empty vehicle input should fail");
  } catch (error) {
    const fields = (error as { fields?: Record<string, string> }).fields ?? {};
    assert.equal(Object.keys(fields).sort().join(","), "capacityTon,label,plate,temperatureGroup,vehicleKind");
  }
});

test("shipment step validation stays on the current step and requires one to five images", () => {
  const stepOne = shipmentStepErrors(emptyShipment, 1, 0);
  assert.equal(stepOne.cargoDescription, undefined);
  assert.equal(stepOne.pickupTimeFrom, "Chọn giờ bắt đầu bốc hàng.");
  assert.equal(stepOne.pickupTimeTo, "Chọn giờ kết thúc bốc hàng.");
  assert.equal(typeof stepOne.pickupCompany, "string");
  const reversed = shipmentStepErrors({ ...emptyShipment, pickupTimeFrom: "18:00", pickupTimeTo: "08:00" }, 1, 0);
  assert.equal(reversed.pickupTimeFrom, undefined);
  assert.equal(reversed.pickupTimeTo, "Giờ kết thúc bốc hàng phải muộn hơn giờ bắt đầu.");
  const stepTwo = shipmentStepErrors(emptyShipment, 2, 0);
  assert.equal(stepTwo.pickupCompany, undefined);
  assert.equal(stepTwo.deliveryTimeFrom, "Chọn giờ bắt đầu nhận hàng.");
  const stepThree = shipmentStepErrors({ ...emptyShipment, cargoDescription: "Hàng", temperatureGroup: "FROZEN", cargoWeightTon: "1", cargoVolumeM3: "2", packageCount: "3", vehicleRequirement: "Xe lạnh", listedPriceVnd: "1000" }, 3, 0);
  assert.equal(stepThree.cargoImages, "Thêm ít nhất 1 ảnh hàng hóa.");
  assert.equal(shipmentStepErrors(emptyShipment, 3, 6).cargoImages, "Chỉ được tối đa 5 ảnh hàng hóa.");
  const fixed = shipmentStepErrors({ ...emptyShipment, cargoDescription: "Hàng", temperatureGroup: "FROZEN", cargoWeightTon: "1", cargoVolumeM3: "2", packageCount: "3", vehicleRequirement: "Xe lạnh", listedPriceVnd: "1000" }, 3, 1);
  assert.equal(fixed.cargoImages, undefined);
});

test("timeline labels do not repeat a prefix that is already stored", () => {
  assert.equal(assignmentDetail("Xe đông lạnh kiểm tra", "Tài xế kiểm tra"), "Xe đông lạnh kiểm tra. Tài xế kiểm tra.");
  assert.equal(assignmentDetail("xe đông lạnh", "tài xế COLDI"), "xe đông lạnh. tài xế COLDI.");
  assert.equal(assignmentDetail("Đông lạnh 01", "COLDI"), "Xe Đông lạnh 01. Tài xế COLDI.");
  assert.equal(assignmentDetail(null, ""), "Xe đã phân công. Tài xế đã phân công.");
});

test("fleet capacity text uses the server cap and never says unlimited", () => {
  assert.equal(operatingVehicleText(1, 2), "1/2 xe đang hoạt động");
  assert.equal(operatingVehicleText(1, 10), "1/10 xe đang hoạt động");
  assert.equal(operatingVehicleText(4, null), "4 xe đang hoạt động · trần theo hợp đồng");
  assert.equal(operatingVehicleText(4, null).includes("Không giới hạn"), false);
});
