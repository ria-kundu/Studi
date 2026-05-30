import type { Request, Response } from "express";

import { HttpError } from "../middleware/errorHandler.js";
import type { CreateCommentInput, CreateRankingInput } from "../schemas/rankingSchemas.js";
import { addComment, createRanking, listFeedRankings } from "../services/studySpotService.js";

function getRequiredAuthUser(req: Request): Express.AuthenticatedUser {
  if (!req.user) {
    throw new HttpError(401, "Authentication is required.");
  }

  return req.user;
}

export async function getFeedRankings(req: Request, res: Response): Promise<void> {
  getRequiredAuthUser(req);

  const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : 50;
  const rankings = await listFeedRankings(Number.isFinite(limit) ? limit : 50);

  res.json({ rankings });
}

export async function postRanking(req: Request, res: Response): Promise<void> {
  const authUser = getRequiredAuthUser(req);
  const ranking = await createRanking(authUser.uid, req.body as CreateRankingInput);

  res.status(201).json({ ranking });
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
