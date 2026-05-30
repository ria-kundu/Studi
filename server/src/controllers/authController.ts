import type { Request, Response } from "express";

import { HttpError } from "../middleware/errorHandler.js";
import { createOrUpdateUserFromAuth, getUserProfile, serializeUserProfile } from "../services/userService.js";

function getRequiredAuthUser(req: Request): Express.AuthenticatedUser {
  if (!req.user) {
    throw new HttpError(401, "Authentication is required.");
  }

  return req.user;
}

export async function syncSession(req: Request, res: Response): Promise<void> {
  const authUser = getRequiredAuthUser(req);
  const profile = await createOrUpdateUserFromAuth(authUser);

  res.status(200).json({
    user: serializeUserProfile(profile)
  });
}

export async function getMe(req: Request, res: Response): Promise<void> {
  const authUser = getRequiredAuthUser(req);
  const profile = await getUserProfile(authUser.uid);

  if (!profile) {
    const createdProfile = await createOrUpdateUserFromAuth(authUser);
    res.status(201).json({
      user: serializeUserProfile(createdProfile),
      onboardingRequired: true
    });
    return;
  }

  res.json({
    user: serializeUserProfile(profile)
  });
}

export function logout(_req: Request, res: Response): void {
  res.json({
    success: true,
    message:
      "This API uses Firebase bearer ID tokens. The client should sign out from Firebase Auth and discard cached ID tokens."
  });
}
