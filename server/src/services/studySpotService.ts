import { admin, db } from "../config/firebaseAdmin.js";
import { HttpError } from "../middleware/errorHandler.js";
import type { CreateCommentInput, CreateRankingInput } from "../schemas/rankingSchemas.js";
import type { PreferredCategory } from "../schemas/userSchemas.js";
import { getUserProfile, serializeUserProfile, type UserProfile, type UserProfileResponse } from "./userService.js";

type Timestamp = FirebaseFirestore.Timestamp;

interface RankingRecord extends Omit<CreateRankingInput, "media"> {
  id: string;
  userId: string;
  spotId: string;
  media: Array<{ type: "image" | "video"; emoji: string }>;
  overallScore: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface CommentRecord {
  id: string;
  rankingId: string;
  userId: string;
  text: string;
  createdAt: Timestamp;
}

interface SpotRecord {
  id: string;
  name: string;
  lowerName: string;
  category: PreferredCategory;
  avgScore: number;
  reviewCount: number;
  avgAttributes: Record<string, number>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface RankingResponse {
  id: string;
  userId: string;
  user: UserProfileResponse | null;
  spotId: string;
  spotName: string;
  category: PreferredCategory;
  quietness: number;
  restroom: number;
  wifi: number;
  outlets: number;
  crowdness: number;
  seating: number;
  latitude?: number;
  longitude?: number;
  hours: string;
  notes: string;
  media: Array<{ type: "image" | "video"; emoji: string }>;
  overallScore: number;
  timestamp: string;
  createdAt: string | null;
  comments: CommentResponse[];
}

export interface CommentResponse {
  id: string;
  rankingId: string;
  userId: string;
  user: UserProfileResponse | null;
  text: string;
  time: string;
  createdAt: string | null;
}

export interface SpotResponse {
  id: string;
  name: string;
  category: PreferredCategory;
  avgScore: number;
  reviewCount: number;
  avgAttributes: Record<string, number>;
  createdAt: string | null;
  updatedAt: string | null;
}

const SCORE_KEYS = ["quietness", "restroom", "wifi", "outlets", "crowdness", "seating"] as const;

interface NearbyRankingsOptions {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  limit?: number;
}

function rankingsCollection(): FirebaseFirestore.CollectionReference {
  return db.collection("rankings");
}

function spotsCollection(): FirebaseFirestore.CollectionReference {
  return db.collection("spots");
}

function rankingCommentsCollection(rankingId: string): FirebaseFirestore.CollectionReference {
  return rankingsCollection().doc(rankingId).collection("comments");
}

function timestampToIso(timestamp: Timestamp | undefined): string | null {
  return timestamp ? timestamp.toDate().toISOString() : null;
}

function relativeTime(timestamp: Timestamp | undefined): string {
  if (!timestamp) {
    return "Just now";
  }

  const diffMs = Date.now() - timestamp.toDate().getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) {
    return "Just now";
  }

  if (diffMs < hour) {
    return `${Math.max(1, Math.floor(diffMs / minute))}m ago`;
  }

  if (diffMs < day) {
    return `${Math.floor(diffMs / hour)}h ago`;
  }

  return `${Math.floor(diffMs / day)}d ago`;
}

function spotIdFromName(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return slug || "study-spot";
}

function overallScore(input: Pick<RankingRecord, (typeof SCORE_KEYS)[number]>): number {
  const total = SCORE_KEYS.reduce((sum, key) => sum + input[key], 0);
  return Math.round((total / SCORE_KEYS.length) * 10) / 10;
}

function distanceMeters(from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }): number {
  const earthRadiusMeters = 6371000;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const deltaLatitude = toRadians(to.latitude - from.latitude);
  const deltaLongitude = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);
  const haversine =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(deltaLongitude / 2) ** 2;

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

async function requireUserProfile(uid: string): Promise<UserProfile> {
  const profile = await getUserProfile(uid);

  if (!profile) {
    throw new HttpError(404, "User profile not found. Call POST /api/auth/session after Firebase login.");
  }

  return profile;
}

