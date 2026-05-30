// src/components/RankingCard.jsx
import { useState } from 'react';
import { useRouter } from '../App.jsx';
import { useToast } from '../App.jsx';
import { USERS, CURRENT_USER } from '../data/mock.js';
import { Avatar, Badge, Stars, ScoreGrid, MediaThumb } from './ui.jsx';

export default function RankingCard({ ranking, hideUserLink = false }) {
  const { navigate } = useRouter();
  const showToast    = useToast();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments]         = useState(ranking.comments);
  const [commentText, setCommentText]   = useState('');

  const user = USERS[ranking.userId] || { name: 'Unknown', handle: '@?', initials: '?' };

  function handleComment(e) {
    e.preventDefault();
    const text = commentText.trim();
    if (!text) return;
    // TODO: POST /api/comments { rankingId: ranking.id, userId: CURRENT_USER.id, text }
    setComments(prev => [...prev, {
      id: `c_${Date.now()}`, userId: CURRENT_USER.id, text, time: 'Just now',
    }]);
    setCommentText('');
    showToast('Comment posted!');
  }

  return (
    <article style={cardStyle}>
      {/* ── Header ── */}
      <header style={{ display:'flex', gap:12, alignItems:'flex-start', padding:'20px 20px 12px' }}>
        {!hideUserLink ? (
          <button onClick={() => navigate('userProfile', { userId: ranking.userId })}
            style={{ border:'none', background:'none', cursor:'pointer', borderRadius:'50%', padding:0 }}
            aria-label={`View ${user.name}'s profile`}>
            <Avatar user={user} size="md" />
          </button>
        ) : (
          <Avatar user={user} size="md" />
        )}

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            {!hideUserLink ? (
              <button onClick={() => navigate('userProfile', { userId: ranking.userId })}
                style={{ fontSize:13, fontWeight:600, color:'var(--clr-ink)', background:'none',
                  border:'none', cursor:'pointer', padding:0, fontFamily:'var(--font-body)',
                  transition:'color 120ms ease' }}
                onMouseOver={e => e.currentTarget.style.color='var(--clr-primary)'}
                onMouseOut={e  => e.currentTarget.style.color='var(--clr-ink)'}>
                {user.name}
              </button>
            ) : (
              <span style={{ fontSize:13, fontWeight:600, color:'var(--clr-ink)' }}>{user.name}</span>
            )}
            <span style={{ fontSize:12, color:'var(--clr-ink-4)' }}>{user.handle}</span>
            <span style={{ fontSize:12, color:'var(--clr-paper-3)' }} aria-hidden="true">·</span>
            <time style={{ fontSize:12, color:'var(--clr-ink-4)' }}>{ranking.timestamp}</time>
          </div>

          <button onClick={() => navigate('spotDetail', { spotName: ranking.spotName })}
            style={{ fontFamily:'var(--font-display)', fontSize:17, fontWeight:700,
              color:'var(--clr-ink)', background:'none', border:'none', cursor:'pointer',
              padding:0, textAlign:'left', marginTop:2, lineHeight:1.3,
              transition:'color 120ms ease', display:'block' }}
            onMouseOver={e => e.currentTarget.style.color='var(--clr-primary)'}
            onMouseOut={e  => e.currentTarget.style.color='var(--clr-ink)'}>
            {ranking.spotName}
          </button>

          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6, flexWrap:'wrap' }}>
            <Badge category={ranking.category} />
            <span style={{ color:'var(--clr-paper-3)', fontSize:12 }} aria-hidden="true">·</span>
            <Stars score={ranking.overallScore} />
          </div>
        </div>
      </header>

      {/* ── Media ── */}
      {ranking.media.length > 0 && (
        <div style={{ padding:'0 20px 12px', display:'flex', gap:8,
          overflowX:'auto', scrollbarWidth:'none' }} aria-label="Media">
          {ranking.media.map((m, i) => <MediaThumb key={i} item={m} />)}
        </div>
      )}

      {/* ── Scores + Info ── */}
      <div style={{ padding:'0 20px 12px' }}>
        <ScoreGrid ranking={ranking} />
        {ranking.hours && (
          <p style={{ fontSize:12, color:'var(--clr-ink-3)', marginTop:8 }}>
            <strong style={{ color:'var(--clr-ink)' }}>Hours:</strong> {ranking.hours}
          </p>
        )}
        {ranking.notes && (
          <p style={{ fontSize:13, color:'var(--clr-ink-3)', marginTop:8,
            lineHeight:1.6, fontStyle:'italic' }}>
            "{ranking.notes}"
          </p>
        )}
      </div>

      {/* ── Comments ── */}
      <footer style={{ padding:'10px 20px 16px', borderTop:'1px solid var(--clr-paper-2)' }}>
        <button onClick={() => setCommentsOpen(v => !v)}
          aria-expanded={commentsOpen}
          aria-controls={`comments-${ranking.id}`}
          style={{ fontSize:12, fontWeight:500, color:'var(--clr-ink-3)', background:'none',
            border:'none', cursor:'pointer', padding:0, transition:'color 120ms ease',
            fontFamily:'var(--font-body)' }}
          onMouseOver={e => e.currentTarget.style.color='var(--clr-primary)'}
          onMouseOut={e  => e.currentTarget.style.color='var(--clr-ink-3)'}>
          {commentsOpen ? 'Hide comments' : `Comments (${comments.length})`}
        </button>

        {commentsOpen && (
          <div id={`comments-${ranking.id}`} role="region" aria-label="Comments"
            style={{ marginTop:12 }}>
            {comments.length > 0 && (
              <ul style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:12 }}
                aria-label="Comment list">
                {comments.map(c => {
                  const cu = USERS[c.userId] || { name:'User', initials:'?' };
                  return (
                    <li key={c.id} style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                      <Avatar user={cu} size="sm" />
                      <div style={{ background:'var(--clr-paper)', borderRadius:'var(--r-lg)',
                        borderBottomLeftRadius:4, padding:'7px 12px', flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ fontSize:12, fontWeight:600, color:'var(--clr-ink)' }}>
                            {cu.name}
                          </span>
                          <time style={{ fontSize:11, color:'var(--clr-ink-4)' }}>{c.time}</time>
                        </div>
                        <p style={{ fontSize:12, color:'var(--clr-ink-3)', marginTop:2, lineHeight:1.5 }}>
                          {c.text}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Add comment */}
            <form onSubmit={handleComment}
              style={{ display:'flex', gap:8, alignItems:'center' }}
              aria-label="Add a comment">
              {/* TODO: Associate comment with authenticated user via backend */}
              <Avatar user={CURRENT_USER} size="sm" />
              <input type="text" value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Add a comment…"
                aria-label="Comment text"
                autoComplete="off"
                style={{ flex:1, background:'var(--clr-paper)', border:'1.5px solid transparent',
                  borderRadius:'var(--r-lg)', padding:'7px 12px', fontSize:12,
                  color:'var(--clr-ink)', outline:'none', fontFamily:'var(--font-body)',
                  transition:'border-color 120ms ease' }}
                onFocus={e => e.target.style.borderColor='var(--clr-primary-dim)'}
                onBlur={e  => e.target.style.borderColor='transparent'}
              />
              <button type="submit" aria-label="Post comment"
                style={{ width:32, height:32, borderRadius:'var(--r-md)', background:'var(--clr-primary)',
                  color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:14, flexShrink:0, border:'none', cursor:'pointer',
                  transition:'background 120ms ease' }}
                onMouseOver={e => e.currentTarget.style.background='var(--clr-primary-hover)'}
                onMouseOut={e  => e.currentTarget.style.background='var(--clr-primary)'}>
                ↑
              </button>
            </form>
          </div>
        )}
      </footer>
    </article>
  );
}

const cardStyle = {
  background: 'var(--clr-surface)',
  borderRadius: 'var(--r-xl)',
  border: '1px solid var(--clr-paper-2)',
  boxShadow: 'var(--sh-sm)',
  overflow: 'hidden',
  transition: 'box-shadow 200ms ease',
  marginBottom: 16,
};
