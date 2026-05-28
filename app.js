/**
 * app.js — StudySpot SPA
 *
 * Handles client-side routing, rendering mock data, and all interactive behavior.
 * Every TODO comment marks a backend integration point.
 *
 * Pages: feed | profile | userProfile | search | createReview | spotDetail
 */

"use strict";

// ─── Mock Data ────────────────────────────────────────────────────────────────
// TODO: Replace all mock data with fetch() calls to your REST API endpoints.

const CURRENT_USER = {
  id: "u1",
  name: "Maya Chen",
  handle: "@mayachen",
  initials: "MC",
};

const USERS = {
  u1: CURRENT_USER,
  u2: { id: "u2", name: "Jordan Park",  handle: "@jordanpark",  initials: "JP" },
  u3: { id: "u3", name: "Priya Nair",   handle: "@priyanair",   initials: "PN" },
};

const CATEGORY_CLASS = {
  Libraries: "libraries",
  Cafes:     "cafes",
  Outdoors:  "outdoors",
  Other:     "other",
};

const MOCK_RANKINGS = [
  {
    id: "r1", userId: "u2", spotName: "Green Library", category: "Libraries",
    quietness: 5, restroom: 4, wifi: 5, outlets: 4, crowdness: 3, seating: 5,
    hours: "7am – midnight", notes: "Perfect for deep work. The east wing is quietest.",
    media: [{ type: "image", emoji: "📚" }],
    overallScore: 4.5, timestamp: "2h ago",
    comments: [
      { id: "c1", userId: "u1", text: "Agreed! Love the third floor reading room.", time: "1h ago" },
      { id: "c2", userId: "u3", text: "The wifi drops near the windows though.", time: "45m ago" },
    ],
  },
  {
    id: "r2", userId: "u3", spotName: "Blue Bottle Coffee – Mission", category: "Cafes",
    quietness: 3, restroom: 3, wifi: 4, outlets: 2, crowdness: 4, seating: 3,
    hours: "7am – 7pm", notes: "Cozy vibe but limited outlets. Go early for a seat.",
    media: [{ type: "image", emoji: "☕" }, { type: "video", emoji: "🎥" }],
    overallScore: 3.5, timestamp: "5h ago",
    comments: [],
  },
  {
    id: "r3", userId: "u1", spotName: "Dolores Park – North Meadow", category: "Outdoors",
    quietness: 2, restroom: 2, wifi: 1, outlets: 1, crowdness: 5, seating: 4,
    hours: "6am – 10pm", notes: "No wifi but the vibe is immaculate for reading.",
    media: [{ type: "image", emoji: "🌿" }],
    overallScore: 3.0, timestamp: "1d ago",
    comments: [
      { id: "c3", userId: "u2", text: "Great spot in the morning before it gets crowded.", time: "12h ago" },
    ],
  },
  {
    id: "r4", userId: "u2", spotName: "Covo Coworking", category: "Other",
    quietness: 4, restroom: 5, wifi: 5, outlets: 5, crowdness: 2, seating: 4,
    hours: "8am – 10pm", notes: "Day passes available. Best wifi I've found anywhere.",
    media: [],
    overallScore: 4.8, timestamp: "2d ago",
    comments: [],
  },
];

const SEARCH_MOCK = {
  "green library":  [{ id: "s1", name: "Green Library",                 category: "Libraries", avgScore: 4.5, reviewCount: 12 }],
  "library":        [{ id: "s1", name: "Green Library",                 category: "Libraries", avgScore: 4.5, reviewCount: 12 }],
  "coffee":         [
    { id: "s2", name: "Blue Bottle Coffee – Mission", category: "Cafes",     avgScore: 3.5, reviewCount: 7  },
    { id: "s3", name: "Sightglass Coffee",             category: "Cafes",     avgScore: 4.2, reviewCount: 5  },
  ],
  "cafe":           [{ id: "s2", name: "Blue Bottle Coffee – Mission", category: "Cafes",     avgScore: 3.5, reviewCount: 7  }],
  "park":           [{ id: "s4", name: "Dolores Park – North Meadow",  category: "Outdoors",  avgScore: 3.0, reviewCount: 4  }],
  "covo":           [{ id: "s5", name: "Covo Coworking",               category: "Other",     avgScore: 4.8, reviewCount: 3  }],
};

