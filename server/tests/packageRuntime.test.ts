import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import test from "node:test";
import { getEnv, packageRuntimeError } from "../src/config/env.js";

process.env.PORT ??= "4000";
process.env.FRONTEND_ORIGIN ??= "http://127.0.0.1:5173";
process.env.NODE_ENV = "test";
process.env.AUTH_SECRET ??= "test-secret-that-is-at-least-32-characters";
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/coldi_package_runtime_test";
process.env.PACKAGE_DEMO_SELF_ACTIVATION_ENABLED = "false";
delete process.env.APP_RUNTIME_MODE;
delete process.env.PACKAGE_DEMO_DEPLOYMENT_ID;
delete process.env.PACKAGE_DEMO_AUTHORIZED_DEPLOYMENT_ID;

const baseEnv = {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  APP_RUNTIME_MODE: process.env.APP_RUNTIME_MODE,
  PACKAGE_DEMO_SELF_ACTIVATION_ENABLED: process.env.PACKAGE_DEMO_SELF_ACTIVATION_ENABLED,
  PACKAGE_DEMO_DEPLOYMENT_ID: process.env.PACKAGE_DEMO_DEPLOYMENT_ID,
  PACKAGE_DEMO_AUTHORIZED_DEPLOYMENT_ID: process.env.PACKAGE_DEMO_AUTHORIZED_DEPLOYMENT_ID,
  MONGODB_URI: process.env.MONGODB_URI,
};

test("production demo configuration fails closed", () => {
  assert.equal(
    packageRuntimeError({
      nodeEnv: "production",
      runtimeMode: "production",
      demoFlag: true,
      deploymentId: "qa-package-test",
      authorizedDeploymentId: "qa-package-test",
      databaseName: "coldi_package_test",
    }),
    "Production cannot enable package demo self-activation. Refusing to start.",
  );
  assert.match(
    packageRuntimeError({
      nodeEnv: "test",
      runtimeMode: "development",
      demoFlag: true,
      deploymentId: "qa-package-test",
      authorizedDeploymentId: "qa-package-test",
      databaseName: "coldi_package_test",
    }) ?? "",
    /NODE_ENV alone/,
  );
  assert.match(
    packageRuntimeError({
      nodeEnv: "test",
      runtimeMode: "qa",
      demoFlag: true,
      deploymentId: "qa-package-test",
      authorizedDeploymentId: "qa-package-test",
      databaseName: "coldi",
    }) ?? "",
    /disposable database/,
  );

  process.env.NODE_ENV = "production";
  process.env.APP_RUNTIME_MODE = "qa";
  process.env.PACKAGE_DEMO_SELF_ACTIVATION_ENABLED = "false";
  try {
    assert.throws(() => getEnv(), /Refusing to start/);
  } finally {
    restoreEnv();
  }
});

test("demo activation route is absent unless the deployment is authorized", async () => {
  const { createApp } = await import("../src/app.js");
  const server = createServer(createApp());
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("Test server did not bind.");
  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/packages/my-plan/demo-activate`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://127.0.0.1:5173" },
      body: JSON.stringify({ planCode: "shipper-pro-monthly", idempotencyKey: "runtime-key-1" }),
    });
    assert.equal(response.status, 404);
  } finally {
    server.close();
    await once(server, "close");
  }
});

function restoreEnv() {
  for (const [key, value] of Object.entries(baseEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}