async function getUserProfileResponse(uid: string): Promise<UserProfileResponse | null> {
  const profile = await getUserProfile(uid);
  return profile ? serializeUserProfile(profile) : null;
}

function serializeSpot(record: SpotRecord): SpotResponse {
  return {
    id: record.id,
    name: record.name,
    category: record.category,
    avgScore: record.avgScore,
    reviewCount: record.reviewCount,
    avgAttributes: record.avgAttributes ?? {},
    createdAt: timestampToIso(record.createdAt),
    updatedAt: timestampToIso(record.updatedAt)
  };
}

async function listComments(rankingId: string): Promise<CommentResponse[]> {
  const snapshot = await rankingCommentsCollection(rankingId).limit(50).get();
  const comments = snapshot.docs
    .map((doc) => doc.data() as CommentRecord)
    .sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());

  return Promise.all(
    comments.map(async (comment) => ({
      id: comment.id,
      rankingId: comment.rankingId,
      userId: comment.userId,
      user: await getUserProfileResponse(comment.userId),
      text: comment.text,
      time: relativeTime(comment.createdAt),
      createdAt: timestampToIso(comment.createdAt)
    }))
  );
}

async function serializeRanking(record: RankingRecord): Promise<RankingResponse> {
  return {
    id: record.id,
    userId: record.userId,
    user: await getUserProfileResponse(record.userId),
    spotId: record.spotId,
    spotName: record.spotName,
    category: record.category,
    quietness: record.quietness,
    restroom: record.restroom,
    wifi: record.wifi,
    outlets: record.outlets,
    crowdness: record.crowdness,
    seating: record.seating,
    latitude: record.latitude,
    longitude: record.longitude,
    hours: record.hours,
    notes: record.notes,
    media: record.media ?? [],
    overallScore: record.overallScore,
    timestamp: relativeTime(record.createdAt),
    createdAt: timestampToIso(record.createdAt),
    comments: await listComments(record.id)
  };
}

async function rankingsForSpot(spotId: string): Promise<RankingRecord[]> {
  const snapshot = await rankingsCollection().where("spotId", "==", spotId).limit(250).get();
  return snapshot.docs.map((doc) => doc.data() as RankingRecord);
}

