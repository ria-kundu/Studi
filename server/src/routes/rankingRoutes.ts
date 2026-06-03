import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import multer from "multer";

import { getFeedRankings, patchRanking, postComment, postRanking } from "../controllers/rankingController.js";
import { HttpError } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { createCommentSchema, createRankingSchema, updateRankingSchema } from "../schemas/rankingSchemas.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 8
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
      cb(null, true);
      return;
    }

    cb(new HttpError(400, "Only image and video uploads are supported."));
  }
});

function optionalNumber(value: unknown): number | undefined {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }

  return Number(value);
}

function normalizeMultipartRanking(req: Request, res: Response, next: NextFunction): void {
  if (!req.is("multipart/form-data")) {
    next();
    return;
  }

  upload.array("mediaFiles", 8)(req, res, (error) => {
    if (error) {
      next(error);
      return;
    }

    req.body = {
      spotName: req.body.spotName,
      category: req.body.category,
      quietness: Number(req.body.quietness),
      restroom: Number(req.body.restroom),
      wifi: Number(req.body.wifi),
      outlets: Number(req.body.outlets),
      crowdness: Number(req.body.crowdness),
      seating: Number(req.body.seating),
      latitude: optionalNumber(req.body.latitude),
      longitude: optionalNumber(req.body.longitude),
      hours: req.body.hours,
      notes: req.body.notes ?? "",
      media: []
    };

    next();
  });
}

function parseMedia(value: unknown): unknown[] {
  if (typeof value !== "string" || value.trim() === "") {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeMultipartRankingUpdate(req: Request, res: Response, next: NextFunction): void {
  if (!req.is("multipart/form-data")) {
    next();
    return;
  }

  upload.array("mediaFiles", 8)(req, res, (error) => {
    if (error) {
      next(error);
      return;
    }

    req.body = {
      quietness: Number(req.body.quietness),
      restroom: Number(req.body.restroom),
      wifi: Number(req.body.wifi),
      outlets: Number(req.body.outlets),
      crowdness: Number(req.body.crowdness),
      seating: Number(req.body.seating),
      media: parseMedia(req.body.media)
    };

    next();
  });
}

router.get("/feed", requireAuth, asyncHandler(getFeedRankings));
router.post("/", requireAuth, normalizeMultipartRanking, validateRequest(createRankingSchema), asyncHandler(postRanking));
router.patch(
  "/:rankingId",
  requireAuth,
  normalizeMultipartRankingUpdate,
  validateRequest(updateRankingSchema),
  asyncHandler(patchRanking)
);
router.post("/:rankingId/comments", requireAuth, validateRequest(createCommentSchema), asyncHandler(postComment));

export default router;
