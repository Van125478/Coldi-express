import { withRequiredCargoImage } from "./support/cargoImage.js";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import test, { before, after } from "node:test";
import mongoose from "mongoose";
import { hashPassword } from "../src/auth/password.js";
import { Conversation } from "../src/models/conversation.js";
import { Message } from "../src/models/message.js";
import { Shipment } from "../src/models/shipment.js";
import { User } from "../src/models/user.js";

process.env.PORT ??= "4000";
process.env.FRONTEND_ORIGIN ??= "http://127.0.0.1:5173";
process.env.NODE_ENV = "test";
process.env.AUTH_SECRET ??= "test-secret-that-is-at-least-32-characters";

const sourceUri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/coldi";
const testUri = new URL(sourceUri);
testUri.pathname = "/coldi_chat_test";
process.env.MONGODB_URI = testUri.toString();

const { createApp } = await import("../src/app.js");

const password = "test-password-123";
const shipperEmail = "shipper.chat-test@coldi.local";
const otherShipperEmail = "other-shipper.chat-test@coldi.local";
const carrierEmail = "carrier.chat-test@coldi.local";
const otherCarrierEmail = "other-carrier.chat-test@coldi.local";
const driverEmail = "driver.chat-test@coldi.local";

type Json = Record<string, unknown>;

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

async function publish(baseUrl: string, cookie: string) {
  const response = await fetch(`${baseUrl}/api/shipments`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie },
    body: JSON.stringify(await withRequiredCargoImage(baseUrl, cookie, {
      cargoDescription: "Hàng kiểm tra chat",
      pickupLocation: "Cái Bè, Tiền Giang",
      deliveryLocation: "Thủ Đức, TP. Hồ Chí Minh",
      temperatureGroup: "FROZEN",
      vehicleRequirement: "Xe đông lạnh 8 tấn",
      listedPriceVnd: 6200000,
      pickupCompany: "Kho kiểm tra",
      pickupContactName: "Người lấy",
      pickupPhone: "0908123456",
      pickupEmail: "pickup.chat@example.com",
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
  assert.equal(response.status, 201);
  return ((await response.json()) as Json).shipment as Json;
}

function openChat(baseUrl: string, cookie: string, shipmentId: string, extra: Json = {}) {
  return fetch(`${baseUrl}/api/carrier/conversations/by-shipment/${shipmentId}`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie },
    body: JSON.stringify(extra),
  });
}

function openAsShipper(baseUrl: string, cookie: string, shipmentId: string, extra: Json = {}) {
  return fetch(`${baseUrl}/api/shipments/${shipmentId}/conversations`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie },
    body: JSON.stringify(extra),
  });
}

