// src/pages/SpotDetailPage.jsx
import { useRouter } from '../App.jsx';
import { MOCK_RANKINGS } from '../data/mock.js';
import RankingCard from '../components/RankingCard.jsx';
import { Badge, Stars, DotScore, BackLink, Btn, SectionHeading, EmptyState } from '../components/ui.jsx';
import { RATING_FIELDS } from '../data/mock.js';

export default function SpotDetailPage({ spotName }) {
  const { back, navigate } = useRouter();
  // TODO: GET /api/spots/:spotId — spot metadata (name, category, address)
  // TODO: GET /api/spots/:spotId/rankings — all reviews for this spot, newest first

  const rankings = MOCK_RANKINGS.filter(r => r.spotName === spotName);
  const avgScore = rankings.length
    ? rankings.reduce((s, r) => s + r.overallScore, 0) / rankings.length
    : 0;
  const firstCategory = rankings[0]?.category ?? 'Other';

  // Compute average per attribute
  const avgAttrs = RATING_FIELDS.map(({ key, label }) => ({
    key, label,
    avg: rankings.length
      ? Math.round(rankings.reduce((s, r) => s + r[key], 0) / rankings.length)
      : 0,
  }));

  const ATTR_LABELS = { quietness:'Quiet', restroom:'Restroom', wifi:'Wifi',
    outlets:'Outlets', crowdness:'Crowded', seating:'Seating' };

  return (
    <main id="main-content" style={containerStyle}>
      <BackLink onClick={back} />

      {/* Spot overview */}
      <section style={overviewStyle} aria-label="Spot overview">
        <h1 style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:30,
          color:'var(--clr-ink)', lineHeight:1.1, letterSpacing:'-0.02em' }}>
          {spotName}
        </h1>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:12, flexWrap:'wrap' }}>
          <Badge category={firstCategory} />
          {avgScore > 0 && <Stars score={parseFloat(avgScore.toFixed(1))} />}
          <span style={{ fontSize:13, color:'var(--clr-ink-4)' }}>
            {rankings.length} review{rankings.length !== 1 ? 's' : ''}
          </span>
        </div>
        {/* TODO: Show address and map link from backend: <a href={...}>View on map</a> */}
      </section>

      {/* Aggregate attribute scores */}
      {rankings.length > 0 && (
        <section style={avgStatsStyle} aria-label="Average attribute scores across all reviews">
          <p style={{ fontSize:11, fontWeight:700, color:'var(--clr-ink-4)',
            textTransform:'uppercase', letterSpacing:'0.08em',
            fontFamily:'var(--font-display)', marginBottom:14 }}>
            Average Scores
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)',
            gap:'10px 16px' }}>
            {avgAttrs.map(({ key, avg }) => (
              <div key={key} style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <span style={{ fontSize:11, fontWeight:600, color:'var(--clr-ink-4)',
                  textTransform:'uppercase', letterSpacing:'0.05em' }}>
                  {ATTR_LABELS[key]}
                </span>
                <DotScore value={avg} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All Reviews */}
      <section aria-label="All reviews">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
          marginBottom:14, flexWrap:'wrap', gap:10 }}>
          <SectionHeading>All Reviews</SectionHeading>
          <Btn size="sm" onClick={() => navigate('createReview')}
            ariaLabel="Write a review for this spot">
            + Write a Review
          </Btn>
        </div>

        {rankings.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="No reviews yet"
            subtitle="Be the first to rate this spot!"
            action={<Btn onClick={() => navigate('createReview')}>Write a Review</Btn>}
          />
        ) : (
          rankings.map(r => (
            <RankingCard key={r.id} ranking={r} />
          ))
        )}
        {/* TODO: Pagination — GET /api/spots/:spotId/rankings?page=N */}
      </section>
    </main>
  );
}

const containerStyle = {
  maxWidth: 'var(--max-w)', margin: '0 auto', padding: '24px var(--px)',
};

const overviewStyle = {
  background: 'var(--clr-surface)', borderRadius: 'var(--r-xl)',
  border: '1px solid var(--clr-paper-2)', boxShadow: 'var(--sh-sm)',
  padding: 24, marginBottom: 16,
};

const avgStatsStyle = {
  background: 'var(--clr-surface)', borderRadius: 'var(--r-xl)',
  border: '1px solid var(--clr-paper-2)', boxShadow: 'var(--sh-sm)',
  padding: 20, marginBottom: 24,
};
