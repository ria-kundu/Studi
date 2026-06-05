import { GoogleGenAI } from "@google/genai";

import { HttpError } from "../middleware/errorHandler.js";
import type { RankingResponse } from "./studySpotService.js";

const apiKey = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({
  apiKey: apiKey ?? ""
});

interface ChatHistoryMessage {
  role: "user" | "assistant";
  text: string;
}

interface GenerateRecommendationInput {
  message: string;
  history: ChatHistoryMessage[];
  latitude?: number;
  longitude?: number;
  searchMode: "nearby" | "campus" | "all";
  radiusMeters?: number;
  nearbyRankings: RankingResponse[];
  userRankings: RankingResponse[];
}

function formatHistory(history: ChatHistoryMessage[]): string {
  if (history.length === 0) {
    return "No previous messages in this session.";
  }

  return history
    .map(message => `${message.role}: ${message.text}`)
    .join("\n");
}

function simplifyRanking(ranking: RankingResponse) {
  return {
    id: ranking.id,
    spotId: ranking.spotId,
    spotName: ranking.spotName,
    category: ranking.category,
    quietness: ranking.quietness,
    restroom: ranking.restroom,
    wifi: ranking.wifi,
    outlets: ranking.outlets,
    crowdness: ranking.crowdness,
    seating: ranking.seating,
    latitude: ranking.latitude,
    longitude: ranking.longitude,
    hours: ranking.hours,
    notes: ranking.notes,
    overallScore: ranking.overallScore,
    timestamp: ranking.timestamp
  };
}

export async function generateStudySpotRecommendation(input: GenerateRecommendationInput): Promise<string> {
  if (!apiKey) {
    throw new HttpError(500, "Gemini is not configured.");
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `
You are StudySpot Assistant.

Recommend UCLA study spots using only the provided database ranking data.
Do not invent locations.
Use the user's message as the main intent.
Use nearby rankings as the candidate pool.
Use user ranking history as preference context and tie-breaking evidence.

Return:
- Best recommendation
- 2 alternatives if available
- Brief reason for each
- One honest tradeoff

Recent conversation history:
${formatHistory(input.history)}

User message:
${input.message}

Current location:
${JSON.stringify(
  input.latitude !== undefined && input.longitude !== undefined
    ? { latitude: input.latitude, longitude: input.longitude }
    : null,
  null,
  2
)}

Search mode:
${input.searchMode}

Radius meters:
${input.radiusMeters ?? "No radius filter; all available rankings were provided."}

Nearby rankings:
${JSON.stringify(input.nearbyRankings.map(simplifyRanking), null, 2)}

User ranking history:
${JSON.stringify(input.userRankings.map(simplifyRanking), null, 2)}
`
  });

  return response.text ?? "I could not generate a recommendation.";
}
