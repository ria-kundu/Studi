export function initialsFor(nameOrEmail) {
  const source = String(nameOrEmail || 'User').trim();
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

export function mapUser(user) {
  if (!user) return null;

  const displayName = user.displayName || user.email?.split('@')[0] || 'Study Spot User';

  return {
    id: user.uid,
    uid: user.uid,
    email: user.email,
    name: displayName,
    displayName,
    handle: user.email ? `@${user.email.split('@')[0]}` : `@${displayName.toLowerCase().replace(/\s+/g, '')}`,
    initials: initialsFor(displayName),
    photoURL: user.photoURL,
    bio: user.bio || '',
    preferredCategories: user.preferredCategories || [],
    followers: user.followers || [],
    following: user.following || [],
    followerCount: Number(user.followerCount || user.followers?.length || 0),
    followingCount: Number(user.followingCount || user.following?.length || 0),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function mapComment(comment) {
  return {
    ...comment,
    userId: comment.userId,
    user: mapUser(comment.user),
    time: comment.time || 'Just now',
  };
}

export function mapRanking(ranking) {
  return {
    ...ranking,
    user: mapUser(ranking.user),
    comments: (ranking.comments || []).map(mapComment),
    media: ranking.media || [],
    timestamp: ranking.timestamp || 'Just now',
  };
}

export function mapSpot(spot) {
  return {
    ...spot,
    avgScore: Number(spot.avgScore || 0),
    reviewCount: Number(spot.reviewCount || 0),
    avgAttributes: spot.avgAttributes || {},
  };
}
