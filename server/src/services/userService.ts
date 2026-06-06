import { admin, db } from "../config/firebaseAdmin.js";
import { HttpError } from "../middleware/errorHandler.js";
import type { PreferredCategory, UpdateUserProfileInput } from "../schemas/userSchemas.js";
import { sanitizeUserString } from "../utils/sanitize.js";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  bio: string;
  preferredCategories: PreferredCategory[];
  followers: string[];
  following: string[];
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface UserProfileResponse {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  bio: string;
  preferredCategories: PreferredCategory[];
  followers: string[];
  following: string[];
  followerCount: number;
  followingCount: number;
  createdAt: string | null;
  updatedAt: string | null;
}

function usersCollection(): FirebaseFirestore.CollectionReference {
  // Fixed collection name and SDK document helpers avoid injection-style path construction.
  return db.collection("users");
}

function userDocument(uid: string): FirebaseFirestore.DocumentReference {
  return usersCollection().doc(uid);
}

function timestampToIso(timestamp: FirebaseFirestore.Timestamp | undefined): string | null {
  return timestamp ? timestamp.toDate().toISOString() : null;
}

function fallbackDisplayName(authUser: Express.AuthenticatedUser): string {
  const fallback = authUser.name ?? authUser.email?.split("@")[0] ?? "Study Spot User";
  return sanitizeUserString(fallback).slice(0, 80);
}

export function serializeUserProfile(profile: UserProfile): UserProfileResponse {
  const followers = profile.followers ?? [];
  const following = profile.following ?? [];

  return {
    uid: profile.uid,
    email: profile.email,
    displayName: profile.displayName,
    photoURL: profile.photoURL,
    bio: profile.bio,
    preferredCategories: profile.preferredCategories,
    followers,
    following,
    followerCount: followers.length,
    followingCount: following.length,
    createdAt: timestampToIso(profile.createdAt),
    updatedAt: timestampToIso(profile.updatedAt)
  };
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await userDocument(uid).get();

  if (!snapshot.exists) {
    return null;
  }

  return snapshot.data() as UserProfile;
}

export async function createOrUpdateUserFromAuth(authUser: Express.AuthenticatedUser): Promise<UserProfile> {
  const ref = userDocument(authUser.uid);
  const snapshot = await ref.get();
  const now = admin.firestore.FieldValue.serverTimestamp();

  if (!snapshot.exists) {
    await ref.set({
      uid: authUser.uid,
      email: authUser.email ?? "",
      displayName: fallbackDisplayName(authUser),
      photoURL: authUser.picture ?? null,
      bio: "",
      preferredCategories: [],
      followers: [],
      following: [],
      createdAt: now,
      updatedAt: now
    });
  } else {
    const existingProfile = snapshot.data() as UserProfile;

    await ref.set(
      {
        email: authUser.email ?? existingProfile.email,
        displayName: authUser.name ? sanitizeUserString(authUser.name).slice(0, 80) : existingProfile.displayName,
        photoURL: authUser.picture ?? existingProfile.photoURL ?? null,
        updatedAt: now
      },
      { merge: true }
    );
  }

  const updatedSnapshot = await ref.get();
  return updatedSnapshot.data() as UserProfile;
}

export async function updateCurrentUserProfile(
  uid: string,
  updates: UpdateUserProfileInput
): Promise<UserProfile> {
  const ref = userDocument(uid);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new HttpError(404, "User profile not found. Call POST /api/auth/session after Firebase login.");
  }

  const updatePayload: Partial<Pick<UserProfile, "displayName" | "bio" | "preferredCategories">> & {
    updatedAt: FirebaseFirestore.FieldValue;
  } = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  if (updates.displayName !== undefined) {
    updatePayload.displayName = sanitizeUserString(updates.displayName).slice(0, 80);
  }

  if (updates.bio !== undefined) {
    updatePayload.bio = sanitizeUserString(updates.bio).slice(0, 300);
  }

  if (updates.preferredCategories !== undefined) {
    updatePayload.preferredCategories = [...updates.preferredCategories];
  }

  // Only whitelisted fields from the validated schema can reach this update.
  // uid, email, role, timestamps, and unknown fields are never accepted from clients.
  await ref.update(updatePayload);

  const updatedSnapshot = await ref.get();
  return updatedSnapshot.data() as UserProfile;
}

