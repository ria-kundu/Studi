import type { Request, Response } from "express";

import { HttpError } from "../middleware/errorHandler.js";
import { getSpot, listSpotRankings, searchSpots } from "../services/studySpotService.js";

function requireAuthenticatedRequest(req: Request): void {
  if (!req.user) {
    throw new HttpError(401, "Authentication is required.");
  }
}

export async function getSpots(req: Request, res: Response): Promise<void> {
  requireAuthenticatedRequest(req);

  const query = typeof req.query.q === "string" ? req.query.q : "";
  const spots = await searchSpots(query);

  res.json({ spots });
}

export async function getSpotById(req: Request, res: Response): Promise<void> {
  requireAuthenticatedRequest(req);

  const spotId = req.params.spotId;
  if (!spotId || Array.isArray(spotId)) {
    throw new HttpError(400, "spotId is required.");
  }

  const spot = await getSpot(spotId);

  res.json({ spot });
}

export async function getRankingsForSpot(req: Request, res: Response): Promise<void> {
  requireAuthenticatedRequest(req);

  const spotId = req.params.spotId;
  if (!spotId || Array.isArray(spotId)) {
    throw new HttpError(400, "spotId is required.");
  }

  const rankings = await listSpotRankings(spotId);

  res.json({ rankings });
}
