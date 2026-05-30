// src/pages/ProfilePage.jsx
import { useEffect, useState } from 'react';
import { useAuth, useRouter } from '../App.jsx';
import { apiRequest } from '../api/client.js';
import { mapRanking, mapUser } from '../api/mappers.js';
import RankingCard from '../components/RankingCard.jsx';
import {
  Avatar,
  Btn,
  BackLink,
  SectionHeading,
  EmptyState,
  LoadingDots,
  FormGroup,
  Label,
  TextInput,
  Textarea
} from '../components/ui.jsx';

export default function ProfilePage({ userId, isOwn }) {
  const { back, navigate } = useRouter();
  const { updateCurrentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ displayName: '', bio: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);
      setError('');

      try {
        const userPath = isOwn ? '/users/me' : `/users/${encodeURIComponent(userId)}`;
        const [userData, rankingData] = await Promise.all([
          apiRequest(userPath),
          apiRequest(`/users/${encodeURIComponent(userId)}/rankings`),
        ]);

        if (!active) return;
        const mappedUser = mapUser(userData.user);
        setUser(mappedUser);
        setEditForm({ displayName: mappedUser.name, bio: mappedUser.bio });
        setRankings((rankingData.rankings || []).map(mapRanking));
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unable to load profile.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [isOwn, userId]);

  async function handleProfileSave(e) {
    e.preventDefault();
    setSaveError('');

    if (!editForm.displayName.trim()) {
      setSaveError('Name is required.');
      return;
    }

    setSaving(true);
    try {
      const data = await apiRequest('/users/me', {
        method: 'PATCH',
        body: {
          displayName: editForm.displayName.trim(),
          bio: editForm.bio.trim(),
        },
      });
      const updated = mapUser(data.user);
      setUser(updated);
      updateCurrentUser(updated);
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main id="main-content" style={containerStyle}>
        <div style={{ display:'flex', justifyContent:'center', padding:'64px 0' }}>
          <LoadingDots />
        </div>
      </main>
    );
  }

  if (error || !user) {
    return (
      <main id="main-content" style={containerStyle}>
        <EmptyState icon="?" title="User not found" subtitle={error} />
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
              onClick={() => setEditing(v => !v)}>
              {editing ? 'Close' : 'Edit'}
            </Btn>
          )}
        </div>

        {isOwn && editing && (
          <form onSubmit={handleProfileSave}
            style={{ marginTop:20, paddingTop:20, borderTop:'1px solid var(--clr-paper-2)',
              display:'flex', flexDirection:'column', gap:16 }}
            aria-label="Edit profile">
            <FormGroup>
              <Label htmlFor="profile-display-name" required>Name</Label>
              <TextInput
                id="profile-display-name"
                name="displayName"
                value={editForm.displayName}
                onChange={e => setEditForm(f => ({ ...f, displayName: e.target.value }))}
                required
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="profile-bio">Bio</Label>
              <Textarea
                id="profile-bio"
                name="bio"
                value={editForm.bio}
                onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                rows={3}
              />
            </FormGroup>
            {saveError && <p role="alert" style={{ color:'var(--clr-danger)', fontSize:13 }}>{saveError}</p>}
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10, flexWrap:'wrap' }}>
              <Btn variant="ghost" onClick={() => setEditing(false)}>Cancel</Btn>
              <Btn type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</Btn>
            </div>
          </form>
        )}

        {/* Stats */}
        <div style={{ display:'flex', gap:32, marginTop:20,
          paddingTop:20, borderTop:'1px solid var(--clr-paper-2)' }}>
          <StatItem value={rankings.length} label="Rankings" />
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
