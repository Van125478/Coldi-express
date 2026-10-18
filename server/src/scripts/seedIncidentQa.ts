import "dotenv/config";
import mongoose from "mongoose";
import { hashPassword } from "../auth/password.js";
import {
  acknowledgeIncident,
  createIncident,
  objectToResolution,
  resolveIncident,
  startInvestigation,
} from "../incidents/service.js";
import { Shipment } from "../models/shipment.js";
import { User } from "../models/user.js";
import { Vehicle } from "../models/vehicle.js";

const databaseName = "coldi_incident_qa_20261018";
const uri = process.env.MONGODB_URI ?? "";
const password = process.env.INCIDENT_QA_PASSWORD ?? "";

if (!uri.includes(`/${databaseName}`) || uri.includes("/coldi?") || uri.endsWith("/coldi")) {
  throw new Error("Refusing to seed because MONGODB_URI is not the incident QA database.");
}
if (password.length < 12) throw new Error("INCIDENT_QA_PASSWORD is required.");

await mongoose.connect(uri);
if (mongoose.connection.name !== databaseName) {
  throw new Error(`Refusing to seed database ${mongoose.connection.name}.`);
}
await mongoose.connection.dropDatabase();

const passwordHash = await hashPassword(password);
const shipper = await User.create({ email: "shipper.incident.qa@coldi.local", passwordHash, role: "SHIPPER", displayName: "Chủ hàng QA" });
const carrier = await User.create({ email: "carrier.incident.qa@coldi.local", passwordHash, role: "CARRIER", displayName: "Nhà xe QA" });
const driver = await User.create({
  email: "driver.incident.qa@coldi.local",
  passwordHash,
  role: "DRIVER",
  carrierId: carrier._id,
  displayName: "Tài xế QA",
  mustChangePassword: false,
});
await User.create({ email: "outsider.incident.qa@coldi.local", passwordHash, role: "SHIPPER", displayName: "Chủ hàng ngoài phạm vi" });
const vehicle = await Vehicle.create({
  carrierId: carrier._id,
  label: "Xe lạnh QA",
  plate: "51A-53901",
  vehicleKind: "REEFER_TRUCK",
  temperatureGroup: "FROZEN",
  capacityTon: 5,
  status: "ACTIVE",
  statusChangedAt: new Date(),
});

const active = await Shipment.create({
  shipperId: shipper._id,
  carrierId: carrier._id,
  driverId: driver._id,
  vehicleId: vehicle._id,
  cargoDescription: "Cá hồi đông cho nghiệm thu sự cố",
  pickupLocation: "Cái Bè, Tiền Giang",
  deliveryLocation: "Thủ Đức, TP. Hồ Chí Minh",
  temperatureGroup: "FROZEN",
  vehicleRequirement: "Xe đông lạnh 8 tấn",
  listedPriceVnd: 6200000,
  status: "IN_TRANSIT",
  pickupConfirmedAt: new Date(),
});
await Shipment.create({
  shipperId: shipper._id,
  cargoDescription: "Xoài cát chờ nhà xe nhận",
  pickupLocation: "Cao Lãnh, Đồng Tháp",
  deliveryLocation: "Biên Hòa, Đồng Nai",
  temperatureGroup: "COOL",
  vehicleRequirement: "Xe lạnh 5 tấn",
  listedPriceVnd: 4100000,
  status: "PUBLISHED",
});

const actors = {
  shipper: { id: shipper._id.toString(), role: "SHIPPER" as const },
  carrier: { id: carrier._id.toString(), role: "CARRIER" as const },
  driver: { id: driver._id.toString(), role: "DRIVER" as const },
};
const shipmentId = active._id.toString();
const description = "Nhiệt độ khoang cao hơn ngưỡng đã thống nhất trên lệnh điều xe.";

const open = await createIncident(
  actors.shipper,
  { shipmentId, incidentType: "TEMPERATURE_ISSUE", title: "Nhiệt độ khoang tăng", description, occurredAt: null, idempotencyKey: "qa-open-incident-20261018" },
  "qa-open",
);
const acknowledged = await createIncident(
  actors.shipper,
  { shipmentId, incidentType: "DELAY", title: "Chậm tại điểm lấy", description, occurredAt: null, idempotencyKey: "qa-ack-incident-20261018" },
  "qa-ack",
);
await acknowledgeIncident(actors.carrier, acknowledged.incident.id, acknowledged.incident.version, "qa-ack-transition-20261018", "qa-ack");
const started = await createIncident(
  actors.carrier,
  { shipmentId, incidentType: "VEHICLE_ISSUE", title: "Máy lạnh giảm công suất", description, occurredAt: null, idempotencyKey: "qa-progress-incident-20261018" },
  "qa-progress",
);
const startedAck = await acknowledgeIncident(actors.carrier, started.incident.id, started.incident.version, "qa-progress-ack-20261018", "qa-progress");
await startInvestigation(actors.carrier, started.incident.id, startedAck.version, "qa-progress-start-20261018", "qa-progress", "Đã kiểm tra máy lạnh và gioăng cửa.");
const resolved = await createIncident(
  actors.shipper,
  { shipmentId, incidentType: "CARGO_ISSUE", title: "Thùng ngoài móp méo", description, occurredAt: null, idempotencyKey: "qa-resolved-incident-20261018" },
  "qa-resolved",
);
const resolvedAck = await acknowledgeIncident(actors.carrier, resolved.incident.id, resolved.incident.version, "qa-resolved-ack-20261018", "qa-resolved");
const resolvedStart = await startInvestigation(actors.carrier, resolved.incident.id, resolvedAck.version, "qa-resolved-start-20261018", "qa-resolved", "Đã chụp hiện trạng thùng tại kho.");
await resolveIncident(actors.carrier, resolved.incident.id, resolvedStart.version, "qa-resolved-done-20261018", "qa-resolved", "Đã thay thùng và niêm phong lại trước khi đi tiếp.");
const objected = await createIncident(
  actors.driver,
  { shipmentId, incidentType: "PICKUP_DELIVERY_ISSUE", title: "Điểm giao đóng cửa sớm", description, occurredAt: null, idempotencyKey: "qa-object-incident-20261018" },
  "qa-object",
);
const objectedAck = await acknowledgeIncident(actors.carrier, objected.incident.id, objected.incident.version, "qa-object-ack-20261018", "qa-object");
const objectedStart = await startInvestigation(actors.carrier, objected.incident.id, objectedAck.version, "qa-object-start-20261018", "qa-object", "Đã liên hệ kho nhận để sắp lại giờ.");
const objectedResolved = await resolveIncident(
  actors.carrier,
  objected.incident.id,
  objectedStart.version,
  "qa-object-resolve-20261018",
  "qa-object",
  "Kho nhận đã mở lại cửa và hàng đã vào bãi.",
);
await objectToResolution(actors.shipper, objected.incident.id, objectedResolved.version, "qa-object-reason-20261018", "qa-object", "Giờ vào bãi vẫn trễ so với lịch giao đã chốt.");

console.log("Incident QA seed ready.");
console.log(`Shipment ${shipmentId}`);
console.log(`Open incident ${open.incident.id}`);
console.log("Credentials were not written to this log.");
await mongoose.disconnect();
