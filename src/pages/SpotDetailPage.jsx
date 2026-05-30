// src/pages/SpotDetailPage.jsx
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from '../App.jsx';
import { apiRequest } from '../api/client.js';
import { mapRanking, mapSpot } from '../api/mappers.js';
import RankingCard from '../components/RankingCard.jsx';
import { Badge, Stars, DotScore, BackLink, Btn, SectionHeading, EmptyState, LoadingDots } from '../components/ui.jsx';
import { RATING_FIELDS } from '../data/mock.js';

export default function SpotDetailPage({ spotId, spotName }) {
  const { back, navigate } = useRouter();
  const [spot, setSpot] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(Boolean(spotId));
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadSpot() {
      if (!spotId) {
        setLoading(false);
        setSpot(null);
        setRankings([]);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const [spotData, rankingData] = await Promise.all([
          apiRequest(`/spots/${encodeURIComponent(spotId)}`),
          apiRequest(`/spots/${encodeURIComponent(spotId)}/rankings`),
        ]);

        if (!active) return;
        setSpot(mapSpot(spotData.spot));
        setRankings((rankingData.rankings || []).map(mapRanking));
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unable to load spot.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSpot();

    return () => {
      active = false;
    };
  }, [spotId]);

  const avgScore = spot?.avgScore || 0;
  const firstCategory = spot?.category ?? 'Other';

  // Compute average per attribute
  const avgAttrs = useMemo(() => RATING_FIELDS.map(({ key, label }) => ({
    key, label,
    avg: spot?.avgAttributes?.[key]
      ? Math.round(spot.avgAttributes[key])
      : rankings.length
        ? Math.round(rankings.reduce((s, r) => s + r[key], 0) / rankings.length)
        : 0,
  })), [rankings, spot]);

  const ATTR_LABELS = { quietness:'Quiet', restroom:'Restroom', wifi:'Wifi',
    outlets:'Outlets', crowdness:'Crowded', seating:'Seating' };

  if (loading) {
    return (
      <main id="main-content" style={containerStyle}>
        <BackLink onClick={back} />
        <div style={{ display:'flex', justifyContent:'center', padding:'64px 0' }}>
          <LoadingDots />
        </div>
      </main>
    );
  }

  if (error || (!spot && spotId)) {
    return (
      <main id="main-content" style={containerStyle}>
        <BackLink onClick={back} />
        <EmptyState icon="?" title="Spot not found" subtitle={error} />
      </main>
    );
  }

  return (
    <main id="main-content" style={containerStyle}>
      <BackLink onClick={back} />

      {/* Spot overview */}
      <section style={overviewStyle} aria-label="Spot overview">
        <h1 style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:30,
          color:'var(--clr-ink)', lineHeight:1.1, letterSpacing:'-0.02em' }}>
          {spot?.name || spotName}
        </h1>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:12, flexWrap:'wrap' }}>
          <Badge category={firstCategory} />
          {avgScore > 0 && <Stars score={parseFloat(avgScore.toFixed(1))} />}
          <span style={{ fontSize:13, color:'var(--clr-ink-4)' }}>
            {rankings.length} review{rankings.length !== 1 ? 's' : ''}
          </span>
        </div>
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
