import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import test, { before, after } from "node:test";
import mongoose from "mongoose";
import { hashPassword } from "../src/auth/password.js";
import { withRequiredCargoImage } from "./support/cargoImage.js";
import { Shipment } from "../src/models/shipment.js";
import { User } from "../src/models/user.js";
import { Vehicle } from "../src/models/vehicle.js";

process.env.PORT ??= "4000";
process.env.FRONTEND_ORIGIN ??= "http://127.0.0.1:5173";
process.env.NODE_ENV = "test";
process.env.AUTH_SECRET ??= "test-secret-that-is-at-least-32-characters";

const sourceUri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/coldi";
const testUri = new URL(sourceUri);
testUri.pathname = "/coldi_timeline_test";
process.env.MONGODB_URI = testUri.toString();

const { createApp } = await import("../src/app.js");

const password = "test-password-123";
const shipperEmail = "shipper.timeline-test@coldi.local";
const otherShipperEmail = "other-shipper.timeline-test@coldi.local";
const carrierEmail = "carrier.timeline-test@coldi.local";
const otherCarrierEmail = "other-carrier.timeline-test@coldi.local";
const driverEmail = "driver.timeline-test@coldi.local";
const otherDriverEmail = "other-driver.timeline-test@coldi.local";
const adminEmail = "admin.timeline-test@coldi.local";

type Json = Record<string, unknown>;
type EventDto = {
  type: string;
  occurredAt: string;
  actorRole: string;
  actorLabel: string;
  statusAfter: string;
  statusAfterLabel: string;
  recorded: boolean;
  sequence: number;
  detail: string | null;
};
type Timeline = { completeness: string; note: string | null; events: EventDto[] };

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

async function publish(baseUrl: string, cookie: string, cargoDescription: string) {
  return fetch(`${baseUrl}/api/shipments`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie },
    body: JSON.stringify(await withRequiredCargoImage(baseUrl, cookie, {
      cargoDescription,
      pickupLocation: "Cái Bè, Tiền Giang",
      deliveryLocation: "Thủ Đức, TP. Hồ Chí Minh",
      temperatureGroup: "FROZEN",
      vehicleRequirement: "Xe đông lạnh 8 tấn",
      listedPriceVnd: 6200000,
      pickupCompany: "Kho kiểm tra",
      pickupContactName: "Người lấy",
      pickupPhone: "0908123456",
      pickupEmail: "pickup.timeline@example.com",
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
      cargoVolumeM3: 12,
      packageCount: 180,
    })),
  });
}

function claim(baseUrl: string, cookie: string, id: string) {
  return fetch(`${baseUrl}/api/carrier/shipments/${id}/claim`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie },
    body: JSON.stringify({}),
  });
}

function assign(baseUrl: string, cookie: string, id: string, vehicleId: string, driverId: string) {
  return fetch(`${baseUrl}/api/carrier/shipments/${id}/assign`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie },
    body: JSON.stringify({ vehicleId, driverId }),
  });
}

function milestone(baseUrl: string, cookie: string, id: string, action: "pickup" | "delivery") {
  return fetch(`${baseUrl}/api/driver/shipments/${id}/${action}`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie },
    body: JSON.stringify({}),
  });
}

function timelineOf(body: Json): Timeline {
  const shipment = body.shipment as Json;
  return shipment.timeline as Timeline;
}

function typesOf(timeline: Timeline): string[] {
  return timeline.events.map((event) => event.type);
}

before(async () => {
  await mongoose.connect(process.env.MONGODB_URI ?? "");
  if (mongoose.connection.name !== "coldi_timeline_test") {
    throw new Error(`Refusing to use database ${mongoose.connection.name}.`);
  }
  await mongoose.connection.dropDatabase();
  const passwordHash = await hashPassword(password);
  const carrier = await User.create({ email: carrierEmail, passwordHash, role: "CARRIER", displayName: "Nhà xe kiểm tra" });
  const otherCarrier = await User.create({ email: otherCarrierEmail, passwordHash, role: "CARRIER", displayName: "Nhà xe khác" });
  await User.create([
    { email: shipperEmail, passwordHash, role: "SHIPPER", displayName: "Chủ hàng kiểm tra" },
    { email: otherShipperEmail, passwordHash, role: "SHIPPER", displayName: "Chủ hàng khác" },
    { email: driverEmail, passwordHash, role: "DRIVER", carrierId: carrier._id, displayName: "Tài xế kiểm tra" },
    { email: otherDriverEmail, passwordHash, role: "DRIVER", carrierId: otherCarrier._id, displayName: "Tài xế khác" },
    { email: adminEmail, passwordHash, role: "ADMIN", displayName: "Quản trị kiểm tra" },
  ]);
  await Vehicle.create({ carrierId: carrier._id, label: "Xe đông lạnh kiểm tra" });
});

