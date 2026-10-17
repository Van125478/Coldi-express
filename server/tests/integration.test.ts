import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import test, { before, after } from "node:test";
import mongoose from "mongoose";
import { hashPassword } from "../src/auth/password.js";
import { AuditLog } from "../src/models/auditLog.js";
import { Shipment } from "../src/models/shipment.js";
import { User } from "../src/models/user.js";
import { Vehicle } from "../src/models/vehicle.js";

process.env.PORT ??= "4000";
process.env.FRONTEND_ORIGIN ??= "http://127.0.0.1:5173";
process.env.NODE_ENV = "test";
process.env.AUTH_SECRET ??= "test-secret-that-is-at-least-32-characters";

const databaseName = "coldi_integration_test";
const blockedNames = new Set(["coldi", "admin", "local", "config"]);
const sourceUri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/coldi";
const sourceName = new URL(sourceUri).pathname.replace(/^\//, "");
if (sourceName !== "coldi" && sourceName !== databaseName) {
  throw new Error(`Refusing to derive an integration database from ${sourceName}.`);
}
if (blockedNames.has(databaseName) || databaseName.toLowerCase().includes("prod")) {
  throw new Error(`Refusing database ${databaseName}.`);
}
const testUri = new URL(sourceUri);
testUri.pathname = `/${databaseName}`;
process.env.MONGODB_URI = testUri.toString();

const { createApp } = await import("../src/app.js");

const password = "test-password-123";
const shipperEmail = "shipper.integration-test@coldi.local";
const otherShipperEmail = "other-shipper.integration-test@coldi.local";
const carrierEmail = "carrier.integration-test@coldi.local";
const otherCarrierEmail = "other-carrier.integration-test@coldi.local";
const driverEmail = "driver.integration-test@coldi.local";
const otherDriverEmail = "other-driver.integration-test@coldi.local";
const price = 6_100_000;
const cargo = "Hàng tích hợp MVP-02";
const carrierNote = "Tin nhà xe MVP-02";
const shipperNote = "Tin chủ hàng MVP-02";

type Json = Record<string, unknown>;

const order = {
  cargoDescription: cargo,
  pickupLocation: "Cái Bè, Tiền Giang",
  deliveryLocation: "Thủ Đức, TP. Hồ Chí Minh",
  temperatureGroup: "FROZEN",
  vehicleRequirement: "Xe đông lạnh 5 tấn",
  listedPriceVnd: price,
  pickupCompany: "Kho tích hợp",
  pickupContactName: "Người lấy",
  pickupPhone: "0908000111",
  pickupEmail: "rieng-email-mvp02@coldi.local",
  pickupDate: "2026-11-02",
  pickupTimeFrom: "08:00",
  pickupTimeTo: "10:00",
  deliveryCompany: "Kho giao tích hợp",
  deliveryContactName: "Người nhận",
  deliveryPhone: "0918000222",
  deliveryDate: "2026-11-03",
  deliveryTimeFrom: "14:00",
  deliveryTimeTo: "16:00",
  cargoWeightTon: 4.5,
  cargoVolumeM3: 8,
  packageCount: 20,
};

const vehicleBody = {
  label: "Xe tích hợp gốc",
  plate: "51C-202.13",
  vehicleKind: "REEFER_TRUCK",
  temperatureGroup: "FROZEN",
  capacityTon: 8,
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

function headers(cookie?: string) {
  return {
    "content-type": "application/json",
    origin: "http://127.0.0.1:5173",
    ...(cookie ? { cookie } : {}),
  };
}

async function login(baseUrl: string, email: string): Promise<string> {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ email, password }),
  });
  assert.equal(response.status, 200);
  const cookie = response.headers.getSetCookie().find((value) => value.startsWith("coldi_session="));
  assert.ok(cookie);
  return cookie.split(";")[0] ?? "";
}

async function send(baseUrl: string, path: string, cookie: string | undefined, method: string, body?: unknown): Promise<{ status: number; json: Json }> {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: headers(cookie),
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const json = (await response.json()) as Json;
  return { status: response.status, json };
}

function shipmentOf(payload: Json): Json {
  const shipment = payload.shipment;
  assert.equal(typeof shipment, "object");
  assert.ok(shipment);
  return shipment as Json;
}

function eventsOf(payload: Json): Json[] {
  const timeline = shipmentOf(payload).timeline;
  assert.equal(typeof timeline, "object");
  assert.ok(timeline);
  return ((timeline as Json).events ?? []) as Json[];
}

