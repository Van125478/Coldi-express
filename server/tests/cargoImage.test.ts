import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import test, { before, after } from "node:test";
import mongoose from "mongoose";
import { hashPassword } from "../src/auth/password.js";
import { HttpError } from "../src/middlewares/errorHandler.js";
import { CargoImage } from "../src/models/cargoImage.js";
import { CommissionLedgerEvent } from "../src/models/commissionLedger.js";
import { Shipment } from "../src/models/shipment.js";
import { User } from "../src/models/user.js";
import { cargoStorageRoot } from "../src/shipments/cargoImages.js";
import { TINY_PNG } from "./support/cargoImage.js";

process.env.PORT ??= "4000";
process.env.FRONTEND_ORIGIN ??= "http://127.0.0.1:5173";
process.env.NODE_ENV = "test";
process.env.AUTH_SECRET ??= "test-secret-that-is-at-least-32-characters";
delete process.env.CARGO_IMAGE_DIR;

const sourceUri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/coldi";
const testUri = new URL(sourceUri);
testUri.pathname = "/coldi_cargo_image_test";
process.env.MONGODB_URI = testUri.toString();

const { createApp } = await import("../src/app.js");

const password = "test-password-123";
const shipperEmail = "shipper.cargo-test@coldi.local";
const otherShipperEmail = "other-shipper.cargo-test@coldi.local";
const carrierEmail = "carrier.cargo-test@coldi.local";
const otherCarrierEmail = "other-carrier.cargo-test@coldi.local";
const driverEmail = "driver.cargo-test@coldi.local";
const otherDriverEmail = "other-driver.cargo-test@coldi.local";
const tinyJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
const tinyWebp = Buffer.concat([Buffer.from("RIFF"), Buffer.from([12, 0, 0, 0]), Buffer.from("WEBP"), Buffer.from("VP8 ")]);

type Json = Record<string, unknown>;

let driverId = "";

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

function upload(baseUrl: string, cookie: string, type: string, bytes: Buffer) {
  return fetch(`${baseUrl}/api/cargo-images`, {
    method: "POST",
    headers: { origin: "http://127.0.0.1:5173", cookie, "content-type": type },
    body: bytes,
  });
}

const publishFields = {
  cargoDescription: "Hàng kiểm tra ảnh",
  pickupLocation: "Cái Bè, Tiền Giang",
  deliveryLocation: "Thủ Đức, TP. Hồ Chí Minh",
  temperatureGroup: "FROZEN",
  vehicleRequirement: "Xe đông lạnh 8 tấn",
  listedPriceVnd: 6200000,
  pickupCompany: "Kho kiểm tra",
  pickupContactName: "Người lấy",
  pickupPhone: "0908123456",
  pickupEmail: "pickup.cargo@example.com",
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
};

function publish(baseUrl: string, cookie: string, extra: Json = {}) {
  return fetch(`${baseUrl}/api/shipments`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie },
    body: JSON.stringify({ ...publishFields, ...extra }),
  });
}

before(async () => {
  await mongoose.connect(process.env.MONGODB_URI ?? "");
  if (mongoose.connection.name !== "coldi_cargo_image_test") throw new Error(`Refusing to use database ${mongoose.connection.name}.`);
  await mongoose.connection.dropDatabase();
  const passwordHash = await hashPassword(password);
  const carrier = await User.create({ email: carrierEmail, passwordHash, role: "CARRIER", displayName: "Nhà xe ảnh" });
  const otherCarrier = await User.create({ email: otherCarrierEmail, passwordHash, role: "CARRIER", displayName: "Nhà xe khác" });
  const driver = await User.create({ email: driverEmail, passwordHash, role: "DRIVER", carrierId: carrier._id, displayName: "Tài xế ảnh" });
  driverId = driver._id.toString();
  await User.create([
    { email: shipperEmail, passwordHash, role: "SHIPPER", displayName: "Chủ hàng ảnh" },
    { email: otherShipperEmail, passwordHash, role: "SHIPPER", displayName: "Chủ hàng khác" },
    { email: otherDriverEmail, passwordHash, role: "DRIVER", carrierId: otherCarrier._id, displayName: "Tài xế khác" },
  ]);
});

