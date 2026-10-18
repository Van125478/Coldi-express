import { withRequiredCargoImage } from "./support/cargoImage.js";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import test, { before, after } from "node:test";
import mongoose from "mongoose";
import { hashPassword } from "../src/auth/password.js";
import { AuditLog } from "../src/models/auditLog.js";
import { Shipment } from "../src/models/shipment.js";
import { User } from "../src/models/user.js";

process.env.PORT ??= "4000";
process.env.FRONTEND_ORIGIN ??= "http://127.0.0.1:5173";
process.env.NODE_ENV = "test";
process.env.AUTH_SECRET ??= "test-secret-that-is-at-least-32-characters";

const sourceUri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/coldi";
const testUri = new URL(sourceUri);
testUri.pathname = "/coldi_security_test";
process.env.MONGODB_URI = testUri.toString();

const { createApp } = await import("../src/app.js");

const password = "test-password-123";
const shipperEmail = "shipper.security-test@coldi.local";
const otherShipperEmail = "other-shipper.security-test@coldi.local";
const carrierEmail = "carrier.security-test@coldi.local";
const otherCarrierEmail = "other-carrier.security-test@coldi.local";
const driverEmail = "driver.security-test@coldi.local";
const otherDriverEmail = "other-driver.security-test@coldi.local";
const adminEmail = "admin.security-test@coldi.local";
const privateEmail = "rieng-email-c12@coldi.local";
const privateChat = "TIN-RIENG-C12 hàng kín";

type Json = Record<string, unknown>;

const order = {
  cargoDescription: "Hàng kiểm tra phân quyền",
  pickupLocation: "Cái Bè, Tiền Giang",
  deliveryLocation: "Thủ Đức, TP. Hồ Chí Minh",
  temperatureGroup: "FROZEN",
  vehicleRequirement: "Xe đông lạnh 8 tấn",
  listedPriceVnd: 6200000,
  pickupCompany: "Kho kiểm tra",
  pickupContactName: "Người lấy",
  pickupPhone: "0908123456",
  pickupEmail: privateEmail,
  pickupDate: "2026-10-22",
  pickupTimeFrom: "08:00",
  pickupTimeTo: "11:30",
  deliveryCompany: "Kho giao",
  deliveryContactName: "Người nhận",
  deliveryPhone: "0912889999",
  deliveryDate: "2026-10-23",
  deliveryTimeFrom: "14:00",
  deliveryTimeTo: "18:00",
  cargoWeightTon: 2.5,
  cargoVolumeM3: 4,
  packageCount: 12,
};

const vehicleBody = {
  label: "Xe lạnh bảo mật",
  plate: "51C-909.12",
  vehicleKind: "REEFER_TRUCK",
  temperatureGroup: "FROZEN",
  capacityTon: 8.5,
};

async function withServer(run: (baseUrl: string) => Promise<void>) {
  const server = createServer(createApp());
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("Test server did not bind.");
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    server.close();
    await once(server, "close");
  }
}

async function login(baseUrl: string, email: string): Promise<string> {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173" },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(response.status, 200);
  const cookie = response.headers.getSetCookie().find((value) => value.startsWith("coldi_session="));
  assert.ok(cookie);
  return cookie.split(";")[0] ?? "";
}

function headers(cookie?: string, extra?: Record<string, string>) {
  return {
    "content-type": "application/json",
    origin: "http://127.0.0.1:5173",
    ...(cookie ? { cookie } : {}),
    ...extra,
  };
}

async function publish(baseUrl: string, cookie: string) {
  const response = await fetch(`${baseUrl}/api/shipments`, {
    method: "POST",
    headers: headers(cookie, { "x-request-id": "security-publish-1" }),
    body: JSON.stringify(await withRequiredCargoImage(baseUrl, cookie, order)),
  });
  assert.equal(response.status, 201);
  const body = (await response.json()) as { shipment: Json };
  assert.equal("audit" in body, false);
  assert.equal(JSON.stringify(body).includes("passwordHash"), false);
  return body.shipment;
}

