// src/pages/ProfilePage.jsx
import { useRouter } from '../App.jsx';
import { USERS, MOCK_RANKINGS } from '../data/mock.js';
import RankingCard from '../components/RankingCard.jsx';
import { Avatar, Btn, BackLink, SectionHeading, EmptyState } from '../components/ui.jsx';

export default function ProfilePage({ userId, isOwn }) {
  const { back, navigate } = useRouter();
  // TODO: GET /api/users/:userId — fetch user profile data
  // TODO: GET /api/users/:userId/rankings?sort=newest — sorted rankings list, paginated
  const user     = USERS[userId];
  const rankings = MOCK_RANKINGS.filter(r => r.userId === userId);

  if (!user) {
    return (
      <main id="main-content" style={containerStyle}>
        <EmptyState icon="❓" title="User not found" />
      </main>
    );
  }

  return (
    <main id="main-content" style={containerStyle}>
      {!isOwn && <BackLink onClick={back} />}

      {/* Profile Header Card */}
      <section style={headerCardStyle} aria-label="Profile information">
        <div style={{ display:'flex', alignItems:'flex-start', gap:16 }}>
          <Avatar user={user} size="xl" />
          <div style={{ flex:1, minWidth:0 }}>
            <h1 style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:24,
              color:'var(--clr-ink)', lineHeight:1.15, letterSpacing:'-0.02em' }}>
              {user.name}
            </h1>
            <p style={{ fontSize:13, color:'var(--clr-ink-4)', marginTop:2 }}>{user.handle}</p>
            {user.bio && (
              <p style={{ fontSize:13, color:'var(--clr-ink-3)', marginTop:6, lineHeight:1.5 }}>
                {user.bio}
              </p>
            )}
          </div>
          {isOwn && (
            <Btn variant="ghost" size="sm" ariaLabel="Edit your profile"
              onClick={() => {/* TODO: Open edit profile modal — PATCH /api/users/:userId */}}>
              Edit
            </Btn>
          )}
        </div>

        {/* Stats */}
        <div style={{ display:'flex', gap:32, marginTop:20,
          paddingTop:20, borderTop:'1px solid var(--clr-paper-2)' }}>
          <StatItem value={rankings.length} label="Rankings" />
          {/* TODO: Pull follower/following counts from backend */}
          <StatItem value="—" label="Followers" />
          <StatItem value="—" label="Following" />
        </div>
      </section>

      {/* Rankings List */}
      <section aria-label={isOwn ? 'Your rankings' : `${user.name}'s rankings`}>
        <SectionHeading>
          {isOwn ? 'Your Rankings' : `${user.name}'s Rankings`}
        </SectionHeading>

        {rankings.length === 0 ? (
          <EmptyState
            icon="📍"
            title="No rankings yet"
            subtitle={isOwn ? 'Be the first to rate a spot!' : `${user.name} hasn't ranked any spots yet.`}
            action={isOwn
              ? <Btn onClick={() => navigate('createReview')}>Rate a Spot</Btn>
              : null}
          />
        ) : (
          rankings.map(r => (
            <RankingCard key={r.id} ranking={r} hideUserLink />
          ))
        )}
        {/* TODO: Pagination — GET /api/users/:userId/rankings?page=N */}
      </section>
    </main>
  );
}

function StatItem({ value, label }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
      <span style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:24,
        color:'var(--clr-ink)', lineHeight:1 }}>
        {value}
      </span>
      <span style={{ fontSize:11, color:'var(--clr-ink-4)', fontWeight:600,
        textTransform:'uppercase', letterSpacing:'0.06em' }}>
        {label}
      </span>
    </div>
  );
}

const containerStyle = {
  maxWidth: 'var(--max-w)', margin: '0 auto', padding: '24px var(--px)',
};

const headerCardStyle = {
  background: 'var(--clr-surface)', borderRadius: 'var(--r-xl)',
  border: '1px solid var(--clr-paper-2)', boxShadow: 'var(--sh-sm)',
  padding: 24, marginBottom: 24,
};