after(async () => {
  if (mongoose.connection.name === "coldi_timeline_test") await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test("publishing records one shipment event", async () => {
  await withServer(async (baseUrl) => {
    const response = await publish(baseUrl, await login(baseUrl, shipperEmail), "Hàng đăng đơn");
    assert.equal(response.status, 201);
    const body = (await response.json()) as Json;
    const shipment = body.shipment as Json;
    const timeline = timelineOf(body);
    assert.equal(shipment.status, "PUBLISHED");
    assert.equal(timeline.completeness, "recorded");
    assert.equal(timeline.note, null);
    assert.deepEqual(typesOf(timeline), ["PUBLISHED"]);
    assert.equal(timeline.events[0]?.actorRole, "SHIPPER");
    assert.equal(timeline.events[0]?.actorLabel, "Chủ hàng");
    assert.equal(timeline.events[0]?.statusAfter, "PUBLISHED");
    assert.equal(timeline.events[0]?.statusAfterLabel, "Đang tìm xe");
    assert.equal(timeline.events[0]?.recorded, true);
    assert.equal(timeline.events[0]?.sequence, 1);
    const stored = await Shipment.findById(shipment.id);
    assert.equal(stored?.events?.length, 1);
    assert.equal(stored?.events?.[0]?.type, "PUBLISHED");
  });
});

test("only the winning claim records a claim event", async () => {
  await withServer(async (baseUrl) => {
    const created = await publish(baseUrl, await login(baseUrl, shipperEmail), "Hàng tranh chấp timeline");
    const createdBody = (await created.json()) as Json;
    const id = String((createdBody.shipment as Json).id);
    const firstCookie = await login(baseUrl, carrierEmail);
    const secondCookie = await login(baseUrl, otherCarrierEmail);
    const [first, second] = await Promise.all([claim(baseUrl, firstCookie, id), claim(baseUrl, secondCookie, id)]);
    const statuses = [first.status, second.status].sort((left, right) => left - right);
    assert.deepEqual(statuses, [200, 409]);
    const stored = await Shipment.findById(id);
    assert.equal(stored?.status, "MATCHED");
    assert.equal(stored?.events?.length, 2);
    assert.deepEqual(
      stored?.events?.map((event) => event.type),
      ["PUBLISHED", "CLAIMED"],
    );
    assert.equal(stored?.events?.[1]?.actorId.toString(), stored?.carrierId?.toString());
    const winnerCookie = stored?.carrierId?.toString() === (await User.findOne({ email: carrierEmail }))?._id.toString() ? firstCookie : secondCookie;
    const detail = await fetch(`${baseUrl}/api/carrier/shipments/${id}`, { headers: { cookie: winnerCookie } });
    const detailBody = (await detail.json()) as Json;
    assert.equal(detail.status, 200);
    const timeline = timelineOf(detailBody);
    assert.deepEqual(typesOf(timeline), ["PUBLISHED", "CLAIMED"]);
    assert.equal(timeline.events[1]?.statusAfter, "MATCHED");
    assert.equal(timeline.events[1]?.statusAfterLabel, "Đã có nhà xe nhận chuyến");
    assert.equal(timeline.events[1]?.actorLabel, "Nhà xe");
    assert.equal(JSON.stringify(detailBody).includes("Chủ hàng kiểm tra"), false);
    assert.equal(JSON.stringify(detailBody).includes("pickup.timeline@example.com"), false);
  });
});

test("assignment, pickup, and delivery record one event each and retries do not duplicate them", async () => {
  await withServer(async (baseUrl) => {
    const shipperCookie = await login(baseUrl, shipperEmail);
    const carrierCookie = await login(baseUrl, carrierEmail);
    const driverCookie = await login(baseUrl, driverEmail);
    const created = await publish(baseUrl, shipperCookie, "Hàng vòng đời timeline");
    const createdBody = (await created.json()) as { shipment: Json };
    const id = String(createdBody.shipment.id);
    assert.equal((await claim(baseUrl, carrierCookie, id)).status, 200);
    const vehicle = await Vehicle.findOne({ label: "Xe đông lạnh kiểm tra" });
    const driver = await User.findOne({ email: driverEmail });
    assert.ok(vehicle && driver);
    const assigned = await assign(baseUrl, carrierCookie, id, vehicle._id.toString(), driver._id.toString());
    assert.equal(assigned.status, 200);
    const assignedBody = (await assigned.json()) as Json;
    assert.equal((assignedBody.shipment as Json).status, "MATCHED");
    assert.equal(timelineOf(assignedBody).events.at(-1)?.type, "ASSIGNED");
    assert.equal(timelineOf(assignedBody).events.at(-1)?.statusAfterLabel, "Chờ lấy hàng");
    assert.equal(timelineOf(assignedBody).events.at(-1)?.detail, "Xe đông lạnh kiểm tra. Tài xế kiểm tra.");
    const repeatedAssign = await assign(baseUrl, carrierCookie, id, vehicle._id.toString(), driver._id.toString());
    assert.equal(repeatedAssign.status, 409);

    const deniedDelivery = await milestone(baseUrl, driverCookie, id, "delivery");
    assert.equal(deniedDelivery.status, 409);
    const [firstPickup, secondPickup] = await Promise.all([
      milestone(baseUrl, driverCookie, id, "pickup"),
      milestone(baseUrl, driverCookie, id, "pickup"),
    ]);
    assert.equal(firstPickup.status, 200);
    assert.equal(secondPickup.status, 200);
    const pickupBodies = [((await firstPickup.json()) as Json).shipment, ((await secondPickup.json()) as Json).shipment] as Json[];
    assert.equal(pickupBodies[0]?.status, "IN_TRANSIT");
    assert.equal(pickupBodies[1]?.status, "IN_TRANSIT");
    assert.equal(pickupBodies[0]?.pickupConfirmedAt, pickupBodies[1]?.pickupConfirmedAt);
    const afterPickup = await Shipment.findById(id);
    assert.equal(afterPickup?.events?.filter((event) => event.type === "PICKUP_CONFIRMED").length, 1);
    assert.equal(afterPickup?.status, "IN_TRANSIT");

    const repeatedPickup = await milestone(baseUrl, driverCookie, id, "pickup");
    assert.equal(repeatedPickup.status, 200);
    const [firstDelivery, secondDelivery] = await Promise.all([
      milestone(baseUrl, driverCookie, id, "delivery"),
      milestone(baseUrl, driverCookie, id, "delivery"),
    ]);
    assert.equal(firstDelivery.status, 200);
    assert.equal(secondDelivery.status, 200);
    const repeatedDelivery = await milestone(baseUrl, driverCookie, id, "delivery");
    assert.equal(repeatedDelivery.status, 200);
    const stored = await Shipment.findById(id);
    assert.equal(stored?.status, "DELIVERY_CONFIRMED");
    assert.notEqual(stored?.status, "COMPLETED");
    assert.deepEqual(
      stored?.events?.map((event) => event.type),
      ["PUBLISHED", "CLAIMED", "ASSIGNED", "PICKUP_CONFIRMED", "DELIVERY_CONFIRMED"],
    );
    assert.deepEqual(
      stored?.events?.map((event) => event.sequence),
      [1, 2, 3, 4, 5],
    );
    assert.equal(stored?.events?.[3]?.occurredAt.toISOString(), stored?.pickupConfirmedAt?.toISOString());
    assert.equal(stored?.events?.[4]?.occurredAt.toISOString(), stored?.deliveryConfirmedAt?.toISOString());
    assert.equal(stored?.events?.[4]?.statusAfter, "DELIVERY_CONFIRMED");

    const shipperView = await fetch(`${baseUrl}/api/shipments/${id}`, { headers: { cookie: shipperCookie } });
    const shipperBody = (await shipperView.json()) as Json;
    const shipperTimeline = timelineOf(shipperBody);
    assert.equal(shipperTimeline.completeness, "recorded");
    assert.equal(shipperTimeline.events.at(-1)?.statusAfterLabel, "Đã xác nhận giao hàng");
    assert.equal(shipperTimeline.events.at(-1)?.detail, "Xác nhận giao hàng chưa phải thanh toán.");
    assert.equal(shipperTimeline.events[1]?.actorLabel, "Nhà xe kiểm tra");
    assert.equal(shipperTimeline.events[3]?.actorLabel, "Tài xế kiểm tra");

    const driverView = await fetch(`${baseUrl}/api/driver/shipments/${id}`, { headers: { cookie: driverCookie } });
    const driverBody = (await driverView.json()) as Json;
    assert.equal(driverView.status, 200);
    assert.equal(timelineOf(driverBody).events[1]?.actorLabel, "Nhà xe kiểm tra");
    assert.equal(JSON.stringify(driverBody).includes("Chủ hàng kiểm tra"), false);
    assert.equal(JSON.stringify(driverBody).includes("pickup.timeline@example.com"), false);
  });
});

test("unauthorized history access and failed validation do not create events", async () => {
  await withServer(async (baseUrl) => {
    const shipperCookie = await login(baseUrl, shipperEmail);
    const created = await publish(baseUrl, shipperCookie, "Hàng phân quyền timeline");
    const id = String(((await created.json()) as { shipment: Json }).shipment.id);
    const carrierCookie = await login(baseUrl, carrierEmail);
    assert.equal((await claim(baseUrl, carrierCookie, id)).status, 200);
    const openId = String(
      (((await (await publish(baseUrl, shipperCookie, "Hàng còn mở")).json()) as { shipment: Json }).shipment.id),
    );

    const guest = await fetch(`${baseUrl}/api/shipments/${id}`);
    assert.equal(guest.status, 401);
    const otherShipper = await fetch(`${baseUrl}/api/shipments/${id}`, { headers: { cookie: await login(baseUrl, otherShipperEmail) } });
    assert.equal(otherShipper.status, 403);
    const adminShipper = await fetch(`${baseUrl}/api/shipments/${id}`, { headers: { cookie: await login(baseUrl, adminEmail) } });
    assert.equal(adminShipper.status, 403);
    const otherCarrier = await fetch(`${baseUrl}/api/carrier/shipments/${id}`, { headers: { cookie: await login(baseUrl, otherCarrierEmail) } });
    assert.equal(otherCarrier.status, 404);
    const openCarrier = await fetch(`${baseUrl}/api/carrier/shipments/${openId}`, { headers: { cookie: await login(baseUrl, otherCarrierEmail) } });
    const openBody = (await openCarrier.json()) as Json;
    assert.equal(openCarrier.status, 200);
    assert.deepEqual(typesOf(timelineOf(openBody)), ["PUBLISHED"]);
    assert.equal(timelineOf(openBody).events[0]?.actorLabel, "Chủ hàng");
    const otherDriver = await fetch(`${baseUrl}/api/driver/shipments/${id}`, { headers: { cookie: await login(baseUrl, otherDriverEmail) } });
    assert.equal(otherDriver.status, 404);
    const driverOnCarrierRoute = await fetch(`${baseUrl}/api/carrier/shipments/${id}`, { headers: { cookie: await login(baseUrl, driverEmail) } });
    assert.equal(driverOnCarrierRoute.status, 403);

    const vehicle = await Vehicle.findOne({ label: "Xe đông lạnh kiểm tra" });
    const driver = await User.findOne({ email: driverEmail });
    assert.ok(vehicle && driver);
    const forged = await fetch(`${baseUrl}/api/driver/shipments/${id}/pickup`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie: await login(baseUrl, driverEmail) },
      body: JSON.stringify({ status: "COMPLETED" }),
    });
    assert.equal(forged.status, 400);
    const badAssign = await assign(baseUrl, carrierCookie, openId, vehicle._id.toString(), driver._id.toString());
    assert.equal(badAssign.status, 403);
    const claimed = await Shipment.findById(id);
    const open = await Shipment.findById(openId);
    assert.deepEqual(
      claimed?.events?.map((event) => event.type),
      ["PUBLISHED", "CLAIMED"],
    );
    assert.deepEqual(
      open?.events?.map((event) => event.type),
      ["PUBLISHED"],
    );
  });
});

