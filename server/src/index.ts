import "dotenv/config";
import { createServer } from "node:http";
import { createApp } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { getEnv } from "./config/env.js";
import { reconcileAllFleetCapacities } from "./packages/fleetCapacity.js";

const env = getEnv();
const app = createApp();
const server = createServer(app);

const connected = await connectDatabase(env.MONGODB_URI);
if (!connected) {
  console.error("MongoDB is unavailable. GET /api/health will report the database as unavailable.");
} else {
  try {
    await reconcileAllFleetCapacities();
  } catch (error) {
    console.error("Fleet capacity reconcile did not finish.", error);
  }
}

server.listen(env.PORT, () => {
  console.log(`COLDI API listening on port ${env.PORT}.`);
});

let shuttingDown = false;

async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Received ${signal}. Shutting down.`);

  const forceTimer = setTimeout(() => {
    console.error("Shutdown timed out.");
    process.exit(1);
  }, 10_000);
  forceTimer.unref();

  server.close(async () => {
    try {
      await disconnectDatabase();
      clearTimeout(forceTimer);
      process.exit(0);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  });
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
