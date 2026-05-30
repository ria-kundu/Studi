import { Router } from "express";

import { getRankingsForSpot, getSpotById, getSpots } from "../controllers/spotController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", requireAuth, asyncHandler(getSpots));
router.get("/:spotId/rankings", requireAuth, asyncHandler(getRankingsForSpot));
router.get("/:spotId", requireAuth, asyncHandler(getSpotById));

export default router;
