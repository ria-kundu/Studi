import type { Request, Response } from "express";

import { HttpError } from "../middleware/errorHandler.js";
import type { UpdateUserProfileInput } from "../schemas/userSchemas.js";
import { getUserProfile, serializeUserProfile, updateCurrentUserProfile } from "../services/userService.js";

function getRequiredAuthUser(req: Request): Express.AuthenticatedUser {
  if (!req.user) {
    throw new HttpError(401, "Authentication is required.");
  }

  return req.user;
}

export async function getCurrentUser(req: Request, res: Response): Promise<void> {
  const authUser = getRequiredAuthUser(req);
  const profile = await getUserProfile(authUser.uid);

  if (!profile) {
    throw new HttpError(404, "User profile not found. Call POST /api/auth/session after Firebase login.");
  }

  res.json({
    user: serializeUserProfile(profile)
  });
}

export async function updateCurrentUser(req: Request, res: Response): Promise<void> {
  const authUser = getRequiredAuthUser(req);
  const updates = req.body as UpdateUserProfileInput;
  const profile = await updateCurrentUserProfile(authUser.uid, updates);

  res.json({
    user: serializeUserProfile(profile)
  });
}