test("a legacy shipment without event history stays readable and unchanged", async () => {
  await withServer(async (baseUrl) => {
    const shipper = await User.findOne({ email: shipperEmail });
    const driver = await User.findOne({ email: driverEmail });
    const carrier = await User.findOne({ email: carrierEmail });
    assert.ok(shipper && driver && carrier);
    const sameInstant = new Date("2026-10-01T00:00:00.000Z");
    const legacy = await Shipment.create({
      shipperId: shipper._id,
      cargoDescription: "Đơn cũ chưa có lịch sử",
      pickupLocation: "Bến Lức",
      deliveryLocation: "Biên Hòa",
      temperatureGroup: "COOL",
      vehicleRequirement: "Xe lạnh",
      listedPriceVnd: 1000000,
      status: "DELIVERY_CONFIRMED",
      carrierId: carrier._id,
      driverId: driver._id,
      pickupConfirmedAt: new Date("2026-10-02T01:00:00.000Z"),
      pickupConfirmedBy: driver._id,
      deliveryConfirmedAt: new Date("2026-10-02T05:00:00.000Z"),
      deliveryConfirmedBy: driver._id,
      events: [
        {
          type: "CLAIMED",
          occurredAt: sameInstant,
          actorId: carrier._id,
          actorRole: "CARRIER",
          statusAfter: "MATCHED",
          sequence: 2,
        },
        {
          type: "PUBLISHED",
          occurredAt: sameInstant,
          actorId: shipper._id,
          actorRole: "SHIPPER",
          statusAfter: "PUBLISHED",
          sequence: 1,
        },
      ],
    });
    const ordered = await fetch(`${baseUrl}/api/shipments/${legacy._id.toString()}`, {
      headers: { cookie: await login(baseUrl, shipperEmail) },
    });
    const orderedBody = (await ordered.json()) as Json;
    assert.deepEqual(typesOf(timelineOf(orderedBody)), ["PUBLISHED", "CLAIMED"]);
    assert.deepEqual(
      timelineOf(orderedBody).events.map((event) => event.sequence),
      [1, 2],
    );

    const partial = await Shipment.create({
      shipperId: shipper._id,
      cargoDescription: "Đơn cũ chỉ có mốc đã lưu",
      pickupLocation: "Bến Lức",
      deliveryLocation: "Biên Hòa",
      temperatureGroup: "COOL",
      vehicleRequirement: "Xe lạnh",
      listedPriceVnd: 1000000,
      status: "DELIVERY_CONFIRMED",
      pickupConfirmedAt: new Date("2026-10-03T01:00:00.000Z"),
      pickupConfirmedBy: driver._id,
      deliveryConfirmedAt: new Date("2026-10-03T05:00:00.000Z"),
      deliveryConfirmedBy: driver._id,
    });
    const beforeRead = await Shipment.findById(partial._id).lean();
    const response = await fetch(`${baseUrl}/api/shipments/${partial._id.toString()}`, {
      headers: { cookie: await login(baseUrl, shipperEmail) },
    });
    const body = (await response.json()) as Json;
    const timeline = timelineOf(body);
    assert.equal(response.status, 200);
    assert.equal((body.shipment as Json).status, "DELIVERY_CONFIRMED");
    assert.equal(timeline.completeness, "partial");
    assert.equal(timeline.note?.includes("không được suy diễn"), true);
    assert.deepEqual(typesOf(timeline), ["PUBLISHED", "PICKUP_CONFIRMED", "DELIVERY_CONFIRMED"]);
    assert.equal(timeline.events.every((event) => event.recorded === false), true);
    assert.equal(timeline.events[1]?.occurredAt, "2026-10-03T01:00:00.000Z");
    assert.equal(timeline.events[2]?.actorLabel, "Tài xế kiểm tra");
    const reread = await Shipment.findById(partial._id).lean();
    assert.deepEqual(reread?.events ?? null, beforeRead?.events ?? null);
    assert.equal(reread?.status, "DELIVERY_CONFIRMED");
    assert.equal(reread?.pickupConfirmedAt?.toISOString(), "2026-10-03T01:00:00.000Z");
  });
});