const CHATBOT_RESPONSES = [
  "Based on your high ratings for Quietness and Wifi, I'd recommend **Mechanics' Institute Library** — members report near-perfect scores on both, and it has a quiet members-only reading room.",
  "You tend to rate Cafes higher when they have good seating. Try **Réveille Coffee Co.** on Columbus — spacious, strong wifi, rarely overcrowded before noon.",
  "Your Outdoors ratings skew toward spots with restrooms nearby. **Yerba Buena Gardens** has a public restroom, decent shade, and is quiet on weekday mornings.",
  "Looking at your recent ratings, you value outlets and wifi most. **Main Library – Larkin Branch** scores 5/5 on both and has plenty of seating.",
];

// ─── Router ───────────────────────────────────────────────────────────────────

const Router = (() => {
  let current    = "feed";
  let context    = {};             // { userId, spotName }
  let history    = [];

  function navigate(page, ctx = {}) {
    history.push({ page: current, context: { ...context } });
    current = page;
    context = ctx;
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    if (history.length === 0) { navigate("feed"); return; }
    const prev = history.pop();
    current = prev.page;
    context = prev.context;
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function tabNavigate(page) {
    history = [];
    context = {};
    current = page;
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function getCurrent() { return current; }
  function getContext()  { return context; }

  return { navigate, back, tabNavigate, getCurrent, getContext };
})();

// ─── HTML Helpers ─────────────────────────────────────────────────────────────

function avatarHTML(user, sizeClass = "avatar-md") {
  return `<div class="avatar ${sizeClass}" aria-hidden="true">${user.initials}</div>`;
}

function badgeHTML(category) {
  const cls = CATEGORY_CLASS[category] || "other";
  return `<span class="badge badge-${cls}">${escHTML(category)}</span>`;
}

function starHTML(score) {
  let stars = "";
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(score))      stars += `<span class="star-rating__star filled" aria-hidden="true">★</span>`;
    else if (i - score < 1 && i - score > 0) stars += `<span class="star-rating__star half" aria-hidden="true">★</span>`;
    else                             stars += `<span class="star-rating__star" aria-hidden="true">★</span>`;
  }
  return `<div class="star-rating" aria-label="${score} out of 5 stars">
    <div class="star-rating__stars">${stars}</div>
    <span class="star-rating__value">${score.toFixed(1)}</span>
  </div>`;
}

function dotScoreHTML(value, max = 5) {
  let dots = "";
  for (let i = 1; i <= max; i++) {
    dots += `<div class="dot-score__dot${i <= value ? " filled" : ""}" aria-hidden="true"></div>`;
  }
  return `<div class="dot-score" role="img" aria-label="${value} out of ${max}">${dots}</div>`;
}