before(async () => {
  await mongoose.connect(process.env.MONGODB_URI ?? "");
  if (mongoose.connection.name !== "coldi_security_test") {
    throw new Error(`Refusing to use database ${mongoose.connection.name}.`);
  }
  await mongoose.connection.dropDatabase();
  await AuditLog.createIndexes();
  const passwordHash = await hashPassword(password);
  const carrier = await User.create({ email: carrierEmail, passwordHash, role: "CARRIER", displayName: "Nhà xe A" });
  const otherCarrier = await User.create({ email: otherCarrierEmail, passwordHash, role: "CARRIER", displayName: "Nhà xe B" });
  await User.create([
    { email: shipperEmail, passwordHash, role: "SHIPPER", displayName: "Chủ hàng A" },
    { email: otherShipperEmail, passwordHash, role: "SHIPPER", displayName: "Chủ hàng B" },
    { email: driverEmail, passwordHash, role: "DRIVER", carrierId: carrier._id, displayName: "Tài xế A" },
    { email: otherDriverEmail, passwordHash, role: "DRIVER", carrierId: otherCarrier._id, displayName: "Tài xế B" },
    { email: adminEmail, passwordHash, role: "ADMIN", displayName: "Quản trị" },
  ]);
});

after(async () => {
  if (mongoose.connection.name === "coldi_security_test") await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test("private resources stay inside the authenticated relationship", async () => {
  await withServer(async (baseUrl) => {
    const shipper = await login(baseUrl, shipperEmail);
    const otherShipper = await login(baseUrl, otherShipperEmail);
    const carrier = await login(baseUrl, carrierEmail);
    const otherCarrier = await login(baseUrl, otherCarrierEmail);
    const driver = await login(baseUrl, driverEmail);
    const admin = await login(baseUrl, adminEmail);
    const forged = await fetch(`${baseUrl}/api/shipments`, {
      method: "POST",
      headers: headers(shipper),
      body: JSON.stringify({ ...order, tenantId: "tenant-b", shipperId: "forged" }),
    });
    assert.equal(forged.status, 400);

    const created = await publish(baseUrl, shipper);
    const id = String(created.id);
    assert.equal(await AuditLog.countDocuments({ action: "SHIPMENT_PUBLISHED", resourceId: id }), 1);
    const published = await AuditLog.findOne({ action: "SHIPMENT_PUBLISHED", resourceId: id }).lean();
    assert.equal(published?.outcome, "success");
    assert.equal(published?.correlationId, "security-publish-1");
    assert.equal(published && "tenantId" in published, false);

    const guest = await fetch(`${baseUrl}/api/shipments/mine`);
    assert.equal(guest.status, 401);
    assert.equal((await fetch(`${baseUrl}/api/carrier/fleet/vehicles`)).status, 401);
    assert.equal((await fetch(`${baseUrl}/api/driver/shipments`)).status, 401);
    const otherRead = await fetch(`${baseUrl}/api/shipments/${id}`, { headers: headers(otherShipper) });
    assert.equal(otherRead.status, 403);
    assert.equal((await fetch(`${baseUrl}/api/carrier/fleet/vehicles`, { headers: headers(shipper) })).status, 403);
    assert.equal((await fetch(`${baseUrl}/api/carrier/fleet/vehicles`, { headers: headers(driver) })).status, 403);
    assert.equal((await fetch(`${baseUrl}/api/carrier/shipments`, { headers: headers(admin) })).status, 403);
    assert.equal((await fetch(`${baseUrl}/api/shipments/not-an-id`, { headers: headers(shipper) })).status, 404);

    const board = await fetch(`${baseUrl}/api/carrier/shipments`, { headers: headers(carrier) });
    const boardText = await board.text();
    assert.equal(board.status, 200);
    assert.equal(boardText.includes(privateEmail), false);
    assert.equal(boardText.includes("shipperId"), false);
    assert.equal(boardText.includes("latestLocation"), false);
    assert.equal(boardText.includes("passwordHash"), false);
    assert.equal(boardText.includes("audit"), false);

    const createdVehicle = await fetch(`${baseUrl}/api/carrier/fleet/vehicles`, {
      method: "POST",
      headers: headers(carrier),
      body: JSON.stringify({ ...vehicleBody, tenantId: otherCarrier, carrierId: otherCarrier }),
    });
    assert.equal(createdVehicle.status, 400);
    const vehicleResponse = await fetch(`${baseUrl}/api/carrier/fleet/vehicles`, {
      method: "POST",
      headers: headers(carrier),
      body: JSON.stringify(vehicleBody),
    });
    assert.equal(vehicleResponse.status, 201);
    const vehicle = ((await vehicleResponse.json()) as { vehicle: Json }).vehicle;
    const vehicleId = String(vehicle.id);
    assert.equal((await fetch(`${baseUrl}/api/carrier/fleet/vehicles/${vehicleId}`, { headers: headers(otherCarrier) })).status, 404);
    const foreignEdit = await fetch(`${baseUrl}/api/carrier/fleet/vehicles/${vehicleId}`, {
      method: "PATCH",
      headers: headers(otherCarrier),
      body: JSON.stringify({ ...vehicleBody, label: "Xe bị chiếm" }),
    });
    assert.equal(foreignEdit.status, 404);
    assert.equal((await fetch(`${baseUrl}/api/carrier/fleet/vehicles/${vehicleId}`, { method: "DELETE", headers: headers(carrier) })).status, 404);
    assert.equal((await fetch(`${baseUrl}/api/audit`)).status, 404);
  });
});

test("successful shipment and fleet writes are audited once and do not cross into other workflows", async () => {
  await withServer(async (baseUrl) => {
    const shipper = await login(baseUrl, shipperEmail);
    const carrier = await login(baseUrl, carrierEmail);
    const otherCarrier = await login(baseUrl, otherCarrierEmail);
    const driver = await login(baseUrl, driverEmail);
    const otherDriver = await login(baseUrl, otherDriverEmail);
    const created = await publish(baseUrl, shipper);
    const id = String(created.id);
    const forgedClaim = await fetch(`${baseUrl}/api/carrier/shipments/${id}/claim`, {
      method: "POST",
      headers: headers(carrier),
      body: JSON.stringify({ tenantId: "tenant-b", carrierId: "forged", senderId: "forged" }),
    });
    assert.equal(forgedClaim.status, 400);
    assert.equal(await AuditLog.countDocuments({ action: "SHIPMENT_CLAIMED", resourceId: id }), 0);

    const claim = await fetch(`${baseUrl}/api/carrier/shipments/${id}/claim`, {
      method: "POST",
      headers: headers(carrier),
      body: JSON.stringify({}),
    });
    assert.equal(claim.status, 200);
    const loser = await fetch(`${baseUrl}/api/carrier/shipments/${id}/claim`, {
      method: "POST",
      headers: headers(otherCarrier),
      body: JSON.stringify({}),
    });
    assert.equal(loser.status, 409);
    assert.equal(await AuditLog.countDocuments({ action: "SHIPMENT_CLAIMED", resourceId: id, outcome: "success" }), 1);

    const vehicleResponse = await fetch(`${baseUrl}/api/carrier/fleet/vehicles`, {
      method: "POST",
      headers: headers(carrier),
      body: JSON.stringify(vehicleBody),
    });
    const vehicleId = String(((await vehicleResponse.json()) as { vehicle: Json }).vehicle.id);
    const otherVehicleResponse = await fetch(`${baseUrl}/api/carrier/fleet/vehicles`, {
      method: "POST",
      headers: headers(otherCarrier),
      body: JSON.stringify({ ...vehicleBody, label: "Xe nhà xe khác", plate: "50C-101.22" }),
    });
    const otherVehicleId = String(((await otherVehicleResponse.json()) as { vehicle: Json }).vehicle.id);
    const driverId = String((await User.findOne({ email: driverEmail }))?._id);
    const otherDriverId = String((await User.findOne({ email: otherDriverEmail }))?._id);
    const loserAssign = await fetch(`${baseUrl}/api/carrier/shipments/${id}/assign`, {
      method: "POST",
      headers: headers(otherCarrier),
      body: JSON.stringify({ vehicleId: otherVehicleId, driverId: otherDriverId }),
    });
    assert.equal(loserAssign.status, 403);
    assert.equal((await Shipment.findById(id))?.vehicleId ?? null, null);
    const assign = await fetch(`${baseUrl}/api/carrier/shipments/${id}/assign`, {
      method: "POST",
      headers: headers(carrier),
      body: JSON.stringify({ vehicleId, driverId, tenantId: "tenant-b" }),
    });
    assert.equal(assign.status, 400);
    const assigned = await fetch(`${baseUrl}/api/carrier/shipments/${id}/assign`, {
      method: "POST",
      headers: headers(carrier),
      body: JSON.stringify({ vehicleId, driverId }),
    });
    assert.equal(assigned.status, 200);
    assert.equal(await AuditLog.countDocuments({ action: "SHIPMENT_ASSIGNED", resourceId: id }), 1);
    const stored = await Shipment.findById(id);
    assert.equal(stored?.status, "MATCHED");
    assert.equal(stored?.vehicleId?.toString(), vehicleId);

    assert.equal((await fetch(`${baseUrl}/api/driver/shipments/${id}`, { headers: headers(otherDriver) })).status, 404);
    const pickup = await fetch(`${baseUrl}/api/driver/shipments/${id}/pickup`, {
      method: "POST",
      headers: headers(driver),
      body: JSON.stringify({}),
    });
    assert.equal(pickup.status, 200);
    const pickupAgain = await fetch(`${baseUrl}/api/driver/shipments/${id}/pickup`, {
      method: "POST",
      headers: headers(driver),
      body: JSON.stringify({}),
    });
    assert.equal(pickupAgain.status, 200);
    assert.equal(await AuditLog.countDocuments({ action: "SHIPMENT_PICKUP_CONFIRMED", resourceId: id }), 1);

    const delivery = await fetch(`${baseUrl}/api/driver/shipments/${id}/delivery`, {
      method: "POST",
      headers: headers(driver),
      body: JSON.stringify({ senderId: driverId }),
    });
    assert.equal(delivery.status, 400);
    const delivered = await fetch(`${baseUrl}/api/driver/shipments/${id}/delivery`, {
      method: "POST",
      headers: headers(driver),
      body: JSON.stringify({}),
    });
    assert.equal(delivered.status, 200);
    assert.equal(await AuditLog.countDocuments({ action: "SHIPMENT_DELIVERY_CONFIRMED", resourceId: id }), 1);

    const gps = await fetch(`${baseUrl}/api/driver/shipments/${id}/location`, {
      method: "POST",
      headers: headers(otherDriver),
      body: JSON.stringify({ latitude: 10.82345, longitude: 106.62965, observedAt: new Date().toISOString() }),
    });
    assert.equal(gps.status, 404);
    const lateGps = await fetch(`${baseUrl}/api/driver/shipments/${id}/location`, {
      method: "POST",
      headers: headers(driver),
      body: JSON.stringify({ latitude: 10.82345, longitude: 106.62965, observedAt: new Date().toISOString(), driverId }),
    });
    assert.equal(lateGps.status, 400);
    const ownerGps = await fetch(`${baseUrl}/api/shipments/${id}/location`, { headers: headers(await login(baseUrl, otherShipperEmail)) });
    assert.equal(ownerGps.status, 403);
    assert.equal(JSON.stringify(await AuditLog.find({ resourceId: id }).lean()).includes("10.82345"), false);

    const opened = await fetch(`${baseUrl}/api/carrier/conversations/by-shipment/${id}`, {
      method: "POST",
      headers: headers(carrier),
      body: JSON.stringify({}),
    });
    assert.equal(opened.status, 200);
    const conversationId = String(((await opened.json()) as { conversation: Json }).conversation.id);
    const leaked = await fetch(`${baseUrl}/api/carrier/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: headers(carrier),
      body: JSON.stringify({ body: privateChat, senderId: driverId, carrierId: "forged" }),
    });
    assert.equal(leaked.status, 400);
    const sent = await fetch(`${baseUrl}/api/carrier/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: headers(carrier),
      body: JSON.stringify({ body: privateChat }),
    });
    assert.equal(sent.status, 201);
    const otherRead = await fetch(`${baseUrl}/api/carrier/conversations/${conversationId}/messages`, { headers: headers(otherCarrier) });
    assert.equal(otherRead.status, 404);
    assert.equal((await otherRead.text()).includes(privateChat), false);
    const afterChat = await Shipment.findById(id);
    assert.equal(afterChat?.status, "DELIVERY_CONFIRMED");
    assert.equal(afterChat?.carrierId?.toString(), stored?.carrierId?.toString());
    assert.equal(JSON.stringify(await AuditLog.find().lean()).includes(privateChat), false);

    const renamed = await fetch(`${baseUrl}/api/carrier/fleet/vehicles/${vehicleId}`, {
      method: "PATCH",
      headers: headers(carrier),
      body: JSON.stringify({ ...vehicleBody, label: "Xe lạnh đã sửa" }),
    });
    assert.equal(renamed.status, 200);
    const afterRename = await Shipment.findById(id);
    assert.equal(afterRename?.vehicleId?.toString(), vehicleId);
    assert.equal(afterRename?.status, "DELIVERY_CONFIRMED");
    assert.equal(await AuditLog.countDocuments({ action: "VEHICLE_CREATED", resourceId: vehicleId }), 1);
    assert.equal(await AuditLog.countDocuments({ action: "VEHICLE_UPDATED", resourceId: vehicleId }), 1);
    const profile = await fetch(`${baseUrl}/api/carrier/fleet/drivers/${driverId}`, {
      method: "PATCH",
      headers: headers(carrier),
      body: JSON.stringify({ displayName: "Tài xế A sửa", role: "CARRIER", password: password }),
    });
    assert.equal(profile.status, 400);
    const renamedDriver = await fetch(`${baseUrl}/api/carrier/fleet/drivers/${driverId}`, {
      method: "PATCH",
      headers: headers(carrier),
      body: JSON.stringify({ displayName: "Tài xế A sửa" }),
    });
    assert.equal(renamedDriver.status, 200);
    const driverRecord = await User.findById(driverId);
    assert.equal(driverRecord?.role, "DRIVER");
    assert.equal(driverRecord?.carrierId?.toString(), stored?.carrierId?.toString());
    assert.equal(JSON.stringify(await AuditLog.find({ action: "DRIVER_PROFILE_UPDATED" }).lean()).includes(password), false);
  });
});

test("a losing claim does not record a successful audit", async () => {
  await withServer(async (baseUrl) => {
    const created = await publish(baseUrl, await login(baseUrl, shipperEmail));
    const id = String(created.id);
    const [first, second] = await Promise.all([
      fetch(`${baseUrl}/api/carrier/shipments/${id}/claim`, {
        method: "POST",
        headers: headers(await login(baseUrl, carrierEmail)),
        body: JSON.stringify({}),
      }),
      fetch(`${baseUrl}/api/carrier/shipments/${id}/claim`, {
        method: "POST",
        headers: headers(await login(baseUrl, otherCarrierEmail)),
        body: JSON.stringify({}),
      }),
    ]);
    const statuses = [first.status, second.status].sort((left, right) => left - right);
    assert.deepEqual(statuses, [200, 409]);
    assert.equal(await AuditLog.countDocuments({ action: "SHIPMENT_CLAIMED", resourceId: id, outcome: "success" }), 1);
    assert.equal(await Shipment.countDocuments({ _id: id, status: "MATCHED" }), 1);
  });
});
