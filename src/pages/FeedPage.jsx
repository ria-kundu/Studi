// src/pages/FeedPage.jsx
import { useRouter } from '../App.jsx';
import { MOCK_RANKINGS } from '../data/mock.js';
import RankingCard from '../components/RankingCard.jsx';
import { Btn } from '../components/ui.jsx';

export default function FeedPage() {
  const { navigate } = useRouter();
  // TODO: GET /api/rankings/feed?cursor=... — paginated feed, newest first
  // TODO: Implement infinite scroll — fetch next page on bottom intersection observer

  return (
    <main id="main-content" style={containerStyle}>
      {/* Header row */}
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between',
        gap:16, flexWrap:'wrap', marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:30,
            color:'var(--clr-ink)', lineHeight:1.1, letterSpacing:'-0.02em' }}>
            Recent Rankings
          </h1>
          <p style={{ fontSize:13, color:'var(--clr-ink-4)', marginTop:4 }}>
            See what others are studying at
          </p>
        </div>
        <Btn onClick={() => navigate('createReview')} ariaLabel="Rate a new study spot">
          + Rate a Spot
        </Btn>
      </div>

      {/* Soft CTA banner */}
      <div style={ctaStyle} role="complementary" aria-label="Rate a spot prompt">
        <div>
          <strong style={{ display:'block', fontSize:14, fontWeight:600, color:'var(--clr-ink)' }}>
            Visited somewhere lately?
          </strong>
          <span style={{ fontSize:13, color:'var(--clr-ink-3)', marginTop:2, display:'block' }}>
            Share your experience with the community.
          </span>
        </div>
        <Btn variant="outline" size="sm" onClick={() => navigate('createReview')}>
          Write a Review
        </Btn>
      </div>

      {/* Rankings */}
      <section aria-label="Recent study spot rankings">
        {MOCK_RANKINGS.map(r => (
          <RankingCard key={r.id} ranking={r} />
        ))}
        {/* TODO: Infinite scroll trigger element here */}
      </section>
    </main>
  );
}

const containerStyle = {
  maxWidth: 'var(--max-w)', margin: '0 auto', padding: '24px var(--px)',
};

const ctaStyle = {
  background: 'linear-gradient(135deg, var(--clr-primary-dim), #f3f0ff)',
  borderRadius: 'var(--r-xl)', border: '1px dashed var(--clr-primary-dim)',
  padding: '16px 20px', display: 'flex', alignItems: 'center',
  justifyContent: 'space-between', gap: 16, marginBottom: 24, flexWrap: 'wrap',
};