export async function followUser(currentUserId: string, targetUserId: string): Promise<{
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
}> {
  if (currentUserId === targetUserId) {
    throw new HttpError(400, "You cannot follow yourself.");
  }

  const currentUserRef = userDocument(currentUserId);
  const targetUserRef = userDocument(targetUserId);
  const now = admin.firestore.FieldValue.serverTimestamp();

  await db.runTransaction(async transaction => {
    const [currentSnapshot, targetSnapshot] = await Promise.all([
      transaction.get(currentUserRef),
      transaction.get(targetUserRef)
    ]);

    if (!currentSnapshot.exists) {
      throw new HttpError(404, "Current user profile not found.");
    }

    if (!targetSnapshot.exists) {
      throw new HttpError(404, "Target user profile not found.");
    }

    transaction.update(currentUserRef, {
      following: admin.firestore.FieldValue.arrayUnion(targetUserId),
      updatedAt: now
    });

    transaction.update(targetUserRef, {
      followers: admin.firestore.FieldValue.arrayUnion(currentUserId),
      updatedAt: now
    });
  });

  const [currentSnapshot, targetSnapshot] = await Promise.all([
    currentUserRef.get(),
    targetUserRef.get()
  ]);

  const currentProfile = currentSnapshot.data() as UserProfile;
  const targetProfile = targetSnapshot.data() as UserProfile;

  return {
    followerCount: (targetProfile.followers ?? []).length,
    followingCount: (currentProfile.following ?? []).length,
    isFollowing: true
  };
}

export async function unfollowUser(currentUserId: string, targetUserId: string): Promise<{
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
}> {
  if (currentUserId === targetUserId) {
    throw new HttpError(400, "You cannot unfollow yourself.");
  }

  const currentUserRef = userDocument(currentUserId);
  const targetUserRef = userDocument(targetUserId);
  const now = admin.firestore.FieldValue.serverTimestamp();

  await db.runTransaction(async transaction => {
    const [currentSnapshot, targetSnapshot] = await Promise.all([
      transaction.get(currentUserRef),
      transaction.get(targetUserRef)
    ]);

    if (!currentSnapshot.exists) {
      throw new HttpError(404, "Current user profile not found.");
    }

    if (!targetSnapshot.exists) {
      throw new HttpError(404, "Target user profile not found.");
    }

    transaction.update(currentUserRef, {
      following: admin.firestore.FieldValue.arrayRemove(targetUserId),
      updatedAt: now
    });

    transaction.update(targetUserRef, {
      followers: admin.firestore.FieldValue.arrayRemove(currentUserId),
      updatedAt: now
    });
  });

  const [currentSnapshot, targetSnapshot] = await Promise.all([
    currentUserRef.get(),
    targetUserRef.get()
  ]);

  const currentProfile = currentSnapshot.data() as UserProfile;
  const targetProfile = targetSnapshot.data() as UserProfile;

  return {
    followerCount: (targetProfile.followers ?? []).length,
    followingCount: (currentProfile.following ?? []).length,
    isFollowing: false
  };
}

export async function listFollowers(userId: string): Promise<UserProfileResponse[]> {
  const profile = await getUserProfile(userId);

  if (!profile) {
    throw new HttpError(404, "User profile not found.");
  }

  const followerIds = profile.followers ?? [];

  const followers = await Promise.all(
    followerIds.map(async uid => getUserProfile(uid))
  );

  return followers
    .filter((user): user is UserProfile => Boolean(user))
    .map(serializeUserProfile);
}

export async function listFollowing(userId: string): Promise<UserProfileResponse[]> {
  const profile = await getUserProfile(userId);

  if (!profile) {
    throw new HttpError(404, "User profile not found.");
  }

  const followingIds = profile.following ?? [];

  const following = await Promise.all(
    followingIds.map(async uid => getUserProfile(uid))
  );

  return following
    .filter((user): user is UserProfile => Boolean(user))
    .map(serializeUserProfile);
}
