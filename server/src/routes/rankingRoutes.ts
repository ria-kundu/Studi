import { Router } from "express";

import { getFeedRankings, postComment, postRanking } from "../controllers/rankingController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { createCommentSchema, createRankingSchema } from "../schemas/rankingSchemas.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/feed", requireAuth, asyncHandler(getFeedRankings));
router.post("/", requireAuth, validateRequest(createRankingSchema), asyncHandler(postRanking));
router.post("/:rankingId/comments", requireAuth, validateRequest(createCommentSchema), asyncHandler(postComment));

export default router;