function escHTML(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

// ─── Ranking Card ─────────────────────────────────────────────────────────────

function rankingCardHTML(r) {
  const user    = USERS[r.userId] || { name: "Unknown", handle: "@?", initials: "?" };
  const isOwn   = r.userId === CURRENT_USER.id;

  const fields = [
    { label: "Quiet",   value: r.quietness },
    { label: "Wifi",    value: r.wifi      },
    { label: "Outlets", value: r.outlets   },
    { label: "Restroom",value: r.restroom  },
    { label: "Crowded", value: r.crowdness },
    { label: "Seating", value: r.seating   },
  ];

  const scoreItems = fields.map(f => `
    <div class="score-item">
      <span class="score-item__label">${f.label}</span>
      ${dotScoreHTML(f.value)}
    </div>`).join("");

  const mediaItems = r.media.map(m => `
    <div class="media-thumb" role="img" aria-label="${m.type === "video" ? "Video" : "Photo"} thumbnail">
      <span>${m.emoji}</span>
      ${m.type === "video" ? `<div class="media-thumb__play-overlay"><div class="media-thumb__play-btn">▶</div></div>` : ""}
      <!-- TODO: Replace <span> with <img src="${'...'}" alt="..."> or <video> using URL from backend -->
    </div>`).join("");

  const commentItems = r.comments.map(c => {
    const cu = USERS[c.userId] || { name: "User", initials: "?" };
    return `<li class="comment" role="listitem">
      ${avatarHTML(cu, "avatar-sm")}
      <div class="comment__bubble">
        <div class="comment__meta">
          <span class="comment__name">${escHTML(cu.name)}</span>
          <time class="comment__time">${escHTML(c.time)}</time>
        </div>
        <p class="comment__text">${escHTML(c.text)}</p>
      </div>
    </li>`;
  }).join("");

  return `
  <article class="card ranking-card" id="ranking-${r.id}">
    <header class="ranking-card__header">
      <button
        class="ranking-card__avatar-btn"
        aria-label="View ${escHTML(user.name)}'s profile"
        data-action="view-user"
        data-user-id="${r.userId}">
        ${avatarHTML(user)}
      </button>
      <div class="ranking-card__meta">
        <div class="ranking-card__user-row">
          <button class="ranking-card__username" data-action="view-user" data-user-id="${r.userId}">${escHTML(user.name)}</button>
          <span class="ranking-card__handle">${escHTML(user.handle)}</span>
          <span class="ranking-card__sep" aria-hidden="true">·</span>
          <time class="ranking-card__time">${escHTML(r.timestamp)}</time>
        </div>
        <button class="ranking-card__spot-name" data-action="view-spot" data-spot-name="${escHTML(r.spotName)}">
          ${escHTML(r.spotName)}
        </button>
        <div class="ranking-card__badges">
          ${badgeHTML(r.category)}
          <span class="ranking-card__sep" aria-hidden="true">·</span>
          ${starHTML(r.overallScore)}
        </div>
      </div>
    </header>

    ${r.media.length ? `<div class="ranking-card__media" aria-label="Media">${mediaItems}</div>` : ""}

    <div class="ranking-card__body">
      <div class="score-grid" aria-label="Attribute scores">${scoreItems}</div>
      ${r.hours ? `<p class="ranking-card__hours"><strong>Hours:</strong> ${escHTML(r.hours)}</p>` : ""}
      ${r.notes ? `<p class="ranking-card__notes">${escHTML(r.notes)}</p>` : ""}
    </div>

    <footer class="ranking-card__footer">
      <button
        class="comments-toggle"
        aria-expanded="false"
        aria-controls="comments-${r.id}"
        data-ranking-id="${r.id}">
        Comments (${r.comments.length})
      </button>

      <div class="comments-section" id="comments-${r.id}" role="region" aria-label="Comments">
        <ul class="comment-list" aria-label="Comment list" id="comment-list-${r.id}">
          ${commentItems}
        </ul>
        <!-- TODO: POST /api/comments { rankingId, userId, text } — associate with authenticated user -->
        <form class="comment-form" aria-label="Add a comment" data-ranking-id="${r.id}" data-action="submit-comment">
          ${avatarHTML(CURRENT_USER, "avatar-sm")}
          <input
            type="text"
            class="comment-form__input"
            placeholder="Add a comment…"
            aria-label="Comment text"
            autocomplete="off" />
          <button type="submit" class="comment-form__submit" aria-label="Post comment">↑</button>
        </form>
      </div>
    </footer>
  </article>`;
}

// ─── Page Renderers ───────────────────────────────────────────────────────────

function renderFeed() {
  // TODO: GET /api/rankings/feed?cursor=... — paginated feed of recent/followed rankings
  const cards = MOCK_RANKINGS.map(rankingCardHTML).join("");
  return `
  <main id="main-content" class="content-container">
    <div class="page-header__row">
      <div class="page-header">
        <h1 class="page-header__title">Recent Rankings</h1>
        <p class="page-header__subtitle">See what others are studying at</p>
      </div>
      <a href="#" class="btn btn-primary" data-action="go-to-create-review" aria-label="Rate a new study spot">
        + Rate a Spot
      </a>
    </div>

    <div class="feed-cta" role="complementary" aria-label="Rate a spot prompt">
      <div class="feed-cta__text">
        <strong>Visited somewhere lately?</strong>
        <span>Share your study spot experience with the community.</span>
      </div>
      <a href="#" class="btn btn-outline btn-sm" data-action="go-to-create-review">Write a Review</a>
    </div>

    <section aria-label="Recent study spot rankings">
      ${cards}
      <!-- TODO: Infinite scroll — fetch next page when user nears bottom -->
    </section>
  </main>`;
}

function renderProfile(userId) {
  // TODO: GET /api/users/:userId — fetch user data
  // TODO: GET /api/users/:userId/rankings?sort=newest — sorted rankings list
  const user     = USERS[userId] || USERS["u1"];
  const isOwn    = userId === CURRENT_USER.id;
  const rankings = MOCK_RANKINGS.filter(r => r.userId === userId);
  const cards    = rankings.length
    ? rankings.map(rankingCardHTML).join("")
    : `<div class="empty-state">
        <span class="empty-state__icon">📍</span>
        <p class="empty-state__title">No rankings yet</p>
        <p class="empty-state__subtitle">${isOwn ? "Be the first to rate a spot!" : `${escHTML(user.name)} hasn't ranked any spots yet.`}</p>
        ${isOwn ? `<a href="#" class="btn btn-primary" data-action="go-to-create-review">Rate a Spot</a>` : ""}
      </div>`;

  const backBtn  = !isOwn
    ? `<button class="back-link" data-action="back" aria-label="Go back">← Back</button>`
    : "";

  return `
  <main id="main-content" class="content-container">
    ${backBtn}
    <section class="profile-header-card" aria-label="Profile information">
      <div class="profile-header-card__top">
        ${avatarHTML(user, "avatar-xl")}
        <div class="profile-header-card__info">
          <h1 class="profile-header-card__name">${escHTML(user.name)}</h1>
          <p class="profile-header-card__handle">${escHTML(user.handle)}</p>
          <!-- TODO: Display bio from GET /api/users/:userId -->
        </div>
        ${isOwn
          ? `<button class="btn btn-ghost btn-sm profile-header-card__edit" data-action="edit-profile" aria-label="Edit your profile">
               Edit
               <!-- TODO: Open edit profile form — PATCH /api/users/:userId -->
             </button>`
          : ""}
      </div>
      <div class="profile-header-card__stats">
        <div class="profile-stat">
          <span class="profile-stat__value">${rankings.length}</span>
          <span class="profile-stat__label">Rankings</span>
        </div>
        <!-- TODO: Pull follower/following counts from backend -->
        <div class="profile-stat">
          <span class="profile-stat__value">—</span>
          <span class="profile-stat__label">Followers</span>
        </div>
        <div class="profile-stat">
          <span class="profile-stat__value">—</span>
          <span class="profile-stat__label">Following</span>
        </div>
      </div>
    </section>

    <section aria-label="${isOwn ? "Your rankings" : escHTML(user.name) + "'s rankings"}">
      <h2 style="font-size:var(--text-base); font-weight:var(--weight-semi); color:var(--color-text-secondary); margin-bottom:var(--space-4);">
        ${isOwn ? "Your Rankings" : escHTML(user.name) + "'s Rankings"}
      </h2>
      ${cards}
    </section>
  </main>`;
}

function renderSearch() {
  // TODO: GET /api/spots?q=... — search endpoint
  // TODO: POST /api/recommendations/chat { userId, message, history } — AI recommendation
  return `
  <main id="main-content" class="content-container">
    <div class="page-header">
      <h1 class="page-header__title">Find a Spot</h1>
      <p class="page-header__subtitle">Search by name or ask the AI for recommendations</p>
    </div>

    <section aria-label="Search study spots">
      <form id="search-form" data-action="search" role="search">
        <div class="search-bar">
          <span class="search-bar__icon" aria-hidden="true">🔍</span>
          <input
            id="search-input"
            type="search"
            class="search-bar__input"
            placeholder="Search study spots…"
            aria-label="Search for a study spot by name"
            autocomplete="off" />
          <button type="submit" class="btn btn-primary">Search</button>
        </div>
      </form>
      <div
        id="search-results"
        class="search-results"
        role="region"
        aria-live="polite"
        aria-label="Search results">
      </div>
    </section>

    <div class="divider">or ask the AI</div>

    <section aria-label="AI recommendation chatbot">
      <div class="chatbot-panel">
        <div class="chatbot-panel__header">
          <div class="chatbot-panel__ai-badge" aria-hidden="true">AI</div>
          <span class="chatbot-panel__title">StudySpot Assistant</span>
          <span class="chatbot-panel__powered">powered by your ratings</span>
          <!-- TODO: Show loading indicator while backend queries user ranking history for context -->
        </div>
        <div
          class="chatbot-panel__messages"
          id="chat-messages"
          role="log"
          aria-live="polite"
          aria-label="Chat conversation">
          <div class="chat-row chat-row--assistant">
            <div class="chat-bubble chat-bubble--assistant">
              Hi! Ask me for study spot recommendations based on your past ratings. Try: <em>"I want somewhere quiet with good wifi"</em>
            </div>
          </div>
        </div>
        <form class="chatbot-panel__input-row" id="chat-form" aria-label="Send message to AI">
          <input
            type="text"
            class="chatbot-panel__text-input"
            id="chat-input"
            placeholder="e.g. Somewhere quiet with outlets…"
            aria-label="Message to AI assistant"
            autocomplete="off" />
          <button type="submit" class="chatbot-panel__send" aria-label="Send message">↑</button>
        </form>
      </div>
    </section>
  </main>`;
}

function renderCreateReview() {
  // TODO: GET /api/spots?q=... — autocomplete the spot name field
  // TODO: POST /api/rankings — submit the new ranking; handle media upload to object storage
  // TODO: Server should validate all required fields and return 422 with errors on failure
  return `
  <main id="main-content" class="content-container">
    <button class="back-link" data-action="back" aria-label="Go back">← Back</button>

    <div class="page-header">
      <h1 class="page-header__title">Rate a Study Spot</h1>
      <p class="page-header__subtitle">Share your experience with the community</p>
    </div>

    <div class="create-review-form" role="form" aria-label="Create review form">
      <form id="review-form" novalidate>

        <!-- ── Section 1: Location ── -->
        <div class="form-section">
          <p class="form-section__title">Location</p>

          <div class="form-group">
            <label class="form-label" for="spot-name">
              Study Spot Name <span class="required" aria-label="required">*</span>
            </label>
            <input
              type="text"
              id="spot-name"
              name="spotName"
              class="form-input"
              placeholder="e.g. Main Street Library"
              required
              autocomplete="off"
              aria-describedby="spot-name-hint" />
            <span id="spot-name-hint" style="font-size:var(--text-xs); color:var(--color-text-tertiary);">
              <!-- TODO: Autocomplete suggestions from GET /api/spots?q=... -->
              Start typing to search existing spots or add a new one.
            </span>
          </div>

          <div class="form-group">
            <fieldset>
              <legend class="form-label">
                Category <span class="required" aria-label="required">*</span>
              </legend>
              <div class="radio-pills" id="category-pills">
                <div class="radio-pill">
                  <input type="radio" name="category" id="cat-libraries" value="Libraries" checked />
                  <label for="cat-libraries">📚 Libraries</label>
                </div>
                <div class="radio-pill">
                  <input type="radio" name="category" id="cat-cafes" value="Cafes" />
                  <label for="cat-cafes">☕ Cafes</label>
                </div>
                <div class="radio-pill">
                  <input type="radio" name="category" id="cat-outdoors" value="Outdoors" />
                  <label for="cat-outdoors">🌿 Outdoors</label>
                </div>
                <div class="radio-pill">
                  <input type="radio" name="category" id="cat-other" value="Other" />
                  <label for="cat-other">📍 Other</label>
                </div>
              </div>
            </fieldset>
          </div>

          <div class="form-group">
            <label class="form-label" for="hours-open">
              Hours Open <span class="required" aria-label="required">*</span>
            </label>
            <input
              type="text"
              id="hours-open"
              name="hours"
              class="form-input"
              placeholder="e.g. 8am – 10pm, or 24 hours"
              required />
          </div>
        </div>

        <!-- ── Section 2: Ratings ── -->
        <div class="form-section">
          <p class="form-section__title">Ratings <span class="required" aria-label="required">*</span></p>
          <div class="ratings-grid" id="ratings-grid">
            ${["quietness","restroom","wifi","outlets","crowdness","seating"].map(key => {
              const label = { quietness:"Quietness", restroom:"Restroom", wifi:"Wifi", outlets:"Outlets", crowdness:"Crowdness", seating:"Amount of Seating" }[key];
              return `
              <div class="slider-field">
                <label class="slider-field__label" for="slider-${key}">${label}</label>
                <input
                  type="range"
                  id="slider-${key}"
                  name="${key}"
                  class="slider-field__range"
                  min="1" max="5" step="1" value="3"
                  aria-valuemin="1" aria-valuemax="5" aria-valuenow="3" />
                <span class="slider-field__value" id="val-${key}" aria-live="polite">3</span>
              </div>`;
            }).join("")}
          </div>
        </div>

        <!-- ── Section 3: Media ── -->
        <div class="form-section">
          <p class="form-section__title">Photos & Videos <span class="required" aria-label="required">*</span></p>
          <label
            class="upload-zone"
            for="media-upload"
            id="upload-zone"
            aria-describedby="upload-hint">
            <span class="upload-zone__icon" aria-hidden="true">📎</span>
            <span class="upload-zone__text">Tap or drag to upload photos or videos</span>
            <span class="upload-zone__hint" id="upload-hint">JPG, PNG, MP4 · up to 50MB each</span>
            <span class="upload-zone__count" id="upload-count" aria-live="polite"></span>
            <input
              type="file"
              id="media-upload"
              name="media"
              multiple
              accept="image/*,video/*"
              class="sr-only"
              aria-label="Upload photos or videos"
              required />
              <!-- TODO: On change, upload files to object storage (S3/R2/etc.) and store returned URLs -->
          </label>
          <div class="media-preview-strip" id="media-preview" aria-label="Uploaded media preview"></div>
        </div>

        <!-- ── Section 4: Notes ── -->
        <div class="form-section">
          <p class="form-section__title">Additional Notes</p>
          <div class="form-group">
            <label class="form-label" for="notes">
              Notes
              <span style="font-weight:var(--weight-regular); color:var(--color-text-tertiary); margin-left:var(--space-2);">optional</span>
            </label>
            <textarea
              id="notes"
              name="notes"
              class="form-textarea"
              placeholder="Anything else worth knowing — parking, vibe, tips…"
              rows="3"></textarea>
          </div>
        </div>

        <!-- ── Actions ── -->
        <div class="form-actions">
          <button type="button" class="btn btn-ghost" data-action="back">Cancel</button>
          <button type="submit" class="btn btn-primary btn-lg">
            Submit Ranking
            <!-- TODO: Disable button while POST /api/rankings is in-flight; show spinner -->
          </button>
        </div>

      </form>
    </div>
  </main>`;
}

function renderSpotDetail(spotName) {
  // TODO: GET /api/spots/:spotId — spot metadata
  // TODO: GET /api/spots/:spotId/rankings — all user reviews for this spot
  const rankings = MOCK_RANKINGS.filter(r => r.spotName === spotName);
  const avgScore = rankings.length
    ? (rankings.reduce((s, r) => s + r.overallScore, 0) / rankings.length)
    : 0;
  const cards = rankings.length
    ? rankings.map(rankingCardHTML).join("")
    : `<div class="empty-state">
        <span class="empty-state__icon">🔍</span>
        <p class="empty-state__title">No reviews yet</p>
        <p class="empty-state__subtitle">Be the first to rate this spot!</p>
        <a href="#" class="btn btn-primary" data-action="go-to-create-review">Write a Review</a>
      </div>`;

  const firstCategory = rankings[0]?.category || "Other";

  return `
  <main id="main-content" class="content-container">
    <button class="back-link" data-action="back" aria-label="Go back">← Back</button>

    <section class="spot-overview" aria-label="Spot overview">
      <h1 class="spot-overview__name">${escHTML(spotName)}</h1>
      <div class="spot-overview__row">
        ${badgeHTML(firstCategory)}
        ${avgScore ? starHTML(parseFloat(avgScore.toFixed(1))) : ""}
        <span class="spot-overview__review-count">${rankings.length} review${rankings.length !== 1 ? "s" : ""}</span>
      </div>
      <!-- TODO: Show address, map pin, and aggregate stats from backend -->
    </section>

    ${rankings.length ? `
    <section class="spot-avg-stats" aria-label="Average attribute scores">
      <p class="spot-avg-stats__title">Average Scores</p>
      <div class="score-grid">
        ${["quietness","wifi","outlets","restroom","crowdness","seating"].map(key => {
          const avg = rankings.length
            ? Math.round(rankings.reduce((s,r) => s + r[key], 0) / rankings.length)
            : 0;
          const label = { quietness:"Quiet", wifi:"Wifi", outlets:"Outlets", restroom:"Restroom", crowdness:"Crowded", seating:"Seating" }[key];
          return `<div class="score-item">
            <span class="score-item__label">${label}</span>
            ${dotScoreHTML(avg)}
          </div>`;
        }).join("")}
      </div>
    </section>` : ""}

    <section aria-label="All reviews">
      <h2 style="font-size:var(--text-base); font-weight:var(--weight-semi); color:var(--color-text-secondary); margin-bottom:var(--space-4);">
        All Reviews
      </h2>
      ${cards}
    </section>
  </main>`;
}

// ─── Render Engine ────────────────────────────────────────────────────────────

function render() {
  const appEl  = document.getElementById("app");
  const page   = Router.getCurrent();
  const ctx    = Router.getContext();

  // Update nav active states
  document.querySelectorAll("[data-nav-tab]").forEach(btn => {
    const isActive = btn.dataset.navTab === page ||
      (page === "userProfile"   && btn.dataset.navTab === "profile") ||
      (page === "spotDetail"    && btn.dataset.navTab === "feed") ||
      (page === "createReview"  && btn.dataset.navTab === "feed");
    btn.setAttribute("aria-current", isActive ? "page" : "false");
    btn.setAttribute("aria-selected", isActive ? "true" : "false");
  });

  let html = "";
  switch (page) {
    case "feed":          html = renderFeed();                      break;
    case "profile":       html = renderProfile(CURRENT_USER.id);   break;
    case "userProfile":   html = renderProfile(ctx.userId);        break;
    case "search":        html = renderSearch();                    break;
    case "createReview":  html = renderCreateReview();             break;
    case "spotDetail":    html = renderSpotDetail(ctx.spotName);   break;
    default:              html = renderFeed();
  }

  appEl.innerHTML = html;
  attachListeners();
}

// ─── Event Delegation ─────────────────────────────────────────────────────────

function attachListeners() {
  const appEl = document.getElementById("app");

  // Global click delegation
  appEl.addEventListener("click", function(e) {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;

    switch (action) {
      case "back":
        Router.back();
        break;

      case "view-user":
        Router.navigate("userProfile", { userId: btn.dataset.userId });
        break;

      case "view-spot":
        Router.navigate("spotDetail", { spotName: btn.dataset.spotName });
        break;

      case "go-to-create-review":
        e.preventDefault();
        Router.navigate("createReview");
        break;
    }
  });

  // Comments toggle
  appEl.addEventListener("click", function(e) {
    const toggle = e.target.closest(".comments-toggle");
    if (!toggle) return;
    const id      = toggle.dataset.rankingId;
    const section = document.getElementById(`comments-${id}`);
    if (!section) return;
    const isOpen = section.classList.toggle("open");
    toggle.setAttribute("aria-expanded", isOpen.toString());
    toggle.textContent = isOpen ? "Hide comments" : `Comments (${section.querySelectorAll(".comment").length})`;
  });

  // Comment form submit
  appEl.addEventListener("submit", function(e) {
    const form = e.target.closest("[data-action='submit-comment']");
    if (!form) return;
    e.preventDefault();
    const input = form.querySelector(".comment-form__input");
    const text  = input.value.trim();
    if (!text) return;

    const rankingId = form.dataset.rankingId;
    const list      = document.getElementById(`comment-list-${rankingId}`);
    if (!list) return;

    // TODO: POST /api/comments { rankingId, userId: CURRENT_USER.id, text }
    const li = document.createElement("li");
    li.className = "comment";
    li.setAttribute("role", "listitem");
    li.innerHTML = `
      ${avatarHTML(CURRENT_USER, "avatar-sm")}
      <div class="comment__bubble">
        <div class="comment__meta">
          <span class="comment__name">${escHTML(CURRENT_USER.name)}</span>
          <time class="comment__time">Just now</time>
        </div>
        <p class="comment__text">${escHTML(text)}</p>
      </div>`;
    list.appendChild(li);
    input.value = "";
    showToast("Comment posted!");
  });

  // Slider live update
  const ratingsGrid = document.getElementById("ratings-grid");
  if (ratingsGrid) {
    ratingsGrid.addEventListener("input", function(e) {
      const slider = e.target;
      if (slider.type !== "range") return;
      const key    = slider.name;
      const valEl  = document.getElementById(`val-${key}`);
      if (valEl) {
        valEl.textContent = slider.value;
        slider.setAttribute("aria-valuenow", slider.value);
      }
    });
  }

  // Media upload preview
  const mediaInput = document.getElementById("media-upload");
  if (mediaInput) {
    mediaInput.addEventListener("change", function() {
      const files   = Array.from(this.files);
      const preview = document.getElementById("media-preview");
      const count   = document.getElementById("upload-count");
      if (preview) {
        preview.innerHTML = files.map((f, i) => {
          const isVideo = f.type.startsWith("video/");
          return `<div class="media-preview-item" role="img" aria-label="${escHTML(f.name)}">
            <span>${isVideo ? "🎥" : "🖼️"}</span>
            <button class="media-preview-item__remove" type="button" aria-label="Remove ${escHTML(f.name)}" data-file-index="${i}">✕</button>
            <!-- TODO: Show actual thumbnail using URL.createObjectURL(file) in <img> or <video> -->
          </div>`;
        }).join("");
      }
      if (count) {
        count.textContent = files.length ? `${files.length} file${files.length !== 1 ? "s" : ""} selected` : "";
      }
    });

    // Drag-and-drop on upload zone
    const zone = document.getElementById("upload-zone");
    if (zone) {
      zone.addEventListener("dragover",  e => { e.preventDefault(); zone.classList.add("drag-over"); });
      zone.addEventListener("dragleave", ()  => zone.classList.remove("drag-over"));
      zone.addEventListener("drop",      e => {
        e.preventDefault();
        zone.classList.remove("drag-over");
        mediaInput.files = e.dataTransfer.files; // Note: read-only in some browsers
        mediaInput.dispatchEvent(new Event("change"));
      });
    }
  }

  // Search form
  const searchForm = document.getElementById("search-form");
  if (searchForm) {
    searchForm.addEventListener("submit", function(e) {
      e.preventDefault();
      const q       = document.getElementById("search-input")?.value.trim().toLowerCase();
      const results = document.getElementById("search-results");
      if (!results) return;

      if (!q) { results.innerHTML = ""; return; }

      // TODO: Replace with fetch(`/api/spots?q=${encodeURIComponent(q)}`)
      const found = Object.entries(SEARCH_MOCK).find(([k]) => q.includes(k));
      const spots = found ? found[1] : [];

      if (spots.length === 0) {
        results.innerHTML = `<p style="text-align:center; color:var(--color-text-tertiary); padding:var(--space-8) 0; font-size:var(--text-sm);">No spots found for "<em>${escHTML(q)}</em>"</p>`;
        return;
      }

      results.innerHTML = `<ul style="display:flex; flex-direction:column; gap:var(--space-2);" aria-label="Search results">
        ${spots.map(s => `
        <li>
          <button class="search-result-item" data-action="view-spot" data-spot-name="${escHTML(s.name)}">
            <div>
              <div class="search-result-item__name">${escHTML(s.name)}</div>
              <div class="search-result-item__meta">
                ${badgeHTML(s.category)}
                <span class="search-result-item__count">${s.reviewCount} reviews</span>
              </div>
            </div>
            ${starHTML(s.avgScore)}
          </button>
        </li>`).join("")}
      </ul>`;
    });
  }

  // Chat form
  const chatForm = document.getElementById("chat-form");
  if (chatForm) {
    chatForm.addEventListener("submit", function(e) {
      e.preventDefault();
      const input   = document.getElementById("chat-input");
      const msgs    = document.getElementById("chat-messages");
      const text    = input?.value.trim();
      if (!text || !msgs) return;
      input.value   = "";

      // Append user message
      const userRow = document.createElement("div");
      userRow.className = "chat-row chat-row--user";
      userRow.innerHTML = `<div class="chat-bubble chat-bubble--user">${escHTML(text)}</div>`;
      msgs.appendChild(userRow);
      msgs.scrollTop = msgs.scrollHeight;

      // Loading dots
      const loadingRow = document.createElement("div");
      loadingRow.className = "chat-row chat-row--assistant";
      loadingRow.innerHTML = `<div class="chat-bubble chat-bubble--assistant">
        <div class="loading-dots" aria-label="Loading response">
          <span></span><span></span><span></span>
        </div>
      </div>`;
      msgs.appendChild(loadingRow);
      msgs.scrollTop = msgs.scrollHeight;

      // TODO: POST /api/recommendations/chat { userId: CURRENT_USER.id, message: text, history: [...] }
      // The backend should fetch user's past rankings and use an LLM to generate personalized suggestions.
      setTimeout(() => {
        msgs.removeChild(loadingRow);
        const reply     = CHATBOT_RESPONSES[Math.floor(Math.random() * CHATBOT_RESPONSES.length)];
        const replyRow  = document.createElement("div");
        replyRow.className = "chat-row chat-row--assistant";
        // Render simple **bold** markdown
        const formatted = reply.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
        replyRow.innerHTML = `<div class="chat-bubble chat-bubble--assistant">${formatted}</div>`;
        msgs.appendChild(replyRow);
        msgs.scrollTop = msgs.scrollHeight;
      }, 900);
    });
  }

  // Review form submit
  const reviewForm = document.getElementById("review-form");
  if (reviewForm) {
    reviewForm.addEventListener("submit", function(e) {
      e.preventDefault();
      const data = new FormData(this);
      const spotName = data.get("spotName")?.trim();
      if (!spotName) {
        document.getElementById("spot-name").focus();
        showToast("Please enter a study spot name.");
        return;
      }
      // TODO: POST /api/rankings — send FormData (or JSON + separate media upload)
      // TODO: Show loading state on submit button, disable re-submission
      // TODO: On success, navigate to the new ranking and refresh feed
      // TODO: On 422 error, display field-level validation errors from backend
      showToast("Review submitted! (TODO: connect to backend)");
      Router.navigate("feed");
    });
  }
}

// ─── Nav Setup ────────────────────────────────────────────────────────────────

function setupNav() {
  // Desktop tabs
  document.querySelectorAll("[data-nav-tab]").forEach(btn => {
    btn.addEventListener("click", () => {
      Router.tabNavigate(btn.dataset.navTab);
    });
  });

  // Logo
  document.getElementById("nav-logo")?.addEventListener("click", e => {
    e.preventDefault();
    Router.tabNavigate("feed");
  });

  // Own profile button
  document.getElementById("nav-profile-btn")?.addEventListener("click", () => {
    Router.tabNavigate("profile");
  });

  // Logout
  document.getElementById("nav-logout")?.addEventListener("click", () => {
    // TODO: POST /api/auth/logout — clear session cookie, redirect to /login
    alert("Logout clicked — TODO: implement auth and redirect to login page.");
  });
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function showToast(message) {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", function() {
  setupNav();
  render();
});
