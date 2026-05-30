// src/App.jsx
import { useState, useCallback, createContext, useContext } from 'react';
import NavBar from './components/NavBar.jsx';
import Toast from './components/Toast.jsx';
import FeedPage from './pages/FeedPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import SearchPage from './pages/SearchPage.jsx';
import CreateReviewPage from './pages/CreateReviewPage.jsx';
import SpotDetailPage from './pages/SpotDetailPage.jsx';
import { CURRENT_USER } from './data/mock.js';

// ─── Router Context ───────────────────────────────────────────
export const RouterContext = createContext(null);
export const useRouter = () => useContext(RouterContext);

// ─── Toast Context ────────────────────────────────────────────
export const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

export default function App() {
  const [page, setPage]           = useState('feed');
  const [ctx, setCtx]             = useState({});
  const [history, setHistory]     = useState([]);
  const [toasts, setToasts]       = useState([]);

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

  // ── Toast ────────────────────────────────────────────────────
  const showToast = useCallback((message) => {
    const id = Date.now();
    setToasts(t => [...t, { id, message }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);

  // ── Active tab for nav highlight ─────────────────────────────
  const activeTab =
    page === 'userProfile' ? 'profile' :
    page === 'spotDetail'  ? 'feed'    :
    page === 'createReview'? 'feed'    : page;

  // ── Page → Component map ─────────────────────────────────────
  const renderPage = () => {
    const key = `${page}-${JSON.stringify(ctx)}`; // remount on context change
    switch (page) {
      case 'feed':
        return <FeedPage key={key} />;
      case 'profile':
        return <ProfilePage key={key} userId={CURRENT_USER.id} isOwn />;
      case 'userProfile':
        return <ProfilePage key={key} userId={ctx.userId} isOwn={ctx.userId === CURRENT_USER.id} />;
      case 'search':
        return <SearchPage key={key} />;
      case 'createReview':
        return <CreateReviewPage key={key} />;
      case 'spotDetail':
        return <SpotDetailPage key={key} spotName={ctx.spotName} />;
      default:
        return <FeedPage key="feed" />;
    }
  };

  return (
    <RouterContext.Provider value={{ page, ctx, navigate, back, tabNavigate, activeTab }}>
      <ToastContext.Provider value={showToast}>
        {/* Skip link for accessibility */}
        <a className="skip-link" href="#main-content">Skip to main content</a>

        <NavBar currentUser={CURRENT_USER} />

        {/* Main content area — offset for fixed navbar */}
        <div style={wrapperStyle}>
          <div className="page-enter" style={{ minHeight: '100vh' }}>
            {renderPage()}
          </div>
        </div>

        {/* Toast notifications */}
        <div style={toastContainerStyle} role="status" aria-live="polite" aria-atomic="true">
          {toasts.map(t => <Toast key={t.id} message={t.message} />)}
        </div>
      </ToastContext.Provider>
    </RouterContext.Provider>
  );
}

const wrapperStyle = {
  paddingTop: 'calc(var(--nav-h) + var(--mob-tab-h))',
  '@media (min-width: 768px)': { paddingTop: 'var(--nav-h)' },
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
