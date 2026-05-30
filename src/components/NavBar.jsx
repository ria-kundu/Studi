// src/components/NavBar.jsx
import { useRouter } from '../App.jsx';
import { Avatar } from './ui.jsx';

const TABS = [
  { id: 'feed',    label: 'Home',    icon: '🏠' },
  { id: 'search',  label: 'Search',  icon: '🔍' },
  { id: 'profile', label: 'Profile', icon: '👤' },
];

export default function NavBar({ currentUser }) {
  const { activeTab, tabNavigate } = useRouter();

  function handleLogout() {
    // TODO: POST /api/auth/logout — clear session cookie, redirect to /login
    alert('Logout — TODO: implement auth logout');
  }

  return (
    <header role="banner" style={navStyle}>
      <div style={innerStyle}>
        {/* Logo */}
        <button onClick={() => tabNavigate('feed')} aria-label="StudySpot home"
          style={{ display:'flex', alignItems:'center', gap:8, background:'none', border:'none', cursor:'pointer', padding:'2px 4px', borderRadius:'var(--r-md)' }}>
          <span style={{ fontSize:'1.2rem', lineHeight:1 }} aria-hidden="true">📍</span>
          <span style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:17, color:'var(--clr-ink)', letterSpacing:'-0.02em' }}>
            Study<span style={{ color:'var(--clr-primary)' }}>Spot</span>
          </span>
        </button>

        {/* Desktop Tab Nav */}
        <nav style={{ display:'flex', alignItems:'center', gap:2 }} aria-label="Main navigation">
          {TABS.map(t => (
            <button key={t.id} onClick={() => tabNavigate(t.id)}
              aria-current={activeTab === t.id ? 'page' : undefined}
              style={{
                ...tabStyle,
                background: activeTab === t.id ? 'var(--clr-primary-dim)' : 'transparent',
                color: activeTab === t.id ? 'var(--clr-primary)' : 'var(--clr-ink-3)',
                fontWeight: activeTab === t.id ? 600 : 500,
              }}>
              {t.label}
            </button>
          ))}
        </nav>

        {/* Right: User + Logout */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={() => tabNavigate('profile')}
            aria-label={`View your profile, ${currentUser.name}`}
            style={{ display:'flex', alignItems:'center', gap:8, background:'none', border:'none', cursor:'pointer', borderRadius:'var(--r-full)', padding:2 }}>
            <Avatar user={currentUser} size="sm" />
            <span style={{ fontSize:13, fontWeight:500, color:'var(--clr-ink)', display:'none' }}
              className="user-name-desktop">
              {currentUser.name}
            </span>
          </button>
          <button onClick={handleLogout} aria-label="Log out"
            style={{ fontSize:12, color:'var(--clr-ink-4)', padding:'4px 8px',
              borderRadius:'var(--r-md)', background:'none', border:'none', cursor:'pointer',
              fontFamily:'var(--font-body)', transition:'color 120ms ease, background 120ms ease' }}
            onMouseOver={e => { e.currentTarget.style.color='var(--clr-danger)'; e.currentTarget.style.background='#fff2f0'; }}
            onMouseOut={e  => { e.currentTarget.style.color='var(--clr-ink-4)'; e.currentTarget.style.background='none'; }}>
            Logout
          </button>
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <nav style={mobileTabBarStyle} role="tablist" aria-label="Mobile navigation">
        {TABS.map(t => (
          <button key={t.id} role="tab"
            onClick={() => tabNavigate(t.id)}
            aria-selected={activeTab === t.id}
            aria-controls="main-content"
            style={{
              flex:1, display:'flex', flexDirection:'column', alignItems:'center',
              gap:2, padding:'8px 4px', fontSize:10, fontWeight:500,
              color: activeTab === t.id ? 'var(--clr-primary)' : 'var(--clr-ink-4)',
              background:'none', border:'none', cursor:'pointer',
              fontFamily:'var(--font-body)', transition:'color 120ms ease',
              letterSpacing:'0.02em',
            }}>
            <span style={{ fontSize:'1.1rem', lineHeight:1 }} aria-hidden="true">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {/* CSS to hide desktop tabs on mobile */}
      <style>{`
        @media (max-width: 767px) {
          nav[aria-label="Main navigation"] { display: none !important; }
        }
        @media (min-width: 768px) {
          nav[role="tablist"][aria-label="Mobile navigation"] { display: none !important; }
        }
        @media (min-width: 1024px) {
          .user-name-desktop { display: block !important; }
        }
      `}</style>
    </header>
  );
}

const navStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, zIndex: 500,
  background: 'rgba(245,243,239,0.92)', backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  borderBottom: '1px solid var(--clr-paper-2)', boxShadow: 'var(--sh-xs)',
};

const innerStyle = {
  maxWidth: 1100, margin: '0 auto', padding: '0 16px',
  height: 'var(--nav-h)', display: 'flex', alignItems: 'center',
  justifyContent: 'space-between', gap: 16,
};

const tabStyle = {
  padding: '7px 16px', borderRadius: 'var(--r-lg)', fontSize: 13,
  border: 'none', cursor: 'pointer', transition: 'all 120ms ease',
  fontFamily: 'var(--font-display)',
};

const mobileTabBarStyle = {
  display: 'flex', borderTop: '1px solid var(--clr-paper-2)',
};
