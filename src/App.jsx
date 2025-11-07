import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

import AppBackground from './components/layout/AppBackground.jsx';
import TopBar from './components/layout/TopBar.jsx';
import { useGuest } from './providers/GuestProvider.jsx';
import { useTheme } from './providers/ThemeProvider.jsx';
import './styles/app.css';

const InviteEntryPage = lazy(() => import('./pages/InviteEntryPage.jsx'));
const InviteExperiencePage = lazy(() => import('./pages/InviteExperiencePage.jsx'));
const AdminPage = lazy(() => import('./pages/admin/AdminPage.jsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));

const LazyAnimatePresence = lazy(() =>
  import('framer-motion').then((module) => ({ default: module.AnimatePresence }))
);

const ScrollRestoration = ({ pathname }) => {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
};

const RequireGuest = ({ guest, children }) => {
  if (guest) {
    return children;
  }

  return <Navigate to="/" replace />;
};

const App = () => {
  const location = useLocation();
  const { guest } = useGuest();
  const { theme } = useTheme();

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const html = document.documentElement;
    html.setAttribute('lang', theme?.locale ?? 'en');
    html.setAttribute('dir', theme?.toggles?.textDirection ?? 'ltr');
  }, [theme?.locale, theme?.toggles?.textDirection]);

  return (
    <div className="app-shell">
      <ScrollRestoration pathname={location.pathname} />
      <AppBackground />
      <TopBar />
      <main className="app-main">
        <Suspense
          fallback={
            <div className="app-loading" aria-live="polite">
              Loading…
            </div>
          }
        >
          <LazyAnimatePresence mode="wait" initial={false}>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<InviteEntryPage />} />
              <Route
                path="/invite"
                element={
                  <RequireGuest guest={guest}>
                    <InviteExperiencePage />
                  </RequireGuest>
                }
              />
              <Route path="/admin/*" element={<AdminPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </LazyAnimatePresence>
        </Suspense>
      </main>
    </div>
  );
};

export default App;