before(async () => {
  await mongoose.connect(process.env.MONGODB_URI ?? "");
  if (mongoose.connection.name !== databaseName || blockedNames.has(mongoose.connection.name)) {
    throw new Error(`Refusing to use database ${mongoose.connection.name}.`);
  }
  await mongoose.connection.dropDatabase();
  await AuditLog.createIndexes();
  const passwordHash = await hashPassword(password);
  const carrier = await User.create({ email: carrierEmail, passwordHash, role: "CARRIER", displayName: "Nhà xe tích hợp" });
  const otherCarrier = await User.create({ email: otherCarrierEmail, passwordHash, role: "CARRIER", displayName: "Nhà xe khác" });
  await User.create([
    { email: shipperEmail, passwordHash, role: "SHIPPER", displayName: "Chủ hàng tích hợp" },
    { email: otherShipperEmail, passwordHash, role: "SHIPPER", displayName: "Chủ hàng khác" },
    { email: driverEmail, passwordHash, role: "DRIVER", carrierId: carrier._id, displayName: "Tài xế tích hợp" },
    { email: otherDriverEmail, passwordHash, role: "DRIVER", carrierId: otherCarrier._id, displayName: "Tài xế khác" },
  ]);
});

after(async () => {
  if (mongoose.connection.name === databaseName) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test("one shipment moves through marketplace, chat, claim, assignment, transit, GPS and delivery", async () => {
  await withServer(async (baseUrl) => {
    const shipper = await login(baseUrl, shipperEmail);
    const otherShipper = await login(baseUrl, otherShipperEmail);
    const carrier = await login(baseUrl, carrierEmail);
    const otherCarrier = await login(baseUrl, otherCarrierEmail);
    const driver = await login(baseUrl, driverEmail);
    const otherDriver = await login(baseUrl, otherDriverEmail);
    const carrierUser = await User.findOne({ email: carrierEmail });
    const otherCarrierUser = await User.findOne({ email: otherCarrierEmail });
    const driverUser = await User.findOne({ email: driverEmail });
    assert.ok(carrierUser && otherCarrierUser && driverUser);

    const forged = await send(baseUrl, "/api/shipments", shipper, "POST", { ...order, shipperId: carrierUser.id });
    assert.equal(forged.status, 400);

    const published = await send(baseUrl, "/api/shipments", shipper, "POST", order);
    assert.equal(published.status, 201);
    const created = shipmentOf(published.json);
    const id = String(created.id);
    assert.equal(created.status, "PUBLISHED");
    assert.equal(created.listedPriceVnd, price);
    assert.deepEqual(eventsOf(published.json).map((event) => event.type), ["PUBLISHED"]);

    const found = await send(baseUrl, `/api/carrier/shipments?q=${encodeURIComponent("  hàng tích hợp mvp-02  ")}&temperature=FROZEN&sort=newest`, carrier, "GET");
    assert.equal(found.status, 200);
    const board = JSON.stringify(found.json);
    assert.equal(board.includes(id), true);
    assert.equal(board.includes(carrierNote), false);
    assert.equal(board.includes("latitude"), false);
    assert.equal(board.includes("shipperId"), false);
    assert.equal(board.includes("rieng-email-mvp02"), false);
    assert.equal(board.includes("audit"), false);
    const afterSearch = await Shipment.findById(id);
    assert.equal(afterSearch?.status, "PUBLISHED");
    assert.equal(afterSearch?.listedPriceVnd, price);
    assert.equal(afterSearch?.events?.length, 1);

    const earlyClaim = await send(baseUrl, `/api/carrier/shipments/${id}/claim`, carrier, "POST", { carrierId: otherCarrierUser.id });
    assert.equal(earlyClaim.status, 400);
    assert.equal((await Shipment.findById(id))?.status, "PUBLISHED");

    const opened = await send(baseUrl, `/api/carrier/conversations/by-shipment/${id}`, carrier, "POST", {});
    assert.equal(opened.status, 200);
    const conversationId = String((opened.json.conversation as Json).id);
    const carrierMessage = await send(baseUrl, `/api/carrier/conversations/${conversationId}/messages`, carrier, "POST", { body: carrierNote });
    assert.equal(carrierMessage.status, 201);
    const inbox = await send(baseUrl, `/api/shipments/${id}/conversations`, shipper, "GET");
    assert.equal(inbox.status, 200);
    const shipperReply = await send(baseUrl, `/api/shipments/${id}/conversations/${conversationId}/messages`, shipper, "POST", { body: shipperNote });
    assert.equal(shipperReply.status, 201);
    const thread = await send(baseUrl, `/api/carrier/conversations/${conversationId}/messages?after=0`, carrier, "GET");
    assert.equal(thread.status, 200);
    assert.deepEqual((thread.json.messages as Json[]).map((message) => message.body), [carrierNote, shipperNote]);
    const intruder = await send(baseUrl, `/api/carrier/conversations/${conversationId}/messages?after=0`, otherCarrier, "GET");
    assert.equal(intruder.status, 404);
    const chatted = await Shipment.findById(id);
    assert.equal(chatted?.status, "PUBLISHED");
    assert.equal(chatted?.listedPriceVnd, price);
    assert.equal(chatted?.carrierId ?? null, null);

    const claimed = await send(baseUrl, `/api/carrier/shipments/${id}/claim`, carrier, "POST", {});
    assert.equal(claimed.status, 200);
    assert.equal(shipmentOf(claimed.json).status, "MATCHED");
    const lost = await send(baseUrl, `/api/carrier/shipments/${id}/claim`, otherCarrier, "POST", {});
    assert.equal(lost.status, 409);
    assert.equal(await AuditLog.countDocuments({ action: "SHIPMENT_CLAIMED", resourceId: id, outcome: "success" }), 1);

    const createdVehicle = await send(baseUrl, "/api/carrier/fleet/vehicles", carrier, "POST", vehicleBody);
    assert.equal(createdVehicle.status, 201);
    const vehicleId = String((createdVehicle.json.vehicle as Json).id);
    const edited = await send(baseUrl, `/api/carrier/fleet/vehicles/${vehicleId}`, carrier, "PATCH", { ...vehicleBody, label: "Xe tích hợp đã sửa" });
    assert.equal(edited.status, 200);
    const untouched = await Shipment.findById(id);
    assert.equal(untouched?.status, "MATCHED");
    assert.equal(untouched?.vehicleId ?? null, null);
    assert.equal(untouched?.driverId ?? null, null);

    const otherVehicle = await Vehicle.create({ ...vehicleBody, label: "Xe nhà xe khác", plate: "50C-101.22", carrierId: otherCarrierUser._id });
    const otherDriverUser = await User.findOne({ email: otherDriverEmail });
    assert.ok(otherDriverUser);
    const outsiderAssign = await send(baseUrl, `/api/carrier/shipments/${id}/assign`, otherCarrier, "POST", {
      vehicleId: String(otherVehicle._id),
      driverId: String(otherDriverUser._id),
    });
    assert.equal(outsiderAssign.status, 403);
    const wrongDriver = await send(baseUrl, `/api/carrier/shipments/${id}/assign`, carrier, "POST", {
      vehicleId,
      driverId: String(otherDriverUser._id),
    });
    assert.equal(wrongDriver.status, 400);

    const assigned = await send(baseUrl, `/api/carrier/shipments/${id}/assign`, carrier, "POST", {
      vehicleId,
      driverId: String(driverUser._id),
    });
    assert.equal(assigned.status, 200);
    assert.equal(shipmentOf(assigned.json).status, "MATCHED");
    assert.equal(shipmentOf(assigned.json).statusLabel, "Chờ lấy hàng");

    const trips = await send(baseUrl, "/api/driver/shipments", driver, "GET");
    assert.equal(trips.status, 200);
    assert.equal((trips.json.shipments as Json[]).some((item) => item.id === id), true);
    const wrongPickup = await send(baseUrl, `/api/driver/shipments/${id}/pickup`, otherDriver, "POST", {});
    assert.equal(wrongPickup.status, 404);
    const picked = await send(baseUrl, `/api/driver/shipments/${id}/pickup`, driver, "POST", {});
    assert.equal(picked.status, 200);
    assert.equal(shipmentOf(picked.json).status, "IN_TRANSIT");
    const pickedAgain = await send(baseUrl, `/api/driver/shipments/${id}/pickup`, driver, "POST", {});
    assert.equal(pickedAgain.status, 200);
    assert.equal((await Shipment.findById(id))?.events?.filter((event) => event.type === "PICKUP_CONFIRMED").length, 1);

    const observedAt = new Date().toISOString();
    const wrongGps = await send(baseUrl, `/api/driver/shipments/${id}/location`, otherDriver, "POST", {
      latitude: 10.77,
      longitude: 106.7,
      observedAt,
    });
    assert.equal(wrongGps.status, 404);
    const invalidGps = await send(baseUrl, `/api/driver/shipments/${id}/location`, driver, "POST", {
      latitude: 95,
      longitude: 106.7,
      observedAt,
    });
    assert.equal(invalidGps.status, 400);
    assert.equal((await Shipment.findById(id))?.latestLocation ?? null, null);
    const gps = await send(baseUrl, `/api/driver/shipments/${id}/location`, driver, "POST", {
      latitude: 10.776,
      longitude: 106.701,
      speedKmh: 42,
      bearingDeg: 90,
      observedAt,
    });
    assert.equal(gps.status, 200);
    assert.equal((gps.json.tracking as Json).phase, "current");
    const stale = await send(baseUrl, `/api/driver/shipments/${id}/location`, driver, "POST", {
      latitude: 10.5,
      longitude: 106.5,
      observedAt: new Date(Date.now() - 60_000).toISOString(),
    });
    assert.equal(stale.status, 409);
    const ownerGps = await send(baseUrl, `/api/shipments/${id}/location`, shipper, "GET");
    assert.equal(ownerGps.status, 200);
    assert.equal(((ownerGps.json.tracking as Json).location as Json).latitude, 10.776);
    const hiddenGps = await send(baseUrl, `/api/shipments/${id}/location`, otherShipper, "GET");
    assert.equal(hiddenGps.status, 403);
    const moved = await Shipment.findById(id);
    assert.equal(moved?.status, "IN_TRANSIT");
    assert.equal(moved?.latestLocation?.latitude, 10.776);

    const delivered = await send(baseUrl, `/api/driver/shipments/${id}/delivery`, driver, "POST", {});
    assert.equal(delivered.status, 200);
    assert.equal(shipmentOf(delivered.json).status, "DELIVERY_CONFIRMED");
    const deliveredAgain = await send(baseUrl, `/api/driver/shipments/${id}/delivery`, driver, "POST", {});
    assert.equal(deliveredAgain.status, 200);
    const lateGps = await send(baseUrl, `/api/driver/shipments/${id}/location`, driver, "POST", {
      latitude: 10.8,
      longitude: 106.8,
      observedAt: new Date().toISOString(),
    });
    assert.equal(lateGps.status, 409);
    const finished = await Shipment.findById(id);
    assert.equal(finished?.status, "DELIVERY_CONFIRMED");
    assert.equal(finished?.latestLocation?.latitude, 10.776);
    assert.deepEqual(finished?.events?.map((event) => event.type), ["PUBLISHED", "CLAIMED", "ASSIGNED", "PICKUP_CONFIRMED", "DELIVERY_CONFIRMED"]);

    const detail = await send(baseUrl, `/api/shipments/${id}`, shipper, "GET");
    assert.equal(detail.status, 200);
    assert.deepEqual(eventsOf(detail.json).map((event) => event.type), ["PUBLISHED", "CLAIMED", "ASSIGNED", "PICKUP_CONFIRMED", "DELIVERY_CONFIRMED"]);
    const assignedEvent = eventsOf(detail.json).find((event) => event.type === "ASSIGNED");
    assert.equal(String(assignedEvent?.detail).includes("Xe tích hợp đã sửa"), true);
    assert.equal(String(assignedEvent?.detail).includes("Tài xế tích hợp"), true);

    const shipmentAudits = await AuditLog.find({ resourceId: id }).sort({ action: 1 }).lean();
    assert.deepEqual(shipmentAudits.map((entry) => entry.action), [
      "SHIPMENT_ASSIGNED",
      "SHIPMENT_CLAIMED",
      "SHIPMENT_DELIVERY_CONFIRMED",
      "SHIPMENT_PICKUP_CONFIRMED",
      "SHIPMENT_PUBLISHED",
    ]);
    assert.equal(shipmentAudits.every((entry) => entry.outcome === "success"), true);
    assert.equal(JSON.stringify(shipmentAudits).includes(carrierNote), false);
    assert.equal(JSON.stringify(shipmentAudits).includes("10.776"), false);
    assert.equal(await AuditLog.countDocuments({ resourceId: vehicleId, action: "VEHICLE_CREATED" }), 1);
    assert.equal(await AuditLog.countDocuments({ resourceId: vehicleId, action: "VEHICLE_UPDATED" }), 1);

    const gone = await send(baseUrl, `/api/carrier/shipments?q=${encodeURIComponent(cargo)}`, carrier, "GET");
    assert.equal(gone.status, 200);
    assert.equal((gone.json.shipments as Json[]).length, 0);
    const publicBoard = JSON.stringify(gone.json);
    assert.equal(publicBoard.includes(carrierNote), false);
    assert.equal(publicBoard.includes("latitude"), false);
    assert.equal(publicBoard.includes("SHIPMENT_CLAIMED"), false);
  });
});

test("two carriers racing for a second shipment still produce one winner", async () => {
  await withServer(async (baseUrl) => {
    const shipper = await login(baseUrl, shipperEmail);
    const published = await send(baseUrl, "/api/shipments", shipper, "POST", { ...order, cargoDescription: "Hàng tranh chấp MVP-02" });
    assert.equal(published.status, 201);
    const id = String(shipmentOf(published.json).id);
    const [first, second] = await Promise.all([
      send(baseUrl, `/api/carrier/shipments/${id}/claim`, await login(baseUrl, carrierEmail), "POST", {}),
      send(baseUrl, `/api/carrier/shipments/${id}/claim`, await login(baseUrl, otherCarrierEmail), "POST", {}),
    ]);
    assert.deepEqual([first.status, second.status].sort((left, right) => left - right), [200, 409]);
    assert.equal(await Shipment.countDocuments({ _id: id, status: "MATCHED" }), 1);
    assert.equal(await AuditLog.countDocuments({ action: "SHIPMENT_CLAIMED", resourceId: id, outcome: "success" }), 1);
  });
});

test("assignment keeps the vehicle and driver names from that moment", async () => {
  await withServer(async (baseUrl) => {
    const shipper = await login(baseUrl, shipperEmail);
    const carrier = await login(baseUrl, carrierEmail);
    const published = await send(baseUrl, "/api/shipments", shipper, "POST", { ...order, cargoDescription: "Hàng mốc tên xe MVP-03" });
    const id = String(shipmentOf(published.json).id);
    assert.equal((await send(baseUrl, `/api/carrier/shipments/${id}/claim`, carrier, "POST", {})).status, 200);
    const vehicle = await send(baseUrl, "/api/carrier/fleet/vehicles", carrier, "POST", {
      ...vehicleBody,
      label: "Xe trước khi đổi tên",
      plate: "51C-303.14",
    });
    const vehicleId = String((vehicle.json.vehicle as Json).id);
    const driverUser = await User.findOne({ email: driverEmail });
    assert.ok(driverUser);
    assert.equal((await send(baseUrl, `/api/carrier/shipments/${id}/assign`, carrier, "POST", { vehicleId, driverId: String(driverUser._id) })).status, 200);
    const repeated = await send(baseUrl, `/api/carrier/shipments/${id}/assign`, carrier, "POST", { vehicleId, driverId: String(driverUser._id) });
    assert.equal(repeated.status, 409);

    const before = await send(baseUrl, `/api/shipments/${id}`, shipper, "GET");
    const beforeEvents = eventsOf(before.json);
    assert.equal(beforeEvents.filter((event) => event.type === "ASSIGNED").length, 1);
    const beforeDetail = String(beforeEvents.find((event) => event.type === "ASSIGNED")?.detail);
    assert.equal(beforeDetail, "Xe Xe trước khi đổi tên. Tài xế Tài xế tích hợp.");

    assert.equal((await send(baseUrl, `/api/carrier/fleet/vehicles/${vehicleId}`, carrier, "PATCH", { ...vehicleBody, label: "Xe sau khi đổi tên", plate: "51C-303.14" })).status, 200);
    assert.equal((await send(baseUrl, `/api/carrier/fleet/drivers/${String(driverUser._id)}`, carrier, "PATCH", { displayName: "Tài xế đã đổi tên" })).status, 200);

    const stored = await Shipment.findById(id);
    const assigned = stored?.events?.find((event) => event.type === "ASSIGNED");
    assert.equal(stored?.events?.filter((event) => event.type === "ASSIGNED").length, 1);
    assert.equal(stored?.events?.length, 3);
    assert.equal(stored?.status, "MATCHED");
    assert.equal(stored?.vehicleId?.toString(), vehicleId);
    assert.equal(stored?.driverId?.toString(), String(driverUser._id));
    assert.equal(assigned?.assignedVehicleLabel, "Xe trước khi đổi tên");
    assert.equal(assigned?.assignedDriverName, "Tài xế tích hợp");

    const after = await send(baseUrl, `/api/shipments/${id}`, shipper, "GET");
    assert.equal(eventsOf(after.json).filter((event) => event.type === "ASSIGNED").length, 1);
    assert.equal(String(eventsOf(after.json).find((event) => event.type === "ASSIGNED")?.detail), beforeDetail);
  });
});

test("legacy assignment events without a snapshot keep the current lookup", async () => {
  await withServer(async (baseUrl) => {
    const shipper = await login(baseUrl, shipperEmail);
    const shipperUser = await User.findOne({ email: shipperEmail });
    const carrierUser = await User.findOne({ email: carrierEmail });
    const driverUser = await User.findOne({ email: driverEmail });
    assert.ok(shipperUser && carrierUser && driverUser);
    const vehicle = await Vehicle.create({
      carrierId: carrierUser._id,
      label: "Xe cũ không snapshot",
      plate: "51C-404.15",
      vehicleKind: "REEFER_TRUCK",
      temperatureGroup: "FROZEN",
      capacityTon: 5,
    });
    const legacy = await Shipment.create({
      shipperId: shipperUser._id,
      cargoDescription: "Đơn cũ không snapshot MVP-03",
      pickupLocation: "Long An",
      deliveryLocation: "Bình Dương",
      temperatureGroup: "COOL",
      vehicleRequirement: "Xe lạnh",
      listedPriceVnd: 1_000_000,
      status: "MATCHED",
      carrierId: carrierUser._id,
      vehicleId: vehicle._id,
      driverId: driverUser._id,
      events: [
        {
          type: "PUBLISHED",
          occurredAt: new Date("2026-10-01T01:00:00.000Z"),
          actorId: shipperUser._id,
          actorRole: "SHIPPER",
          statusAfter: "PUBLISHED",
          sequence: 1,
        },
        {
          type: "ASSIGNED",
          occurredAt: new Date("2026-10-01T02:00:00.000Z"),
          actorId: carrierUser._id,
          actorRole: "CARRIER",
          statusBefore: "MATCHED",
          statusAfter: "MATCHED",
          vehicleId: vehicle._id,
          driverId: driverUser._id,
          sequence: 2,
        },
      ],
    });
    const first = await send(baseUrl, `/api/shipments/${String(legacy._id)}`, shipper, "GET");
    assert.equal(first.status, 200);
    assert.equal(String(eventsOf(first.json).find((event) => event.type === "ASSIGNED")?.detail).includes("Xe cũ không snapshot"), true);

    vehicle.label = "Xe cũ đã đổi tên";
    await vehicle.save();
    const renamed = await send(baseUrl, `/api/shipments/${String(legacy._id)}`, shipper, "GET");
    assert.equal(String(eventsOf(renamed.json).find((event) => event.type === "ASSIGNED")?.detail).includes("Xe cũ đã đổi tên"), true);
    assert.equal((await Shipment.findById(legacy._id))?.events?.length, 2);

    const missing = await Shipment.create({
      shipperId: shipperUser._id,
      cargoDescription: "Đơn mất xe MVP-03",
      pickupLocation: "Cần Thơ",
      deliveryLocation: "Đồng Nai",
      temperatureGroup: "FROZEN",
      vehicleRequirement: "Xe lạnh",
      listedPriceVnd: 1_000_000,
      status: "MATCHED",
      carrierId: carrierUser._id,
      events: [
        {
          type: "ASSIGNED",
          occurredAt: new Date("2026-10-02T02:00:00.000Z"),
          actorId: carrierUser._id,
          actorRole: "CARRIER",
          statusAfter: "MATCHED",
          vehicleId: new mongoose.Types.ObjectId(),
          driverId: new mongoose.Types.ObjectId(),
          sequence: 1,
        },
      ],
    });
    const broken = await send(baseUrl, `/api/shipments/${String(missing._id)}`, shipper, "GET");
    assert.equal(broken.status, 200);
    assert.equal(eventsOf(broken.json).find((event) => event.type === "ASSIGNED")?.detail, "Xe đã phân công. Tài xế đã phân công.");
    assert.equal((await Shipment.findById(missing._id))?.events?.length, 1);
  });
});