after(async () => {
  if (mongoose.connection.name === "coldi_cargo_image_test") await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test("uploads accept matching JPG PNG and WebP bytes and hide the storage key", async () => {
  await withServer(async (baseUrl) => {
    const shipper = await login(baseUrl, shipperEmail);
    const carrier = await login(baseUrl, carrierEmail);
    assert.equal((await upload(baseUrl, "", "image/png", TINY_PNG)).status, 401);
    assert.equal((await upload(baseUrl, carrier, "image/png", TINY_PNG)).status, 403);
    assert.equal((await upload(baseUrl, shipper, "image/gif", TINY_PNG)).status, 400);
    assert.equal((await upload(baseUrl, shipper, "image/jpeg", TINY_PNG)).status, 400);
    assert.equal((await upload(baseUrl, shipper, "image/png", Buffer.alloc(0))).status, 400);
    assert.equal((await upload(baseUrl, shipper, "image/png", Buffer.from("../../secret"))).status, 400);
    const oversized = Buffer.alloc(2_000_001);
    oversized[0] = 0xff;
    oversized[1] = 0xd8;
    oversized[2] = 0xff;
    assert.equal((await upload(baseUrl, shipper, "image/jpeg", oversized)).status, 413);
    const ledgerBefore = await CommissionLedgerEvent.countDocuments();
    const created = await upload(baseUrl, shipper, "image/png", TINY_PNG);
    assert.equal(created.status, 201);
    const body = (await created.json()) as Json;
    const image = body.image as Json;
    assert.equal(image.contentType, "image/png");
    assert.equal(typeof image.id, "string");
    assert.equal("storageKey" in image, false);
    assert.equal(JSON.stringify(body).includes("coldi-cargo-images"), false);
    const stored = await CargoImage.findById(String(image.id));
    assert.match(stored?.storageKey ?? "", /^[a-f0-9]{32}$/);
    assert.equal(JSON.stringify(body).includes(stored?.storageKey ?? "missing-key"), false);
    assert.equal((await upload(baseUrl, shipper, "image/jpeg", tinyJpeg)).status, 201);
    assert.equal((await upload(baseUrl, shipper, "image/webp", tinyWebp)).status, 201);
    assert.equal(await CommissionLedgerEvent.countDocuments(), ledgerBefore);
  });
});

async function uploadId(baseUrl: string, cookie: string): Promise<string> {
  const uploaded = await upload(baseUrl, cookie, "image/png", TINY_PNG);
  assert.equal(uploaded.status, 201);
  const body = (await uploaded.json()) as Json;
  return String((body.image as Json).id);
}

test("a new shipment requires one to five owned images and keeps the listed price", async () => {
  await withServer(async (baseUrl) => {
    const shipper = await login(baseUrl, shipperEmail);
    const otherShipper = await login(baseUrl, otherShipperEmail);
    const before = await Shipment.countDocuments();
    const ledgerBefore = await CommissionLedgerEvent.countDocuments();
    const missing = await publish(baseUrl, shipper);
    assert.equal(missing.status, 400);
    const missingBody = (await missing.json()) as Json;
    assert.equal(typeof ((missingBody.error as Json).fields as Json).cargoImageIds, "string");
    assert.equal(await Shipment.countDocuments(), before);
    const ids: string[] = [];
    for (let index = 0; index < 6; index += 1) ids.push(await uploadId(baseUrl, shipper));
    const tooMany = await publish(baseUrl, shipper, { cargoImageIds: ids });
    assert.equal(tooMany.status, 400);
    const first = ids[0];
    const second = ids[1];
    assert.ok(first && second);
    const duplicate = await publish(baseUrl, shipper, { cargoImageIds: [first, first] });
    assert.equal(duplicate.status, 400);
    const foreign = await uploadId(baseUrl, otherShipper);
    const stolen = await publish(baseUrl, shipper, { cargoImageIds: [foreign] });
    assert.equal(stolen.status, 400);
    const created = await publish(baseUrl, shipper, { cargoImageIds: [first] });
    assert.equal(created.status, 201);
    const shipment = ((await created.json()) as Json).shipment as Json;
    assert.equal(shipment.listedPriceVnd, 6200000);
    assert.deepEqual(shipment.cargoImages, [{ id: first }]);
    assert.equal(JSON.stringify(shipment).includes("storageKey"), false);
    const stored = await Shipment.findById(String(shipment.id));
    assert.equal(stored?.listedPriceVnd, 6200000);
    assert.equal(stored?.commission ?? null, null);
    const reused = await publish(baseUrl, shipper, { cargoImageIds: [first] });
    assert.equal(reused.status, 400);
    const removed = await fetch(`${baseUrl}/api/cargo-images/${second}`, {
      method: "DELETE",
      headers: { origin: "http://127.0.0.1:5173", cookie: shipper },
    });
    assert.equal(removed.status, 204);
    const attached = await fetch(`${baseUrl}/api/cargo-images/${first}`, {
      method: "DELETE",
      headers: { origin: "http://127.0.0.1:5173", cookie: shipper },
    });
    assert.equal(attached.status, 404);
    assert.equal(await CommissionLedgerEvent.countDocuments(), ledgerBefore);
  });
});

test("only the owner, marketplace, claimed carrier, and assigned driver can read an image", async () => {
  await withServer(async (baseUrl) => {
    const shipper = await login(baseUrl, shipperEmail);
    const otherShipper = await login(baseUrl, otherShipperEmail);
    const carrier = await login(baseUrl, carrierEmail);
    const otherCarrier = await login(baseUrl, otherCarrierEmail);
    const driver = await login(baseUrl, driverEmail);
    const otherDriver = await login(baseUrl, otherDriverEmail);
    const imageId = await uploadId(baseUrl, shipper);
    const privateRead = await fetch(`${baseUrl}/api/cargo-images/${imageId}`, { headers: { cookie: otherShipper } });
    assert.equal(privateRead.status, 404);
    const ownerRead = await fetch(`${baseUrl}/api/cargo-images/${imageId}`, { headers: { cookie: shipper } });
    assert.equal(ownerRead.status, 200);
    assert.equal(ownerRead.headers.get("cache-control"), "private, no-store");
    assert.equal(ownerRead.headers.get("x-content-type-options"), "nosniff");
    assert.deepEqual(Buffer.from(await ownerRead.arrayBuffer()), TINY_PNG);
    const created = await publish(baseUrl, shipper, { cargoImageIds: [imageId] });
    assert.equal(created.status, 201);
    const shipment = ((await created.json()) as Json).shipment as Json;
    const shipmentId = String(shipment.id);
    const board = await fetch(`${baseUrl}/api/carrier/shipments`, { headers: { cookie: carrier } });
    const listed = ((await board.json()) as Json).shipments as Json[];
    assert.equal(listed.some((item) => item.id === shipmentId && JSON.stringify(item.cargoImages) === JSON.stringify([{ id: imageId }])), true);
    assert.equal((await fetch(`${baseUrl}/api/cargo-images/${imageId}`, { headers: { cookie: carrier } })).status, 200);
    const storedImage = await CargoImage.findById(imageId);
    assert.match(storedImage?.storageKey ?? "", /^[a-f0-9]{32}$/);
    assert.equal((await fetch(`${baseUrl}/api/cargo-images/${storedImage?.storageKey}`, { headers: { cookie: shipper } })).status, 404);
    const shipperRecord = await User.findOne({ email: shipperEmail });
    const legacy = await Shipment.create({
      shipperId: shipperRecord?._id,
      cargoDescription: "Đơn cũ không ảnh",
      pickupLocation: "Cái Bè",
      deliveryLocation: "Thủ Đức",
      temperatureGroup: "FROZEN",
      vehicleRequirement: "Xe đông lạnh",
      listedPriceVnd: 4100000,
      status: "PUBLISHED",
    });
    const legacyRead = await fetch(`${baseUrl}/api/shipments/${legacy._id.toString()}`, { headers: { cookie: shipper } });
    const legacyBody = ((await legacyRead.json()) as Json).shipment as Json;
    assert.equal(legacyRead.status, 200);
    assert.deepEqual(legacyBody.cargoImages, []);
    assert.equal(legacyBody.listedPriceVnd, 4100000);
    const claimed = await fetch(`${baseUrl}/api/carrier/shipments/${shipmentId}/claim`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie: carrier },
      body: JSON.stringify({}),
    });
    assert.equal(claimed.status, 200);
    assert.equal((await fetch(`${baseUrl}/api/cargo-images/${imageId}`, { headers: { cookie: otherCarrier } })).status, 404);
    assert.equal((await fetch(`${baseUrl}/api/cargo-images/${imageId}`, { headers: { cookie: carrier } })).status, 200);
    const detail = await fetch(`${baseUrl}/api/carrier/shipments/${shipmentId}`, { headers: { cookie: carrier } });
    const detailBody = ((await detail.json()) as Json).shipment as Json;
    assert.deepEqual(detailBody.cargoImages, [{ id: imageId }]);
    assert.equal(detailBody.listedPriceVnd, 6200000);
    await Shipment.updateOne({ _id: shipmentId }, { $set: { driverId } });
    assert.equal((await fetch(`${baseUrl}/api/cargo-images/${imageId}`, { headers: { cookie: driver } })).status, 200);
    assert.equal((await fetch(`${baseUrl}/api/cargo-images/${imageId}`, { headers: { cookie: otherDriver } })).status, 404);
    assert.equal((await fetch(`${baseUrl}/api/cargo-images/${imageId}`)).status, 401);
  });
});

