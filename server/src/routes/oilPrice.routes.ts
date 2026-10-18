import { Router } from "express";
import { readOilPrices, unavailableOilPrices } from "../market/oil/read.js";

export const oilPriceRouter = Router();

oilPriceRouter.get("/", async (_request, response) => {
  try {
    const body = await readOilPrices(new Date());
    response.set("Cache-Control", "public, max-age=300");
    response.status(200).json(body);
  } catch (error) {
    console.error("Oil price read failed.", error instanceof Error ? error.name : "error");
    response.set("Cache-Control", "no-store");
    response.status(200).json(unavailableOilPrices());
  }
});
