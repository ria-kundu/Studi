// src/pages/FeedPage.jsx
import { useEffect, useState } from 'react';
import { useRouter } from '../App.jsx';
import { apiRequest } from '../api/client.js';
import { mapRanking } from '../api/mappers.js';
import RankingCard from '../components/RankingCard.jsx';
import { Btn, EmptyState, LoadingDots } from '../components/ui.jsx';

export default function FeedPage() {
  const { navigate } = useRouter();
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const updateOnlineStatus = () => setOnline(navigator.onLine);

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadFeed() {
      setLoading(true);
      setError('');

      try {
        const data = await apiRequest('/rankings/feed');
        if (!active) return;
        setRankings((data.rankings || []).map(mapRanking));
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unable to load rankings.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadFeed();

    return () => {
      active = false;
    };
  }, []);

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
        {loading && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
            justifyContent:'center', gap:12, padding:'32px 0' }}>
            <LoadingDots />
            {!online && (
              <p style={{ fontSize:13, color:'var(--clr-ink-4)', textAlign:'center' }}>
                You are offline. We are trying to fetch the latest ranking data.
              </p>
            )}
          </div>
        )}
        {!loading && error && (
          <EmptyState
            icon="!"
            title="Unable to load rankings"
            subtitle={!online
              ? 'You are offline. The app layout is available while we try to fetch the data.'
              : error}
          />
        )}
        {!loading && !error && rankings.length === 0 && (
          <EmptyState
            icon="📍"
            title="No rankings yet"
            subtitle="Be the first to rate a study spot."
            action={<Btn onClick={() => navigate('createReview')}>Rate a Spot</Btn>}
          />
        )}
        {!loading && !error && rankings.map(r => (
          <RankingCard key={r.id} ranking={r} />
        ))}
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
