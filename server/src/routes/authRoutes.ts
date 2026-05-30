import { Router } from "express";

import { getMe, logout, syncSession } from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { authRateLimiter } from "../middleware/securityMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/session", authRateLimiter, requireAuth, asyncHandler(syncSession));
router.get("/me", requireAuth, asyncHandler(getMe));
router.post("/logout", logout);

export default router;