function send(baseUrl: string, cookie: string, conversationId: string, body: string, extra: Json = {}) {
  return fetch(`${baseUrl}/api/carrier/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie },
    body: JSON.stringify({ body, ...extra }),
  });
}

before(async () => {
  await mongoose.connect(process.env.MONGODB_URI ?? "");
  if (mongoose.connection.name !== "coldi_chat_test") throw new Error(`Refusing to use database ${mongoose.connection.name}.`);
  await mongoose.connection.dropDatabase();
  const passwordHash = await hashPassword(password);
  const carrier = await User.create({ email: carrierEmail, passwordHash, role: "CARRIER", displayName: "Nhà xe A" });
  await User.create([
    { email: shipperEmail, passwordHash, role: "SHIPPER", displayName: "Chủ hàng kiểm tra" },
    { email: otherShipperEmail, passwordHash, role: "SHIPPER", displayName: "Chủ hàng khác" },
    { email: otherCarrierEmail, passwordHash, role: "CARRIER", displayName: "Nhà xe B" },
    { email: driverEmail, passwordHash, role: "DRIVER", carrierId: carrier._id, displayName: "Tài xế kiểm tra" },
  ]);
});

after(async () => {
  if (mongoose.connection.name === "coldi_chat_test") await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test("two carriers keep private threads and chat does not claim or reprice the shipment", async () => {
  await withServer(async (baseUrl) => {
    const shipper = await login(baseUrl, shipperEmail);
    const carrierA = await login(baseUrl, carrierEmail);
    const carrierB = await login(baseUrl, otherCarrierEmail);
    const shipment = await publish(baseUrl, shipper);
    const id = String(shipment.id);
    const openedA = await openChat(baseUrl, carrierA, id);
    const openedB = await openChat(baseUrl, carrierB, id);
    assert.equal(openedA.status, 200);
    assert.equal(openedB.status, 200);
    const conversationA = String((((await openedA.json()) as Json).conversation as Json).id);
    const conversationB = String((((await openedB.json()) as Json).conversation as Json).id);
    assert.notEqual(conversationA, conversationB);
    const secret = "TIN-RIENG-A hàng đông";
    const sent = await send(baseUrl, carrierA, conversationA, secret);
    assert.equal(sent.status, 201);
    const reply = await fetch(`${baseUrl}/api/shipments/${id}/conversations/${conversationA}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie: shipper },
      body: JSON.stringify({ body: "Chủ hàng đã nhận tin" }),
    });
    assert.equal(reply.status, 201);
    const readA = await fetch(`${baseUrl}/api/carrier/conversations/${conversationA}/messages`, { headers: { cookie: carrierA } });
    const messagesA = ((await readA.json()) as Json).messages as Json[];
    assert.deepEqual(messagesA.map((item) => item.sequence), [1, 2]);
    assert.equal(messagesA[0]?.body, secret);
    assert.equal(messagesA[1]?.senderRole, "SHIPPER");
    const hidden = await fetch(`${baseUrl}/api/carrier/conversations/${conversationA}/messages`, { headers: { cookie: carrierB } });
    assert.equal(hidden.status, 404);
    const listed = await fetch(`${baseUrl}/api/shipments/${id}/conversations`, { headers: { cookie: shipper } });
    const conversations = ((await listed.json()) as Json).conversations as Json[];
    assert.equal(conversations.length, 2);
    assert.equal(conversations.some((item) => item.carrierLabel === "Nhà xe A"), true);
    assert.equal(conversations.some((item) => item.carrierLabel === "Nhà xe B"), true);
    const stored = await Shipment.findById(id);
    assert.equal(stored?.status, "PUBLISHED");
    assert.equal(stored?.listedPriceVnd, 6200000);
    assert.equal(stored?.carrierId ?? null, null);
    assert.equal(stored?.driverId ?? null, null);
    assert.equal(stored?.vehicleId ?? null, null);
    assert.deepEqual(stored?.events?.map((event) => event.type), ["PUBLISHED"]);
    assert.equal(stored?.latestLocation ?? null, null);
    const board = await fetch(`${baseUrl}/api/carrier/shipments`, { headers: { cookie: carrierB } });
    assert.equal((await board.text()).includes(secret), false);
    const claimed = await fetch(`${baseUrl}/api/carrier/shipments/${id}/claim`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie: carrierA },
      body: JSON.stringify({}),
    });
    assert.equal(claimed.status, 200);
    const loser = await send(baseUrl, carrierB, conversationB, "Vẫn muốn nhận");
    assert.equal(loser.status, 409);
    const loserRead = await fetch(`${baseUrl}/api/carrier/conversations/${conversationB}/messages`, { headers: { cookie: carrierB } });
    const loserBody = (await loserRead.json()) as Json;
    assert.equal(loserRead.status, 200);
    assert.equal(loserBody.writable, false);
    const winner = await send(baseUrl, carrierA, conversationA, "Đã nhận chuyến, vẫn trao đổi được");
    assert.equal(winner.status, 201);
    const afterClaim = await Shipment.findById(id);
    assert.equal(afterClaim?.status, "MATCHED");
    assert.equal(afterClaim?.events?.some((event) => event.type === "CLAIMED"), true);
    assert.equal(afterClaim?.events?.some((event) => String(event.type).includes("CHAT")), false);
  });
});

test("unauthorized roles, forged identity, and invalid messages are rejected", async () => {
  await withServer(async (baseUrl) => {
    const shipper = await login(baseUrl, shipperEmail);
    const otherShipper = await login(baseUrl, otherShipperEmail);
    const carrier = await login(baseUrl, carrierEmail);
    const driver = await login(baseUrl, driverEmail);
    const shipment = await publish(baseUrl, shipper);
    const id = String(shipment.id);
    const opened = await openChat(baseUrl, carrier, id);
    const conversationId = String((((await opened.json()) as Json).conversation as Json).id);
    const blank = await send(baseUrl, carrier, conversationId, "   ");
    assert.equal(blank.status, 400);
    const huge = await send(baseUrl, carrier, conversationId, "à".repeat(2001));
    assert.equal(huge.status, 400);
    const forged = await send(baseUrl, carrier, conversationId, "Xin chào", { senderId: "someone-else" });
    assert.equal(forged.status, 400);
    const forgedCarrier = await openChat(baseUrl, carrier, id, { carrierId: "other" });
    assert.equal(forgedCarrier.status, 400);
    const guest = await openChat(baseUrl, "", id);
    assert.equal(guest.status, 401);
    const driverOpen = await openChat(baseUrl, driver, id);
    assert.equal(driverOpen.status, 403);
    const otherList = await fetch(`${baseUrl}/api/shipments/${id}/conversations`, { headers: { cookie: otherShipper } });
    assert.equal(otherList.status, 404);
    const missing = await fetch(`${baseUrl}/api/carrier/conversations/not-an-id/messages`, { headers: { cookie: carrier } });
    assert.equal(missing.status, 404);
    const kept = await Message.countDocuments({ conversationId });
    assert.equal(kept, 0);
  });
});

