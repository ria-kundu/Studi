// src/data/mock.js
// ─────────────────────────────────────────────────────────────
// All mock data lives here. Every export is a TODO anchor for
// backend teams — replace each constant with an API call.
// ─────────────────────────────────────────────────────────────

// TODO: Replace with GET /api/auth/me on app load
export const CURRENT_USER = {
  id: 'u1',
  name: 'Maya Chen',
  handle: '@mayachen',
  initials: 'MC',
  bio: 'Always hunting for the perfect study corner ☕',
};

// TODO: Replace with GET /api/users/:userId
export const USERS = {
  u1: CURRENT_USER,
  u2: { id: 'u2', name: 'Jordan Park',  handle: '@jordanpark',  initials: 'JP', bio: 'Library enthusiast.' },
  u3: { id: 'u3', name: 'Priya Nair',   handle: '@priyanair',   initials: 'PN', bio: 'Cafe hopper & deep focus devotee.' },
};

export const CATEGORIES = ['Libraries', 'Cafes', 'Outdoors', 'Other'];

export const CATEGORY_STYLE = {
  Libraries: { bg: 'var(--clr-lib-bg)',   text: 'var(--clr-lib-txt)',   dot: 'var(--clr-lib-dot)'   },
  Cafes:     { bg: 'var(--clr-cafe-bg)',  text: 'var(--clr-cafe-txt)',  dot: 'var(--clr-cafe-dot)'  },
  Outdoors:  { bg: 'var(--clr-out-bg)',   text: 'var(--clr-out-txt)',   dot: 'var(--clr-out-dot)'   },
  Other:     { bg: 'var(--clr-other-bg)', text: 'var(--clr-other-txt)', dot: 'var(--clr-other-dot)' },
};

export const RATING_FIELDS = [
  { key: 'quietness', label: 'Quietness' },
  { key: 'restroom',  label: 'Restroom'  },
  { key: 'wifi',      label: 'Wifi'      },
  { key: 'outlets',   label: 'Outlets'   },
  { key: 'crowdness', label: 'Crowdness' },
  { key: 'seating',   label: 'Seating'   },
];

// TODO: Replace with GET /api/rankings/feed?cursor=...
export const MOCK_RANKINGS = [
  {
    id: 'r1', userId: 'u2', spotName: 'Green Library', category: 'Libraries',
    quietness: 5, restroom: 4, wifi: 5, outlets: 4, crowdness: 3, seating: 5,
    hours: '7am – midnight',
    notes: 'Perfect for deep work. The east wing is quietest.',
    media: [{ type: 'image', emoji: '📚' }],
    overallScore: 4.5, timestamp: '2h ago',
    comments: [
      { id: 'c1', userId: 'u1', text: 'Agreed! Love the third floor reading room.', time: '1h ago' },
      { id: 'c2', userId: 'u3', text: 'The wifi drops near the windows though.', time: '45m ago' },
    ],
  },
  {
    id: 'r2', userId: 'u3', spotName: 'Blue Bottle Coffee – Mission', category: 'Cafes',
    quietness: 3, restroom: 3, wifi: 4, outlets: 2, crowdness: 4, seating: 3,
    hours: '7am – 7pm',
    notes: 'Cozy vibe but limited outlets. Go early for a seat.',
    media: [{ type: 'image', emoji: '☕' }, { type: 'video', emoji: '🎥' }],
    overallScore: 3.5, timestamp: '5h ago',
    comments: [],
  },
  {
    id: 'r3', userId: 'u1', spotName: 'Dolores Park – North Meadow', category: 'Outdoors',
    quietness: 2, restroom: 2, wifi: 1, outlets: 1, crowdness: 5, seating: 4,
    hours: '6am – 10pm',
    notes: 'No wifi but the vibe is immaculate for reading.',
    media: [{ type: 'image', emoji: '🌿' }],
    overallScore: 3.0, timestamp: '1d ago',
    comments: [
      { id: 'c3', userId: 'u2', text: 'Great spot in the morning before it gets crowded.', time: '12h ago' },
    ],
  },
  {
    id: 'r4', userId: 'u2', spotName: 'Covo Coworking', category: 'Other',
    quietness: 4, restroom: 5, wifi: 5, outlets: 5, crowdness: 2, seating: 4,
    hours: '8am – 10pm',
    notes: 'Day passes available. Best wifi I\'ve found anywhere.',
    media: [],
    overallScore: 4.8, timestamp: '2d ago',
    comments: [],
  },
];

// TODO: Replace with GET /api/spots?q=...
export const SEARCH_MOCK = {
  'green library':  [{ id: 's1', name: 'Green Library',                 category: 'Libraries', avgScore: 4.5, reviewCount: 12 }],
  'library':        [{ id: 's1', name: 'Green Library',                 category: 'Libraries', avgScore: 4.5, reviewCount: 12 }],
  'coffee':         [
    { id: 's2', name: 'Blue Bottle Coffee – Mission', category: 'Cafes',    avgScore: 3.5, reviewCount: 7 },
    { id: 's3', name: 'Sightglass Coffee',             category: 'Cafes',    avgScore: 4.2, reviewCount: 5 },
  ],
  'cafe':           [{ id: 's2', name: 'Blue Bottle Coffee – Mission', category: 'Cafes',    avgScore: 3.5, reviewCount: 7  }],
  'park':           [{ id: 's4', name: 'Dolores Park – North Meadow',  category: 'Outdoors', avgScore: 3.0, reviewCount: 4  }],
  'covo':           [{ id: 's5', name: 'Covo Coworking',               category: 'Other',    avgScore: 4.8, reviewCount: 3  }],
};

// TODO: Replace with POST /api/recommendations/chat
export const CHATBOT_RESPONSES = [
  'Based on your high ratings for Quietness and Wifi, I\'d recommend **Mechanics\' Institute Library** — members report near-perfect scores on both, plus a quiet reading room.',
  'You tend to rate Cafes higher when they have good seating. Try **Réveille Coffee Co.** on Columbus — spacious, strong wifi, rarely overcrowded before noon.',
  'Your Outdoors ratings skew toward spots with restrooms nearby. **Yerba Buena Gardens** is quiet on weekday mornings and has a public restroom and shade.',
  'Looking at your recent ratings, you value outlets most. **Main Library – Larkin Branch** scores 5/5 on outlets and wifi with plenty of seating.',
];
