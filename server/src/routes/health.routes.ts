import { Router } from "express";
import { databaseStatus } from "../config/database.js";

export const healthRouter = Router();

healthRouter.get("/", (_request, response) => {
  const database = databaseStatus();
  const ready = database === "connected";

  response.status(ready ? 200 : 503).json({
    status: ready ? "ok" : "degraded",
    service: "coldi-api",
    database,
  });
});
