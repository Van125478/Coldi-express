import cors from "cors";
import express from "express";
import helmet from "helmet";
import { getEnv } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { healthRouter } from "./routes/health.routes.js";

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
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
