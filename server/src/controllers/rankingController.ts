import type { Request, Response } from "express";

import { HttpError } from "../middleware/errorHandler.js";
import type { CreateCommentInput, CreateRankingInput, UpdateRankingInput } from "../schemas/rankingSchemas.js";
import {
  addComment,
  createRanking,
  listFeedRankings,
  listNearbyRankings,
  updateRanking,
  uploadRankingMedia
} from "../services/studySpotService.js";

function getRequiredAuthUser(req: Request): Express.AuthenticatedUser {
  if (!req.user) {
    throw new HttpError(401, "Authentication is required.");
  }

  return req.user;
}

export async function getFeedRankings(req: Request, res: Response): Promise<void> {
  getRequiredAuthUser(req);

  const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : 50;
  const latitude = typeof req.query.latitude === "string" ? Number(req.query.latitude) : undefined;
  const longitude = typeof req.query.longitude === "string" ? Number(req.query.longitude) : undefined;
  const radiusMeters = typeof req.query.radiusMeters === "string" ? Number(req.query.radiusMeters) : 250;

  if (
    (latitude !== undefined && !Number.isFinite(latitude)) ||
    (longitude !== undefined && !Number.isFinite(longitude)) ||
    !Number.isFinite(radiusMeters) ||
    radiusMeters <= 0
  ) {
    throw new HttpError(400, "latitude, longitude, and radiusMeters must be valid numbers.");
  }

  if (
    (latitude === undefined && longitude !== undefined) ||
    (latitude !== undefined && longitude === undefined)
  ) {
    throw new HttpError(400, "latitude and longitude must be provided together.");
  }

  const safeLimit = Number.isFinite(limit) ? limit : 50;
  if (latitude === undefined && longitude === undefined) {
    const rankings = await listFeedRankings(safeLimit);
    res.json({ rankings });
    return;
  }

  const rankings = await listNearbyRankings({
    latitude: latitude as number,
    longitude: longitude as number,
    radiusMeters,
    limit: safeLimit
  });

  res.json({ rankings });
}

export async function postRanking(req: Request, res: Response): Promise<void> {
  const authUser = getRequiredAuthUser(req);
  const uploadedMedia = await uploadRankingMedia(authUser.uid, req.files as Express.Multer.File[] | undefined);
  const ranking = await createRanking(authUser.uid, {
    ...(req.body as CreateRankingInput),
    media: uploadedMedia.length > 0 ? uploadedMedia : (req.body as CreateRankingInput).media
  });

  res.status(201).json({ ranking });
}

export async function patchRanking(req: Request, res: Response): Promise<void> {
  const authUser = getRequiredAuthUser(req);
  const rankingIdParam = req.params.rankingId;

  if (!rankingIdParam || Array.isArray(rankingIdParam)) {
    throw new HttpError(400, "rankingId is required.");
  }

  const uploadedMedia = await uploadRankingMedia(authUser.uid, req.files as Express.Multer.File[] | undefined);
  const currentMedia = (req.body as UpdateRankingInput).media ?? [];
  const ranking = await updateRanking(authUser.uid, rankingIdParam, {
    ...(req.body as UpdateRankingInput),
    media: [...currentMedia, ...uploadedMedia]
  });

  res.json({ ranking });
}

export async function postComment(req: Request, res: Response): Promise<void> {
  const authUser = getRequiredAuthUser(req);
  const rankingIdParam = req.params.rankingId;

  if (!rankingIdParam || Array.isArray(rankingIdParam)) {
    throw new HttpError(400, "rankingId is required.");
  }

  const comment = await addComment(authUser.uid, rankingIdParam, req.body as CreateCommentInput);

  res.status(201).json({ comment });
}
