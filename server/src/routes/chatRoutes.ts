import { Router } from "express";

import { postChat } from "../controllers/chatController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/", requireAuth, asyncHandler(postChat));

export default router;
