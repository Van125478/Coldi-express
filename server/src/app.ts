import cors from "cors";
import express from "express";
import helmet from "helmet";
import { getEnv } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { requireAuth } from "./middlewares/requireAuth.js";
import { requireRole } from "./middlewares/requireRole.js";
import { authRouter } from "./routes/auth.routes.js";
import { healthRouter } from "./routes/health.routes.js";
import { shipmentRouter } from "./routes/shipment.routes.js";

export function createApp() {
  const env = getEnv();
  const app = express();

  app.disable("x-powered-by");
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(
    cors({
      origin: env.FRONTEND_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/shipments", shipmentRouter);
  if (env.NODE_ENV === "test") {
    app.get("/api/test/shipper-only", requireAuth, requireRole("SHIPPER"), (_request, response) => {
      response.status(200).json({ ok: true });
    });
  }
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
