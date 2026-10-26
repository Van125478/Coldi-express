import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import test, { before, after } from "node:test";
import mongoose from "mongoose";
import { hashPassword } from "../src/auth/password.js";
import { Shipment } from "../src/models/shipment.js";
import { ShipmentReview } from "../src/models/shipmentReview.js";
import { User } from "../src/models/user.js";
import { withRequiredCargoImage } from "./support/cargoImage.js";

process.env.PORT ??= "4000";
process.env.FRONTEND_ORIGIN = "http://127.0.0.1:5173";
process.env.NODE_ENV = "test";
process.env.AUTH_SECRET ??= "test-secret-that-is-at-least-32-characters";
process.env.APP_RUNTIME_MODE = "development";
process.env.PACKAGE_DEMO_SELF_ACTIVATION_ENABLED = "false";
process.env.COMMISSION_SIMULATION_ENABLED = "false";
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/coldi_mobile_catalog_test";

const databaseName = "coldi_mobile_catalog_test";
const forbidden = new Set(["coldi", "admin", "local", "config", "coldi_v210_package_qa", "coldi_commission_qa_20261018"]);
const { createApp } = await import("../src/app.js");

const password = "test-password-123";
const shipperEmail = "shipper.mobile-catalog@coldi.local";
const otherShipperEmail = "other-shipper.mobile-catalog@coldi.local";
const carrierEmail = "carrier.mobile-catalog@coldi.local";
const otherCarrierEmail = "other-carrier.mobile-catalog@coldi.local";
const driverEmail = "driver.mobile-catalog@coldi.local";
const privateEmail = "rieng-email-mobile@coldi.local";
const origin = "http://127.0.0.1:5173";

type Json = Record<string, unknown>;

const baseOrder = {
  pickupCompany: "Kho lạnh",
  pickupContactName: "Người giao",
  pickupPhone: "0908111222",
  pickupEmail: privateEmail,
  pickupTimeFrom: "08:00",
  pickupTimeTo: "10:00",
  deliveryCompany: "Kho nhận",
  deliveryContactName: "Người nhận",
  deliveryPhone: "0918333444",
  deliveryEmail: "kho-nhan@coldi.local",
  deliveryTimeFrom: "14:00",
  deliveryTimeTo: "16:00",
  cargoWeightTon: 2,
  cargoVolumeM3: 4,
  packageCount: 10,
  vehicleRequirement: "Xe đông lạnh",
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
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(response.status, 200);
  const cookie = response.headers.getSetCookie().find((value) => value.startsWith("coldi_session="));
  assert.ok(cookie);
  return cookie.split(";")[0] ?? "";
}

