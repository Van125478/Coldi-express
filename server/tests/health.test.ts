import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import test from "node:test";

process.env.PORT ??= "4000";
process.env.MONGODB_URI ??= "mongodb://127.0.0.1:27017/coldi";
process.env.FRONTEND_ORIGIN ??= "http://127.0.0.1:5173";
process.env.NODE_ENV ??= "test";

const { createApp } = await import("../src/app.js");

async function withServer(run: (baseUrl: string) => Promise<void>) {
  const server = createServer(createApp());
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("Test server did not bind to a TCP port.");
  }

  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    server.close();
    await once(server, "close");
  }
}

test("health reports the database as unavailable when Mongoose is disconnected", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/health`);
    const body: unknown = await response.json();

    assert.equal(response.status, 503);
    assert.deepEqual(body, {
      status: "degraded",
      service: "coldi-api",
      database: "unavailable",
    });
  });
});

test("unknown routes return a JSON error without a stack trace", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/missing`);
    const body: unknown = await response.json();

    assert.equal(response.status, 404);
    assert.deepEqual(body, {
      error: {
        code: "not_found",
        message: "Route not found.",
      },
    });
    assert.equal(JSON.stringify(body).includes("stack"), false);
  });
});
