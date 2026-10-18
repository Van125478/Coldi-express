import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import test, { after, before, mock } from "node:test";
import { Types } from "mongoose";
import mongoose from "mongoose";
import { hashPassword } from "../src/auth/password.js";
import { Shipment } from "../src/models/shipment.js";
import { User } from "../src/models/user.js";
import { Vehicle } from "../src/models/vehicle.js";
import { leaseGraceMs, reconcileVehicleLeases, releaseVehicleReservation, reserveVehicleForShipment, vehicleBusyMessage } from "../src/packages/vehicleLease.js";

process.env.PORT ??= "4000";
process.env.FRONTEND_ORIGIN ??= "http://127.0.0.1:5173";
process.env.NODE_ENV = "test";
process.env.AUTH_SECRET ??= "test-secret-that-is-at-least-32-characters";

const sourceUri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/coldi";
const testUri = new URL(sourceUri);
testUri.pathname = "/coldi_vehicle_lease_test";
process.env.MONGODB_URI = testUri.toString();

const { createApp } = await import("../src/app.js");

const password = "test-password-123";
const databaseName = "coldi_vehicle_lease_test";
const forbidden = new Set(["coldi", "admin", "local", "config"]);
const shipperEmail = "shipper.lease-test@coldi.local";
const carrierEmail = "carrier.lease-test@coldi.local";
const driverEmail = "driver.lease-test@coldi.local";

type Json = Record<string, unknown>;
before(async () => {
  await mongoose.connect(process.env.MONGODB_URI ?? "", { serverSelectionTimeoutMS: 4000 });
  if (mongoose.connection.name !== databaseName || forbidden.has(mongoose.connection.name)) {
    throw new Error(`Refusing to use database ${mongoose.connection.name}.`);
  }
  await mongoose.connection.dropDatabase();
  const passwordHash = await hashPassword(password);
  const carrier = await User.create({ email: carrierEmail, passwordHash, role: "CARRIER", displayName: "Nhà xe giữ xe" });
  await User.create([
    { email: shipperEmail, passwordHash, role: "SHIPPER", displayName: "Chủ hàng giữ xe" },
    { email: driverEmail, passwordHash, role: "DRIVER", carrierId: carrier._id, displayName: "Tài xế giữ xe", mustChangePassword: false },
  ]);
});

