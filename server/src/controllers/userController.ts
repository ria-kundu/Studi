import type { Request, Response } from "express";

import { HttpError } from "../middleware/errorHandler.js";
import type { UpdateUserProfileInput } from "../schemas/userSchemas.js";
import { getPublicUserProfile, listUserRankings } from "../services/studySpotService.js";
import {followUser, getUserProfile, listFollowers, listFollowing, serializeUserProfile, unfollowUser, updateCurrentUserProfile} from "../services/userService.js";

function getRequiredAuthUser(req: Request): Express.AuthenticatedUser {
  if (!req.user) {
    throw new HttpError(401, "Authentication is required.");
  }

  return req.user;
}

export async function followUserById(req: Request, res: Response): Promise<void> {
  const authUser = getRequiredAuthUser(req);

  const userId = req.params.userId;
  if (!userId || Array.isArray(userId)) {
    throw new HttpError(400, "userId is required.");
  }

  const result = await followUser(authUser.uid, userId);

  res.json(result);
}

export async function unfollowUserById(req: Request, res: Response): Promise<void> {
  const authUser = getRequiredAuthUser(req);

  const userId = req.params.userId;
  if (!userId || Array.isArray(userId)) {
    throw new HttpError(400, "userId is required.");
  }

  const result = await unfollowUser(authUser.uid, userId);

  res.json(result);
}

export async function getUserFollowers(req: Request, res: Response): Promise<void> {
  getRequiredAuthUser(req);

  const userId = req.params.userId;
  if (!userId || Array.isArray(userId)) {
    throw new HttpError(400, "userId is required.");
  }

  const followers = await listFollowers(userId);

  res.json({ followers });
}

export async function getUserFollowing(req: Request, res: Response): Promise<void> {
  getRequiredAuthUser(req);

  const userId = req.params.userId;
  if (!userId || Array.isArray(userId)) {
    throw new HttpError(400, "userId is required.");
  }

  const following = await listFollowing(userId);

  res.json({ following });
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

export async function getUserById(req: Request, res: Response): Promise<void> {
  getRequiredAuthUser(req);

  const userId = req.params.userId;
  if (!userId || Array.isArray(userId)) {
    throw new HttpError(400, "userId is required.");
  }

  const user = await getPublicUserProfile(userId);

  res.json({ user });
}

export async function getRankingsByUserId(req: Request, res: Response): Promise<void> {
  getRequiredAuthUser(req);

  const userId = req.params.userId;
  if (!userId || Array.isArray(userId)) {
    throw new HttpError(400, "userId is required.");
  }

  const rankings = await listUserRankings(userId);

  res.json({ rankings });
}
