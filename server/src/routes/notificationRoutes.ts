import { Router } from "express";

import { streamNotifications } from "../controllers/notificationController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/stream", asyncHandler(streamNotifications));

export default router;