after(async () => {
  if (mongoose.connection.name === databaseName && !forbidden.has(mongoose.connection.name)) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test("one vehicle is assigned to one open trip and a second open trip is rejected", async () => {
  await resetFixtures();
  await withServer(async (baseUrl) => {
    const shipper = await login(baseUrl, shipperEmail);
    const carrier = await login(baseUrl, carrierEmail);
    const first = await claimShipment(baseUrl, shipper, carrier, "Hàng giữ xe một");
    const second = await claimShipment(baseUrl, shipper, carrier, "Hàng giữ xe hai");
    const vehicle = await createVehicle("Xe một chuyến");
    const driverId = await driver();

    const assigned = await assign(baseUrl, carrier, first, vehicle.id, driverId);
    assert.equal(assigned.status, 200);
    const assignedBody = (await assigned.json()) as { shipment: Json };
    assert.equal(assignedBody.shipment.vehicleId, vehicle.id);
    assert.equal(assignedBody.shipment.status, "MATCHED");
    const leased = await Vehicle.findById(vehicle.id);
    assert.deepEqual(leased?.leasedShipmentIds?.map((id) => id.toString()), [first]);

    const claimedAgain = await claimShipment(baseUrl, shipper, carrier, "Hàng vẫn nhận được");
    assert.ok(claimedAgain);
    const fleet = await fetch(`${baseUrl}/api/carrier/fleet/vehicles`, { headers: headers(carrier) });
    const fleetBody = (await fleet.json()) as { vehicles: Json[] };
    const listed = fleetBody.vehicles.find((item) => item.id === vehicle.id);
    assert.equal(listed?.availableForAssignment, false);

    const blocked = await assign(baseUrl, carrier, second, vehicle.id, driverId);
    const blockedBody = (await blocked.json()) as { error: Json };
    assert.equal(blocked.status, 409);
    assert.equal(blockedBody.error.code, "vehicle_busy");
    assert.equal(blockedBody.error.message, vehicleBusyMessage);
    assert.equal((await Shipment.findById(second))?.vehicleId ?? null, null);
    assert.equal((await Shipment.findById(first))?.vehicleId?.toString(), vehicle.id);
    assert.deepEqual((await Vehicle.findById(vehicle.id))?.leasedShipmentIds?.map((id) => id.toString()), [first]);
  });
});

test("two concurrent assigns of different trips keep exactly one lease", async () => {
  await resetFixtures();
  await withServer(async (baseUrl) => {
    const shipper = await login(baseUrl, shipperEmail);
    const carrier = await login(baseUrl, carrierEmail);
    const first = await claimShipment(baseUrl, shipper, carrier, "Hàng đua một");
    const second = await claimShipment(baseUrl, shipper, carrier, "Hàng đua hai");
    const vehicle = await createVehicle("Xe đua");
    const driverId = await driver();
    const [left, right] = await Promise.all([
      assign(baseUrl, carrier, first, vehicle.id, driverId),
      assign(baseUrl, carrier, second, vehicle.id, driverId),
    ]);
    const statuses = [left.status, right.status].sort((a, b) => a - b);
    assert.deepEqual(statuses, [200, 409]);
    const loser = left.status === 409 ? left : right;
    const winnerId = left.status === 200 ? first : second;
    const loserId = winnerId === first ? second : first;
    const loserBody = (await loser.json()) as { error: Json };
    assert.equal(loserBody.error.code, "vehicle_busy");
    assert.equal(loserBody.error.message, vehicleBusyMessage);
    const storedVehicle = await Vehicle.findById(vehicle.id);
    assert.deepEqual(storedVehicle?.leasedShipmentIds?.map((id) => id.toString()), [winnerId]);
    assert.equal((await Shipment.findById(winnerId))?.vehicleId?.toString(), vehicle.id);
    assert.equal((await Shipment.findById(loserId))?.vehicleId ?? null, null);
  });
});

test("a vehicle waiting for pickup or already in transit cannot take another trip", async () => {
  await resetFixtures();
  await withServer(async (baseUrl) => {
    const shipper = await login(baseUrl, shipperEmail);
    const carrier = await login(baseUrl, carrierEmail);
    const driverCookie = await login(baseUrl, driverEmail);
    const waiting = await claimShipment(baseUrl, shipper, carrier, "Hàng chờ lấy");
    const other = await claimShipment(baseUrl, shipper, carrier, "Hàng khác");
    const moving = await claimShipment(baseUrl, shipper, carrier, "Hàng đang chạy");
    const vehicle = await createVehicle("Xe chờ");
    const movingVehicle = await createVehicle("Xe đang chạy");
    const driverId = await driver();

    assert.equal((await assign(baseUrl, carrier, waiting, vehicle.id, driverId)).status, 200);
    const blockedWhileWaiting = await assign(baseUrl, carrier, other, vehicle.id, driverId);
    assert.equal(blockedWhileWaiting.status, 409);
    assert.equal(((await blockedWhileWaiting.json()) as { error: Json }).error.code, "vehicle_busy");
    assert.equal((await Shipment.findById(waiting))?.status, "MATCHED");
    assert.deepEqual((await Vehicle.findById(vehicle.id))?.leasedShipmentIds?.map((id) => id.toString()), [waiting]);

    assert.equal((await assign(baseUrl, carrier, moving, movingVehicle.id, driverId)).status, 200);
    const picked = await post(baseUrl, driverCookie, `/api/driver/shipments/${moving}/pickup`);
    assert.equal(picked.status, 200);
    const blockedWhileMoving = await assign(baseUrl, carrier, other, movingVehicle.id, driverId);
    assert.equal(blockedWhileMoving.status, 409);
    assert.equal(((await blockedWhileMoving.json()) as { error: Json }).error.code, "vehicle_busy");
    assert.equal((await Shipment.findById(moving))?.status, "IN_TRANSIT");
    assert.deepEqual((await Vehicle.findById(movingVehicle.id))?.leasedShipmentIds?.map((id) => id.toString()), [moving]);
  });
});

test("delivery confirmation releases the vehicle and archive stays blocked until then", async () => {
  await resetFixtures();
  await withServer(async (baseUrl) => {
    const shipper = await login(baseUrl, shipperEmail);
    const carrier = await login(baseUrl, carrierEmail);
    const driverCookie = await login(baseUrl, driverEmail);
    const first = await claimShipment(baseUrl, shipper, carrier, "Hàng sẽ giao");
    const second = await claimShipment(baseUrl, shipper, carrier, "Hàng sau khi giao");
    const vehicle = await createVehicle("Xe giao xong");
    const driverId = await driver();
    assert.equal((await assign(baseUrl, carrier, first, vehicle.id, driverId)).status, 200);

    const archived = await fetch(`${baseUrl}/api/carrier/fleet/vehicles/${vehicle.id}/archive`, {
      method: "POST",
      headers: headers(carrier, true),
      body: JSON.stringify({}),
    });
    const archivedBody = (await archived.json()) as { error: Json };
    assert.equal(archived.status, 409);
    assert.equal(archivedBody.error.code, "vehicle_on_unfinished_trip");
    assert.equal((await Vehicle.findById(vehicle.id))?.status ?? "ACTIVE", "ACTIVE");
    assert.equal((await Shipment.findById(first))?.vehicleId?.toString(), vehicle.id);

    assert.equal((await post(baseUrl, driverCookie, `/api/driver/shipments/${first}/pickup`)).status, 200);
    const delivered = await post(baseUrl, driverCookie, `/api/driver/shipments/${first}/delivery`);
    assert.equal(delivered.status, 200);
    assert.equal(((await delivered.json()) as { shipment: Json }).shipment.status, "DELIVERY_CONFIRMED");
    assert.equal((await Vehicle.findById(vehicle.id))?.leasedShipmentIds?.length ?? 0, 0);
    const fleet = await fetch(`${baseUrl}/api/carrier/fleet/vehicles`, { headers: headers(carrier) });
    const listed = ((await fleet.json()) as { vehicles: Json[] }).vehicles.find((item) => item.id === vehicle.id);
    assert.equal(listed?.availableForAssignment, true);

    const next = await assign(baseUrl, carrier, second, vehicle.id, driverId);
    assert.equal(next.status, 200);
    assert.deepEqual((await Vehicle.findById(vehicle.id))?.leasedShipmentIds?.map((id) => id.toString()), [second]);
    assert.equal((await Shipment.findById(first))?.status, "DELIVERY_CONFIRMED");
  });
});

test("a failed assign rolls back only the lease it took", async () => {
  await resetFixtures();
  await withServer(async (baseUrl) => {
    const shipper = await login(baseUrl, shipperEmail);
    const carrier = await login(baseUrl, carrierEmail);
    const kept = await claimShipment(baseUrl, shipper, carrier, "Hàng giữ nguyên");
    const failing = await claimShipment(baseUrl, shipper, carrier, "Hàng ghi lỗi");
    const keptVehicle = await createVehicle("Xe đã gán");
    const failingVehicle = await createVehicle("Xe ghi lỗi");
    const driverId = await driver();
    assert.equal((await assign(baseUrl, carrier, kept, keptVehicle.id, driverId)).status, 200);

    const original = Shipment.findOneAndUpdate.bind(Shipment);
    const failingWrite = mock.method(Shipment, "findOneAndUpdate", (...args: unknown[]) => {
      const filter = args[0] as { _id?: unknown };
      if (String(filter?._id) === failing) throw new Error("assign write failed");
      return original(...(args as Parameters<typeof Shipment.findOneAndUpdate>));
    });
    try {
      const failed = await assign(baseUrl, carrier, failing, failingVehicle.id, driverId);
      assert.equal(failed.status, 500);
    } finally {
      failingWrite.mock.restore();
    }

    assert.equal((await Vehicle.findById(failingVehicle.id))?.leasedShipmentIds?.length ?? 0, 0);
    assert.equal((await Shipment.findById(failing))?.vehicleId ?? null, null);
    assert.deepEqual((await Vehicle.findById(keptVehicle.id))?.leasedShipmentIds?.map((id) => id.toString()), [kept]);
    assert.equal((await Shipment.findById(kept))?.vehicleId?.toString(), keptVehicle.id);

    const recovered = await assign(baseUrl, carrier, failing, failingVehicle.id, driverId);
    assert.equal(recovered.status, 200);
    assert.deepEqual((await Vehicle.findById(failingVehicle.id))?.leasedShipmentIds?.map((id) => id.toString()), [failing]);
    assert.deepEqual((await Vehicle.findById(keptVehicle.id))?.leasedShipmentIds?.map((id) => id.toString()), [kept]);
  });
});

test("legacy trips that share a vehicle are reported and left in place", async () => {
  await resetFixtures();
  const carrierUser = await requiredUser(carrierEmail);
  const shipperUser = await requiredUser(shipperEmail);
  const vehicle = await createVehicle("Xe dữ liệu cũ");
  const first = await legacyShipment(shipperUser._id, carrierUser._id, vehicle._id, "MATCHED", "Đơn cũ một");
  const second = await legacyShipment(shipperUser._id, carrierUser._id, vehicle._id, "IN_TRANSIT", "Đơn cũ hai");
  await Vehicle.updateOne(
    { _id: vehicle._id },
    { $set: { leasedShipmentIds: [first._id, second._id], leaseAcquiredAt: new Date(Date.now() - leaseGraceMs - 5_000) } },
  );

  const reconciled = await reconcileVehicleLeases();
  assert.equal(reconciled.released, 0);
  assert.equal(reconciled.conflicts.length, 1);
  assert.equal(reconciled.conflicts[0]?.vehicleId, vehicle.id);
  assert.deepEqual(reconciled.conflicts[0]?.shipmentIds, [first.id, second.id].sort());
  assert.equal((await Shipment.findById(first._id))?.status, "MATCHED");
  assert.equal((await Shipment.findById(second._id))?.status, "IN_TRANSIT");
  assert.equal((await Shipment.findById(first._id))?.vehicleId?.toString(), vehicle.id);
  assert.equal((await Shipment.findById(second._id))?.vehicleId?.toString(), vehicle.id);
  assert.deepEqual(
    (await Vehicle.findById(vehicle.id))?.leasedShipmentIds?.map((id) => id.toString()).sort(),
    [first.id, second.id].sort(),
  );

  await withServer(async (baseUrl) => {
    const shipper = await login(baseUrl, shipperEmail);
    const carrier = await login(baseUrl, carrierEmail);
    const third = await claimShipment(baseUrl, shipper, carrier, "Hàng không được gắn vào xe cũ");
    const blocked = await assign(baseUrl, carrier, third, vehicle.id, await driver());
    assert.equal(blocked.status, 409);
    assert.equal(((await blocked.json()) as { error: Json }).error.code, "vehicle_busy");
  });

  assert.equal(await Shipment.countDocuments({ _id: { $in: [first._id, second._id] } }), 2);
  assert.equal((await Shipment.findById(first._id))?.status, "MATCHED");
  assert.equal((await Shipment.findById(second._id))?.status, "IN_TRANSIT");
  assert.deepEqual(
    (await Vehicle.findById(vehicle.id))?.leasedShipmentIds?.map((id) => id.toString()).sort(),
    [first.id, second.id].sort(),
  );
});

test("startup recovery releases only a stranded lease", async () => {
  await resetFixtures();
  const carrierUser = await requiredUser(carrierEmail);
  const shipperUser = await requiredUser(shipperEmail);
  const now = new Date();

  const freshShipment = await legacyShipment(shipperUser._id, carrierUser._id, null, "MATCHED", "Giữ đang gán");
  const freshVehicle = await Vehicle.create({
    carrierId: carrierUser._id,
    label: "Xe đang gán",
    leasedShipmentIds: [freshShipment._id],
    leaseAcquiredAt: now,
  });

  const staleShipment = await legacyShipment(shipperUser._id, carrierUser._id, null, "MATCHED", "Giữ đã chết");
  const staleVehicle = await Vehicle.create({
    carrierId: carrierUser._id,
    label: "Xe giữ chết",
    leasedShipmentIds: [staleShipment._id],
    leaseAcquiredAt: new Date(now.getTime() - leaseGraceMs - 1_000),
  });

  const movingShipment = await legacyShipment(shipperUser._id, carrierUser._id, null, "IN_TRANSIT", "Chuyến còn hiệu lực");
  const movingVehicle = await Vehicle.create({
    carrierId: carrierUser._id,
    label: "Xe còn hiệu lực",
    leasedShipmentIds: [movingShipment._id],
    leaseAcquiredAt: new Date(now.getTime() - 86_400_000),
  });
  await Shipment.updateOne({ _id: movingShipment._id }, { vehicleId: movingVehicle._id });

  const deliveredShipment = await legacyShipment(shipperUser._id, carrierUser._id, null, "DELIVERY_CONFIRMED", "Chuyến đã giao");
  const deliveredVehicle = await Vehicle.create({
    carrierId: carrierUser._id,
    label: "Xe đã giao",
    leasedShipmentIds: [deliveredShipment._id],
    leaseAcquiredAt: new Date(now.getTime() - 86_400_000),
  });
  await Shipment.updateOne({ _id: deliveredShipment._id }, { vehicleId: deliveredVehicle._id });

  const missingVehicle = await Vehicle.create({
    carrierId: carrierUser._id,
    label: "Xe mất chuyến",
    leasedShipmentIds: [new Types.ObjectId()],
    leaseAcquiredAt: new Date(now.getTime() - 86_400_000),
  });

  const otherVehicle = await createVehicle("Xe của chuyến khác");
  const pointedShipment = await legacyShipment(shipperUser._id, carrierUser._id, otherVehicle._id, "MATCHED", "Chuyến thuộc xe khác");
  const stalePointer = await Vehicle.create({
    carrierId: carrierUser._id,
    label: "Xe giữ nhầm",
    leasedShipmentIds: [pointedShipment._id],
    leaseAcquiredAt: new Date(now.getTime() - 86_400_000),
  });

  const reconciled = await reconcileVehicleLeases(now);
  assert.equal(reconciled.conflicts.length, 0);
  assert.equal((await Vehicle.findById(freshVehicle.id))?.leasedShipmentIds?.length, 1);
  assert.equal((await Vehicle.findById(staleVehicle.id))?.leasedShipmentIds?.length ?? 0, 0);
  assert.equal((await Shipment.findById(staleShipment.id))?.status, "MATCHED");
  assert.equal((await Shipment.findById(staleShipment.id))?.vehicleId ?? null, null);
  assert.deepEqual((await Vehicle.findById(movingVehicle.id))?.leasedShipmentIds?.map((id) => id.toString()), [movingShipment.id]);
  assert.equal((await Vehicle.findById(deliveredVehicle.id))?.leasedShipmentIds?.length ?? 0, 0);
  assert.equal((await Shipment.findById(deliveredShipment.id))?.status, "DELIVERY_CONFIRMED");
  assert.equal((await Vehicle.findById(missingVehicle.id))?.leasedShipmentIds?.length ?? 0, 0);
  assert.equal((await Vehicle.findById(stalePointer.id))?.leasedShipmentIds?.length ?? 0, 0);
  assert.equal((await Shipment.findById(pointedShipment.id))?.vehicleId?.toString(), otherVehicle.id);
  assert.equal((await Vehicle.findById(movingVehicle.id))?.leaseAcquiredAt instanceof Date, true);

  const carrierId = carrierUser._id.toString();
  await releaseVehicleReservation(carrierId, movingVehicle.id, staleShipment.id);
  assert.deepEqual((await Vehicle.findById(movingVehicle.id))?.leasedShipmentIds?.map((id) => id.toString()), [movingShipment.id]);
  const stolen = await reserveVehicleForShipment(carrierId, movingVehicle.id, staleShipment.id);
  assert.equal(stolen, null);
  assert.deepEqual((await Vehicle.findById(movingVehicle.id))?.leasedShipmentIds?.map((id) => id.toString()), [movingShipment.id]);

  const replacementId = new Types.ObjectId().toString();
  const recovered = await reserveVehicleForShipment(carrierId, staleVehicle.id, replacementId);
  assert.equal(recovered?._id.toString(), staleVehicle.id);
  assert.deepEqual((await Vehicle.findById(staleVehicle.id))?.leasedShipmentIds?.map((id) => id.toString()), [replacementId]);
  assert.equal((await Shipment.findById(staleShipment.id))?.vehicleId ?? null, null);
  assert.deepEqual((await Vehicle.findById(freshVehicle.id))?.leasedShipmentIds?.map((id) => id.toString()), [freshShipment.id]);

  await releaseVehicleReservation(carrierId, movingVehicle.id, movingShipment.id);
  const cleared = await Vehicle.findById(movingVehicle.id);
  assert.equal(cleared?.leasedShipmentIds?.length ?? 0, 0);
  assert.equal(cleared?.leaseAcquiredAt ?? null, null);
});

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

async function resetFixtures() {
  if (mongoose.connection.name !== databaseName || forbidden.has(mongoose.connection.name)) {
    throw new Error(`Refusing to clean database ${mongoose.connection.name}.`);
  }
  await Promise.all([Shipment.deleteMany({}), Vehicle.deleteMany({})]);
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

function headers(cookie: string, json = false): Record<string, string> {
  return { origin: "http://127.0.0.1:5173", cookie, ...(json ? { "content-type": "application/json" } : {}) };
}

async function claimShipment(baseUrl: string, shipper: string, carrier: string, cargoDescription: string) {
  const published = await fetch(`${baseUrl}/api/shipments`, {
    method: "POST",
    headers: headers(shipper, true),
    body: JSON.stringify({
      cargoDescription,
      pickupLocation: "Cái Bè, Tiền Giang",
      deliveryLocation: "Thủ Đức, TP. Hồ Chí Minh",
      temperatureGroup: "FROZEN",
      vehicleRequirement: "Xe đông lạnh 5 tấn",
      listedPriceVnd: 5000000,
      pickupCompany: "Kho kiểm tra",
      pickupContactName: "Người lấy",
      pickupPhone: "0908123456",
      pickupDate: "2026-10-22",
      pickupTimeFrom: "08:00",
      pickupTimeTo: "11:30",
      deliveryCompany: "Kho giao",
      deliveryContactName: "Người nhận",
      deliveryPhone: "0912889999",
      deliveryDate: "2026-10-23",
      deliveryTimeFrom: "14:00",
      deliveryTimeTo: "18:00",
      cargoWeightTon: 2,
      cargoVolumeM3: 8,
      packageCount: 10,
    }),
  });
  assert.equal(published.status, 201);
  const id = String(((await published.json()) as { shipment: Json }).shipment.id);
  const claimed = await post(baseUrl, carrier, `/api/carrier/shipments/${id}/claim`);
  assert.equal(claimed.status, 200);
  return id;
}

function post(baseUrl: string, cookie: string, path: string) {
  return fetch(`${baseUrl}${path}`, { method: "POST", headers: headers(cookie, true), body: JSON.stringify({}) });
}

function assign(baseUrl: string, cookie: string, id: string, vehicleId: string, driverId: string) {
  return fetch(`${baseUrl}/api/carrier/shipments/${id}/assign`, {
    method: "POST",
    headers: headers(cookie, true),
    body: JSON.stringify({ vehicleId, driverId }),
  });
}

async function createVehicle(label: string) {
  const carrierUser = await requiredUser(carrierEmail);
  return Vehicle.create({ carrierId: carrierUser._id, label });
}

async function driver() {
  return (await requiredUser(driverEmail))._id.toString();
}

async function requiredUser(email: string) {
  const user = await User.findOne({ email });
  assert.ok(user);
  return user;
}

function legacyShipment(
  shipperId: Types.ObjectId,
  carrierId: Types.ObjectId,
  vehicleId: Types.ObjectId | null,
  status: "MATCHED" | "IN_TRANSIT" | "DELIVERY_CONFIRMED",
  cargoDescription: string,
) {
  return Shipment.create({
    shipperId,
    carrierId,
    ...(vehicleId ? { vehicleId } : {}),
    cargoDescription,
    pickupLocation: "Long An",
    deliveryLocation: "Bình Dương",
    temperatureGroup: "FROZEN",
    vehicleRequirement: "Xe đông lạnh",
    listedPriceVnd: 1000000,
    status,
  });
}
