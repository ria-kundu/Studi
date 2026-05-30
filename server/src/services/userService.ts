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
  return {
    uid: profile.uid,
    email: profile.email,
    displayName: profile.displayName,
    photoURL: profile.photoURL,
    bio: profile.bio,
    preferredCategories: profile.preferredCategories,
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
