import { Router } from "express";

import {
  getCurrentUser,
  getRankingsByUserId,
  getUserById,
  updateCurrentUser
} from "../controllers/userController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { updateUserProfileSchema } from "../schemas/userSchemas.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/me", requireAuth, asyncHandler(getCurrentUser));
router.patch("/me", requireAuth, validateRequest(updateUserProfileSchema), asyncHandler(updateCurrentUser));
router.get("/:userId/rankings", requireAuth, asyncHandler(getRankingsByUserId));
router.get("/:userId", requireAuth, asyncHandler(getUserById));

export default router;