async function refreshSpotStats(spotId: string): Promise<void> {
  const rankings = await rankingsForSpot(spotId);

  if (rankings.length === 0) {
    return;
  }

  const avgAttributes = Object.fromEntries(
    SCORE_KEYS.map((key) => {
      const total = rankings.reduce((sum, ranking) => sum + ranking[key], 0);
      return [key, Math.round((total / rankings.length) * 10) / 10];
    })
  );

  const avgScore =
    Math.round((rankings.reduce((sum, ranking) => sum + ranking.overallScore, 0) / rankings.length) * 10) / 10;

  await spotsCollection().doc(spotId).set(
    {
      avgScore,
      avgAttributes,
      reviewCount: rankings.length,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    { merge: true }
  );
}

export async function listFeedRankings(limit = 50): Promise<RankingResponse[]> {
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const snapshot = await rankingsCollection().orderBy("createdAt", "desc").limit(safeLimit).get();

  return Promise.all(snapshot.docs.map((doc) => serializeRanking(doc.data() as RankingRecord)));
}

export async function listNearbyRankings(options: NearbyRankingsOptions): Promise<RankingResponse[]> {
  const safeLimit = Math.min(Math.max(options.limit ?? 50, 1), 100);
  const snapshot = await rankingsCollection().orderBy("createdAt", "desc").limit(250).get();
  const center = { latitude: options.latitude, longitude: options.longitude };
  const rankings = snapshot.docs
    .map((doc) => doc.data() as RankingRecord)
    .filter((ranking) => ranking.latitude !== undefined && ranking.longitude !== undefined)
    .filter(
      (ranking) =>
        distanceMeters(center, {
          latitude: ranking.latitude as number,
          longitude: ranking.longitude as number
        }) <= options.radiusMeters
    )
    .slice(0, safeLimit);

  return Promise.all(rankings.map(serializeRanking));
}

export async function createRanking(uid: string, input: CreateRankingInput): Promise<RankingResponse> {
  await requireUserProfile(uid);

  const now = admin.firestore.FieldValue.serverTimestamp();
  const rankingRef = rankingsCollection().doc();
  const spotId = spotIdFromName(input.spotName);
  const score = overallScore(input);

  await spotsCollection().doc(spotId).set(
    {
      id: spotId,
      name: input.spotName,
      lowerName: input.spotName.toLowerCase(),
      category: input.category,
      avgScore: score,
      reviewCount: 0,
      avgAttributes: {},
      createdAt: now,
      updatedAt: now
    },
    { merge: true }
  );

  await rankingRef.set({
    id: rankingRef.id,
    userId: uid,
    spotId,
    spotName: input.spotName,
    category: input.category,
    quietness: input.quietness,
    restroom: input.restroom,
    wifi: input.wifi,
    outlets: input.outlets,
    crowdness: input.crowdness,
    seating: input.seating,
    ...(input.latitude !== undefined && input.longitude !== undefined
      ? { latitude: input.latitude, longitude: input.longitude }
      : {}),
    hours: input.hours,
    notes: input.notes,
    media: input.media,
    overallScore: score,
    createdAt: now,
    updatedAt: now
  });

  await refreshSpotStats(spotId);

  const created = await rankingRef.get();
  return serializeRanking(created.data() as RankingRecord);
}

export async function addComment(
  uid: string,
  rankingId: string,
  input: CreateCommentInput
): Promise<CommentResponse> {
  await requireUserProfile(uid);

  const rankingSnapshot = await rankingsCollection().doc(rankingId).get();
  if (!rankingSnapshot.exists) {
    throw new HttpError(404, "Ranking not found.");
  }

  const commentRef = rankingCommentsCollection(rankingId).doc();

  await commentRef.set({
    id: commentRef.id,
    rankingId,
    userId: uid,
    text: input.text,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  const created = (await commentRef.get()).data() as CommentRecord;

  return {
    id: created.id,
    rankingId: created.rankingId,
    userId: created.userId,
    user: await getUserProfileResponse(created.userId),
    text: created.text,
    time: relativeTime(created.createdAt),
    createdAt: timestampToIso(created.createdAt)
  };
}

export async function searchSpots(query: string): Promise<SpotResponse[]> {
  const q = query.trim().toLowerCase();
  const snapshot = await spotsCollection().limit(100).get();
  const spots = snapshot.docs.map((doc) => doc.data() as SpotRecord);

  return spots
    .filter((spot) => !q || spot.lowerName.includes(q))
    .sort((a, b) => b.reviewCount - a.reviewCount || a.name.localeCompare(b.name))
    .slice(0, 25)
    .map(serializeSpot);
}

export async function getSpot(spotId: string): Promise<SpotResponse> {
  const snapshot = await spotsCollection().doc(spotId).get();

  if (!snapshot.exists) {
    throw new HttpError(404, "Spot not found.");
  }

  return serializeSpot(snapshot.data() as SpotRecord);
}

export async function listSpotRankings(spotId: string): Promise<RankingResponse[]> {
  const rankings = (await rankingsForSpot(spotId)).sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
  return Promise.all(rankings.map(serializeRanking));
}

export async function listUserRankings(userId: string): Promise<RankingResponse[]> {
  const snapshot = await rankingsCollection().where("userId", "==", userId).limit(100).get();
  const rankings = snapshot.docs
    .map((doc) => doc.data() as RankingRecord)
    .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

  return Promise.all(rankings.map(serializeRanking));
}

export async function getPublicUserProfile(userId: string): Promise<UserProfileResponse> {
  const profile = await getUserProfile(userId);

  if (!profile) {
    throw new HttpError(404, "User profile not found.");
  }

  return serializeUserProfile(profile);
}
