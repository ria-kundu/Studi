import type { Request, Response } from "express";
import { z } from "zod";

import { HttpError } from "../middleware/errorHandler.js";
import { generateStudySpotRecommendation } from "../services/geminiService.js";
import {
  listFeedRankings,
  listNearbyRankings,
  listUserRankings
} from "../services/studySpotService.js";

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  text: z.string().trim().min(1).max(2000)
});

const chatRequestSchema = z.object({
  message: z.string().trim().min(1).max(1000),
  history: z.array(chatMessageSchema).max(12).optional(),
  latitude: z.number().finite().optional(),
  longitude: z.number().finite().optional(),
  searchMode: z.enum(["nearby", "campus", "all"]).optional(),
  radiusMeters: z.number().finite().positive().max(10000).optional()
});

function getRequiredAuthUser(req: Request): Express.AuthenticatedUser {
  if (!req.user) {
    throw new HttpError(401, "Authentication is required.");
  }

  return req.user;
}

export async function postChat(req: Request, res: Response): Promise<void> {
  const authUser = getRequiredAuthUser(req);
  const input = chatRequestSchema.parse(req.body);

    const searchMode = input.searchMode ?? "nearby";

    let nearbyRankings;

    if (searchMode === "all") {
    nearbyRankings = await listFeedRankings(100);
    } else if (input.latitude !== undefined && input.longitude !== undefined) {
    nearbyRankings = await listNearbyRankings({
        latitude: input.latitude,
        longitude: input.longitude,
        radiusMeters: input.radiusMeters ?? (searchMode === "campus" ? 5000 : 1600),
        limit: searchMode === "campus" ? 50 : 25
    });
    } else {
    nearbyRankings = await listFeedRankings(searchMode === "campus" ? 50 : 25);
    }

    const userRankings = await listUserRankings(authUser.uid);

    const reply = await generateStudySpotRecommendation({
    message: input.message,
    history: input.history ?? [],
    latitude: input.latitude,
    longitude: input.longitude,
    searchMode,
    radiusMeters: searchMode === "all" ? undefined : input.radiusMeters ?? (searchMode === "campus" ? 5000 : 1600),
    nearbyRankings,
    userRankings
    });

    res.json({
    reply,
    context: {
        searchMode,
        radiusMeters: searchMode === "all" ? null : input.radiusMeters ?? (searchMode === "campus" ? 5000 : 1600),
        nearbyRankingCount: nearbyRankings.length,
        userRankingCount: userRankings.length
    }
    });
}