test("production without a configured directory refuses uploads, and orphan cleanup keeps attached images", async () => {
  const previousEnv = process.env.NODE_ENV;
  const previousDir = process.env.CARGO_IMAGE_DIR;
  try {
    process.env.NODE_ENV = "production";
    delete process.env.CARGO_IMAGE_DIR;
    assert.throws(
      () => cargoStorageRoot(),
      (error: unknown) => error instanceof HttpError && error.status === 503 && error.code === "cargo_storage_unavailable",
    );
    process.env.CARGO_IMAGE_DIR = "relative-cargo";
    assert.throws(
      () => cargoStorageRoot(),
      (error: unknown) => error instanceof HttpError && error.status === 503 && error.code === "cargo_storage_unavailable",
    );
  } finally {
    process.env.NODE_ENV = previousEnv;
    if (previousDir === undefined) delete process.env.CARGO_IMAGE_DIR;
    else process.env.CARGO_IMAGE_DIR = previousDir;
  }

  await withServer(async (baseUrl) => {
    const shipper = await login(baseUrl, shipperEmail);
    const imageId = await uploadId(baseUrl, shipper);
    const created = await publish(baseUrl, shipper, { cargoImageIds: [imageId] });
    assert.equal(created.status, 201);
    await CargoImage.collection.updateOne({ _id: new mongoose.Types.ObjectId(imageId) }, { $set: { createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000) } });
    const freshId = await uploadId(baseUrl, shipper);
    assert.equal((await fetch(`${baseUrl}/api/cargo-images/${imageId}`, { headers: { cookie: shipper } })).status, 200);
    assert.equal((await fetch(`${baseUrl}/api/cargo-images/${freshId}`, { headers: { cookie: shipper } })).status, 200);
    await CargoImage.collection.updateOne({ _id: new mongoose.Types.ObjectId(freshId) }, { $set: { createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000) } });
    const replacement = await uploadId(baseUrl, shipper);
    assert.equal((await fetch(`${baseUrl}/api/cargo-images/${freshId}`, { headers: { cookie: shipper } })).status, 404);
    assert.equal((await fetch(`${baseUrl}/api/cargo-images/${replacement}`, { headers: { cookie: shipper } })).status, 200);
    const otherShipper = await login(baseUrl, otherShipperEmail);
    const removed = await fetch(`${baseUrl}/api/cargo-images/${replacement}`, {
      method: "DELETE",
      headers: { origin: "http://127.0.0.1:5173", cookie: otherShipper },
    });
    assert.equal(removed.status, 404);
  });
});