function request(baseUrl: string, path: string, cookie: string | null, method = "GET", body?: unknown) {
  return fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      origin,
      ...(body === undefined ? {} : { "content-type": "application/json" }),
      ...(cookie ? { cookie } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

async function publish(baseUrl: string, cookie: string, order: Json) {
  const response = await request(
    baseUrl,
    "/api/shipments",
    cookie,
    "POST",
    await withRequiredCargoImage(baseUrl, cookie, { ...baseOrder, ...order }),
  );
  assert.equal(response.status, 201);
  const body = (await response.json()) as { shipment: Json };
  return body.shipment;
}

before(async () => {
  await mongoose.connect(process.env.MONGODB_URI ?? "", { serverSelectionTimeoutMS: 4000 });
  if (mongoose.connection.name !== databaseName || forbidden.has(mongoose.connection.name)) {
    throw new Error(`Refusing to use database ${mongoose.connection.name}.`);
  }
  await mongoose.connection.dropDatabase();
  const passwordHash = await hashPassword(password);
  await User.create([
    { email: shipperEmail, passwordHash, role: "SHIPPER", displayName: "Chủ hàng mobile" },
    { email: otherShipperEmail, passwordHash, role: "SHIPPER", displayName: "Chủ hàng khác" },
    { email: carrierEmail, passwordHash, role: "CARRIER", displayName: "Nhà xe mobile" },
    { email: otherCarrierEmail, passwordHash, role: "CARRIER", displayName: "Nhà xe khác" },
    { email: driverEmail, passwordHash, role: "DRIVER", displayName: "Tài xế mobile" },
  ]);
});

after(async () => {
  if (mongoose.connection.name === databaseName && !forbidden.has(mongoose.connection.name)) {
    await mongoose.connection.dropDatabase();
  }
  await mongoose.disconnect();
});

test("mobile catalog filters, searches, and sorts cold shipments without exposing private fields", async () => {
  await withServer(async (baseUrl) => {
    const shipper = await login(baseUrl, shipperEmail);
    const otherShipper = await login(baseUrl, otherShipperEmail);
    const carrier = await login(baseUrl, carrierEmail);
    const driver = await login(baseUrl, driverEmail);
    const cool = await publish(baseUrl, shipper, {
      cargoDescription: "Rau mát Cần Thơ",
      pickupLocation: "Cần Thơ",
      deliveryLocation: "Cà Mau",
      temperatureGroup: "COOL",
      listedPriceVnd: 3_000_000,
      pickupDate: "2026-11-02",
      deliveryDate: "2026-11-02",
    });
    const deep = await publish(baseUrl, shipper, {
      cargoDescription: "Cá ngừ cực lạnh",
      pickupLocation: "Phú Quốc",
      deliveryLocation: "Hà Nội",
      temperatureGroup: "DEEP_FROZEN",
      listedPriceVnd: 12_000_000,
      pickupDate: "2026-11-04",
      deliveryDate: "2026-11-06",
    });

    const board = await request(baseUrl, "/api/mobile/shipments", carrier);
    assert.equal(board.status, 200);
    const boardBody = (await board.json()) as { shipments: Json[] };
    const ids = boardBody.shipments.map((item) => item.id);
    assert.ok(ids.indexOf(deep.id) !== -1 && ids.indexOf(deep.id) < ids.indexOf(cool.id));
    const deepCard = boardBody.shipments.find((item) => item.id === deep.id);
    assert.equal(deepCard?.deepFrozen, true);
    assert.equal(deepCard?.temperatureLabel, "Cực lạnh");
    assert.equal(boardBody.shipments.find((item) => item.id === cool.id)?.deepFrozen, false);
    const serialized = JSON.stringify(boardBody);
    assert.equal(serialized.includes(privateEmail), false);
    assert.equal(serialized.includes("shipperId"), false);
    assert.equal(serialized.includes("percentOff"), false);
    assert.equal(serialized.includes("latitude"), false);

    const filtered = await request(baseUrl, "/api/mobile/shipments?temperature=DEEP_FROZEN&q=Ph%C3%BA%20Qu%E1%BB%91c", carrier);
    assert.equal(filtered.status, 200);
    const filteredBody = (await filtered.json()) as { shipments: Json[] };
    assert.deepEqual(
      filteredBody.shipments.map((item) => item.id),
      [deep.id],
    );

    const own = await request(baseUrl, "/api/mobile/shipments", shipper);
    assert.equal(own.status, 200);
    const ownBody = (await own.json()) as { shipments: Json[] };
    const ownIds = ownBody.shipments.map((item) => item.id);
    assert.ok(ownIds.includes(cool.id));
    assert.ok(ownIds.includes(deep.id));

    const hidden = await request(baseUrl, `/api/mobile/shipments/${String(deep.id)}`, otherShipper);
    assert.equal(hidden.status, 404);

    const driverList = await request(baseUrl, "/api/mobile/shipments", driver);
    assert.equal(driverList.status, 403);
  });
});

test("favorites can be saved once, listed, removed, and cleared", async () => {
  await withServer(async (baseUrl) => {
    const shipper = await login(baseUrl, shipperEmail);
    const carrier = await login(baseUrl, carrierEmail);
    const otherShipper = await login(baseUrl, otherShipperEmail);
    const shipment = await publish(baseUrl, shipper, {
      cargoDescription: "Thịt đông Bình Dương",
      pickupLocation: "Bình Dương",
      deliveryLocation: "Đà Lạt",
      temperatureGroup: "FROZEN",
      listedPriceVnd: 6_000_000,
      pickupDate: "2026-11-08",
      deliveryDate: "2026-11-08",
    });
    const id = String(shipment.id);

    const saved = await request(baseUrl, "/api/mobile/favorites", carrier, "POST", { shipmentId: id });
    assert.equal(saved.status, 201);
    const again = await request(baseUrl, "/api/mobile/favorites", carrier, "POST", { shipmentId: id });
    assert.equal(again.status, 409);

    const outsider = await request(baseUrl, "/api/mobile/favorites", otherShipper, "POST", { shipmentId: id });
    assert.equal(outsider.status, 404);

    const list = await request(baseUrl, "/api/mobile/favorites", carrier);
    assert.equal(list.status, 200);
    const listBody = (await list.json()) as { shipments: Json[] };
    assert.deepEqual(
      listBody.shipments.map((item) => item.id),
      [id],
    );

    const removed = await request(baseUrl, `/api/mobile/favorites/${id}`, carrier, "DELETE");
    assert.equal(removed.status, 200);
    const empty = await request(baseUrl, "/api/mobile/favorites", carrier);
    const emptyBody = (await empty.json()) as { shipments: Json[] };
    assert.equal(emptyBody.shipments.length, 0);

    await request(baseUrl, "/api/mobile/favorites", carrier, "POST", { shipmentId: id });
    const cleared = await request(baseUrl, "/api/mobile/favorites", carrier, "DELETE");
    assert.equal(cleared.status, 200);
    const clearedBody = (await cleared.json()) as { removed: number };
    assert.equal(clearedBody.removed, 1);
  });
});

test("a shipper rates a delivered trip once and reviews stay with that trip", async () => {
  await withServer(async (baseUrl) => {
    const shipper = await login(baseUrl, shipperEmail);
    const carrier = await login(baseUrl, carrierEmail);
    const otherCarrier = await login(baseUrl, otherCarrierEmail);
    const carrierUser = await User.findOne({ email: carrierEmail });
    assert.ok(carrierUser);
    const shipment = await publish(baseUrl, shipper, {
      cargoDescription: "Kem đã giao",
      pickupLocation: "Biên Hòa",
      deliveryLocation: "Vũng Tàu",
      temperatureGroup: "FROZEN",
      listedPriceVnd: 8_000_000,
      pickupDate: "2026-11-12",
      deliveryDate: "2026-11-12",
    });
    const id = String(shipment.id);

    const tooEarly = await request(baseUrl, `/api/mobile/shipments/${id}/reviews`, shipper, "POST", {
      stars: 5,
      comment: "Giao đúng giờ.",
    });
    assert.equal(tooEarly.status, 409);

    await Shipment.updateOne(
      { _id: id },
      { status: "DELIVERY_CONFIRMED", carrierId: carrierUser._id, deliveryConfirmedAt: new Date() },
    );

    const created = await request(baseUrl, `/api/mobile/shipments/${id}/reviews`, shipper, "POST", {
      stars: 4,
      comment: "Hàng vẫn đông khi giao.",
    });
    assert.equal(created.status, 201);
    const duplicate = await request(baseUrl, `/api/mobile/shipments/${id}/reviews`, shipper, "POST", {
      stars: 1,
      comment: "Đánh giá lần hai.",
    });
    assert.equal(duplicate.status, 409);

    const detail = await request(baseUrl, `/api/mobile/shipments/${id}`, carrier);
    assert.equal(detail.status, 200);
    const detailBody = (await detail.json()) as { shipment: Json; reviewSummary: { total: number; groups: Json[] } };
    assert.equal(detailBody.shipment.listedPriceVnd, 8_000_000);
    assert.equal(detailBody.shipment.status, "DELIVERY_CONFIRMED");
    assert.equal(detailBody.reviewSummary.total, 1);
    assert.deepEqual(detailBody.reviewSummary.groups, [{ stars: 4, count: 1 }]);

    const hidden = await request(baseUrl, `/api/mobile/shipments/${id}/reviews`, otherCarrier);
    assert.equal(hidden.status, 404);
    const stored = await Shipment.findById(id);
    assert.equal(stored?.listedPriceVnd, 8_000_000);
    assert.equal(await ShipmentReview.countDocuments({ shipmentId: id }), 1);
  });
});
