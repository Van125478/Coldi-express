import { Router } from "express";
import express from "express";
import { readIncidentEvidence, deleteUnattachedIncidentEvidence, INCIDENT_EVIDENCE_LIMITS, storeIncidentEvidence } from "../incidents/evidence.js";
import { HttpError } from "../middlewares/errorHandler.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireOperationalSession } from "../middlewares/requireOperational.js";
import { requireTrustedOrigin } from "../middlewares/requireOrigin.js";
import { requireRole } from "../middlewares/requireRole.js";

export const incidentEvidenceRouter = Router();

incidentEvidenceRouter.use(requireAuth, requireOperationalSession);

incidentEvidenceRouter.post(
  "/",
  requireTrustedOrigin,
  requireRole("SHIPPER", "CARRIER", "DRIVER"),
  express.raw({ type: [...INCIDENT_EVIDENCE_LIMITS.formats], limit: INCIDENT_EVIDENCE_LIMITS.maxBytes }),
  async (request, response, next) => {
    try {
      const ownerId = request.authUser?.id;
      if (!ownerId) throw new HttpError(401, "unauthenticated", "Cần đăng nhập để tiếp tục.");
      if (!Buffer.isBuffer(request.body)) {
        throw new HttpError(400, "invalid_request", "Ảnh chứng cứ chỉ nhận JPG, PNG hoặc WebP.", { evidenceIds: "Ảnh chứng cứ chỉ nhận JPG, PNG hoặc WebP." });
      }
      const declared = request.header("content-type")?.split(";")[0]?.trim().toLowerCase() ?? "";
      const image = await storeIncidentEvidence(ownerId, declared, request.body);
      response.status(201).json({ image });
    } catch (error) {
      next(error);
    }
  },
);

incidentEvidenceRouter.get("/:id", async (request, response, next) => {
  try {
    const user = request.authUser;
    if (!user) throw new HttpError(401, "unauthenticated", "Cần đăng nhập để tiếp tục.");
    const imageId = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
    if (!imageId) throw new HttpError(404, "not_found", "Không tìm thấy ảnh chứng cứ.");
    const file = await readIncidentEvidence(imageId, { id: user.id, role: user.role });
    response.setHeader("Content-Type", file.contentType);
    response.setHeader("Content-Disposition", "inline; filename=\"chung-cu\"");
    response.setHeader("Cache-Control", "private, no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.status(200).send(file.bytes);
  } catch (error) {
    next(error);
  }
});

incidentEvidenceRouter.delete("/:id", requireTrustedOrigin, requireRole("SHIPPER", "CARRIER", "DRIVER"), async (request, response, next) => {
  try {
    const ownerId = request.authUser?.id;
    if (!ownerId) throw new HttpError(401, "unauthenticated", "Cần đăng nhập để tiếp tục.");
    const imageId = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
    if (!imageId) throw new HttpError(404, "not_found", "Không tìm thấy ảnh chứng cứ.");
    await deleteUnattachedIncidentEvidence(imageId, ownerId);
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});