test("the owning shipper opens one conversation with the carrier that claimed the shipment", async () => {
  await withServer(async (baseUrl) => {
    const shipper = await login(baseUrl, shipperEmail);
    const otherShipper = await login(baseUrl, otherShipperEmail);
    const carrier = await login(baseUrl, carrierEmail);
    const otherCarrier = await login(baseUrl, otherCarrierEmail);
    const driver = await login(baseUrl, driverEmail);
    const shipment = await publish(baseUrl, shipper);
    const id = String(shipment.id);
    const beforeClaim = await openAsShipper(baseUrl, shipper, id);
    assert.equal(beforeClaim.status, 409);
    const carrierFirst = await openChat(baseUrl, carrier, id);
    assert.equal(carrierFirst.status, 200);
    const existingId = String((((await carrierFirst.json()) as Json).conversation as Json).id);
    const claimed = await fetch(`${baseUrl}/api/carrier/shipments/${id}/claim`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie: carrier },
      body: JSON.stringify({}),
    });
    assert.equal(claimed.status, 200);
    const forged = await openAsShipper(baseUrl, shipper, id, { carrierId: "other-carrier" });
    assert.equal(forged.status, 400);
    const [opened, again] = await Promise.all([openAsShipper(baseUrl, shipper, id), openAsShipper(baseUrl, shipper, id)]);
    assert.equal(opened.status, 200);
    assert.equal(again.status, 200);
    const firstBody = (await opened.json()) as Json;
    const secondBody = (await again.json()) as Json;
    const conversationId = String((firstBody.conversation as Json).id);
    assert.equal(conversationId, existingId);
    assert.equal(String((secondBody.conversation as Json).id), conversationId);
    assert.equal(await Conversation.countDocuments({ shipmentId: id, carrierId: { $exists: true } }), 1);
    const sent = await fetch(`${baseUrl}/api/shipments/${id}/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173", cookie: shipper },
      body: JSON.stringify({ body: "Chủ hàng mở trao đổi sau khi nhà xe nhận đơn" }),
    });
    assert.equal(sent.status, 201);
    const reloaded = await fetch(`${baseUrl}/api/shipments/${id}/conversations/${conversationId}/messages`, { headers: { cookie: shipper } });
    const messages = ((await reloaded.json()) as Json).messages as Json[];
    assert.equal(reloaded.status, 200);
    assert.equal(messages.some((item) => item.body === "Chủ hàng mở trao đổi sau khi nhà xe nhận đơn"), true);
    assert.equal((await openAsShipper(baseUrl, otherShipper, id)).status, 404);
    assert.equal((await openAsShipper(baseUrl, driver, id)).status, 403);
    assert.equal((await openAsShipper(baseUrl, otherCarrier, id)).status, 403);
    const stored = await Shipment.findById(id);
    assert.equal(stored?.listedPriceVnd, 6200000);
    assert.ok(stored?.carrierId);
  });
});

test("concurrent opens create one conversation and concurrent sends keep every message", async () => {
  await withServer(async (baseUrl) => {
    const shipper = await login(baseUrl, shipperEmail);
    const carrier = await login(baseUrl, carrierEmail);
    const shipment = await publish(baseUrl, shipper);
    const id = String(shipment.id);
    const [first, second] = await Promise.all([openChat(baseUrl, carrier, id), openChat(baseUrl, carrier, id)]);
    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    const left = String((((await first.json()) as Json).conversation as Json).id);
    const right = String((((await second.json()) as Json).conversation as Json).id);
    assert.equal(left, right);
    assert.equal(await Conversation.countDocuments({ shipmentId: id }), 1);
    const sent = await Promise.all([1, 2, 3, 4, 5].map((number) => send(baseUrl, carrier, left, `Tin ${number}`)));
    assert.equal(sent.every((response) => response.status === 201), true);
    const stored = await Message.find({ conversationId: left }).sort({ sequence: 1 });
    assert.deepEqual(stored.map((item) => item.sequence), [1, 2, 3, 4, 5]);
    assert.equal(new Set(stored.map((item) => item.body)).size, 5);
  });
});
