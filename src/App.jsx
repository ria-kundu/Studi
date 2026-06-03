// src/App.jsx
import { useState, useCallback, createContext, useContext, useEffect } from 'react';
import { apiRequest } from './api/client.js';
import { clearStoredSession, getStoredSession, loginWithEmail, signUpWithEmail } from './api/auth.js';
import { mapUser } from './api/mappers.js';
import NavBar from './components/NavBar.jsx';
import Toast from './components/Toast.jsx';
import FeedPage from './pages/FeedPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import SearchPage from './pages/SearchPage.jsx';
import CreateReviewPage from './pages/CreateReviewPage.jsx';
import UpdateReviewPage from './pages/UpdateReviewPage.jsx';
import SpotDetailPage from './pages/SpotDetailPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignUpPage from './pages/SignUpPage.jsx';

// ─── Router Context ───────────────────────────────────────────
export const RouterContext = createContext(null);
export const useRouter = () => useContext(RouterContext);

// ─── Toast Context ────────────────────────────────────────────
export const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

// ─── Auth Context ─────────────────────────────────────────────
export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export default function App() {
  const [page, setPage]           = useState('login');
  const [ctx, setCtx]             = useState({});
  const [history, setHistory]     = useState([]);
  const [toasts, setToasts]       = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [authStatus, setAuthStatus] = useState('loading');

  // ── Navigation ──────────────────────────────────────────────
  const navigate = useCallback((nextPage, nextCtx = {}) => {
    setHistory(h => [...h, { page, ctx }]);
    setPage(nextPage);
    setCtx(nextCtx);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page, ctx]);

  const back = useCallback(() => {
    setHistory(h => {
      if (h.length === 0) { setPage('feed'); setCtx({}); return h; }
      const prev = h[h.length - 1];
      setPage(prev.page);
      setCtx(prev.ctx);
      return h.slice(0, -1);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Tab navigation resets history
  const tabNavigate = useCallback((nextPage) => {
    setHistory([]);
    setCtx({});
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    let active = true;

    async function restoreAuth() {
      if (!getStoredSession()) {
        if (!active) return;
        setAuthStatus('signedOut');
        setPage('login');
        return;
      }

      try {
        const data = await apiRequest('/auth/me');
        if (!active) return;
        setCurrentUser(mapUser(data.user));
        setAuthStatus('signedIn');
        setPage('feed');
      } catch {
        clearStoredSession();
        if (!active) return;
        setCurrentUser(null);
        setAuthStatus('signedOut');
        setPage('login');
      }
    }

    restoreAuth();

    return () => {
      active = false;
    };
  }, []);

  // ── Toast ────────────────────────────────────────────────────
  const showToast = useCallback((message) => {
    const id = Date.now();
    setToasts(t => [...t, { id, message }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);

  const login = useCallback(async ({ email, password }) => {
    await loginWithEmail(email, password);
    const data = await apiRequest('/auth/session', { method: 'POST' });
    const user = mapUser(data.user);
    setCurrentUser(user);
    setAuthStatus('signedIn');
    tabNavigate('feed');
    return user;
  }, [tabNavigate]);

  const signup = useCallback(async ({ name, email, password }) => {
    await signUpWithEmail(email, password);
    await apiRequest('/auth/session', { method: 'POST' });
    const data = await apiRequest('/users/me', {
      method: 'PATCH',
      body: { displayName: name },
    });
    const user = mapUser(data.user);
    setCurrentUser(user);
    setAuthStatus('signedIn');
    tabNavigate('feed');
    return user;
  }, [tabNavigate]);

  const logout = useCallback(async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST', auth: false });
    } finally {
      clearStoredSession();
      setCurrentUser(null);
      setAuthStatus('signedOut');
      setHistory([]);
      setCtx({});
      setPage('login');
    }
  }, []);

  const updateCurrentUser = useCallback((user) => {
    setCurrentUser(user);
  }, []);

  // ── Active tab for nav highlight ─────────────────────────────
  const activeTab =
    page === 'userProfile' ? 'profile' :
    page === 'spotDetail'  ? 'feed'    :
    page === 'createReview'? 'feed'    :
    page === 'updateReview'? 'feed'    : page;

  // ── Page → Component map ─────────────────────────────────────
  const renderPage = () => {
    const key = `${page}-${JSON.stringify(ctx)}`; // remount on context change
    if (authStatus === 'loading') {
      return <LoadingPage />;
    }

    if (authStatus !== 'signedIn') {
      return page === 'signup'
        ? <SignUpPage key="signup" />
        : <LoginPage key="login" />;
    }

    switch (page) {
      case 'feed':
        return <FeedPage key={key} />;
      case 'profile':
        return <ProfilePage key={key} userId={currentUser.id} isOwn />;
      case 'userProfile':
        return <ProfilePage key={key} userId={ctx.userId} isOwn={ctx.userId === currentUser.id} />;
      case 'search':
        return <SearchPage key={key} />;
      case 'createReview':
        return <CreateReviewPage key={key} />;
      case 'updateReview':
        return <UpdateReviewPage key={key} rankingId={ctx.rankingId} spotId={ctx.spotId} spotName={ctx.spotName} />;
      case 'spotDetail':
        return <SpotDetailPage key={key} spotId={ctx.spotId} spotName={ctx.spotName} />;
      default:
        return <FeedPage key="feed" />;
    }
  };

  const authValue = {
    currentUser,
    authStatus,
    login,
    signup,
    logout,
    updateCurrentUser,
  };

  return (
    <RouterContext.Provider value={{ page, ctx, navigate, back, tabNavigate, activeTab }}>
      <AuthContext.Provider value={authValue}>
        <ToastContext.Provider value={showToast}>
          {/* Skip link for accessibility */}
          <a className="skip-link" href="#main-content">Skip to main content</a>

          {authStatus === 'signedIn' && <NavBar currentUser={currentUser} onLogout={logout} />}

          {/* Main content area — offset for fixed navbar */}
          <div style={authStatus === 'signedIn' ? wrapperStyle : authWrapperStyle}>
            <div className="page-enter" style={{ minHeight: '100vh' }}>
              {renderPage()}
            </div>
          </div>

          {/* Toast notifications */}
          <div style={toastContainerStyle} role="status" aria-live="polite" aria-atomic="true">
            {toasts.map(t => <Toast key={t.id} message={t.message} />)}
          </div>
        </ToastContext.Provider>
      </AuthContext.Provider>
    </RouterContext.Provider>
  );
}

function LoadingPage() {
  return (
    <main id="main-content" style={{ minHeight:'100vh', display:'grid', placeItems:'center', padding:'24px var(--px)' }}>
      <div style={{ fontFamily:'var(--font-display)', fontWeight:700, color:'var(--clr-ink-3)' }}>
        Loading StudySpot...
      </div>
    </main>
  );
}

const wrapperStyle = {
  paddingTop: 'calc(var(--nav-h) + var(--mob-tab-h))',
  '@media (min-width: 768px)': { paddingTop: 'var(--nav-h)' },
};

const authWrapperStyle = {
  minHeight: '100vh',
};

const toastContainerStyle = {
  position: 'fixed',
  bottom: '24px',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 9000,
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  pointerEvents: 'none',
};
