import { Suspense, lazy, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

import AppBackground from './components/layout/AppBackground.jsx';
import TopBar from './components/layout/TopBar.jsx';
import { useGuest } from './providers/GuestProvider.jsx';
import { useTheme } from './providers/ThemeProvider.jsx';
import { useAudio } from './providers/AudioProvider.jsx';
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

const PageTransition = ({ children }) => (
  <motion.div
    className="route-transition"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.6, ease: 'easeInOut' }}
  >
    {children}
  </motion.div>
);

const App = () => {
  const location = useLocation();
  const { guest } = useGuest();
  const { theme } = useTheme();
  const { stopAudio, startAudio, isPlaying } = useAudio();
  const previousPathRef = useRef(location.pathname);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const html = document.documentElement;
    html.setAttribute('lang', theme?.locale ?? 'en');
    html.setAttribute('dir', theme?.toggles?.textDirection ?? 'ltr');
  }, [theme?.locale, theme?.toggles?.textDirection]);

  useEffect(() => {
    const previous = previousPathRef.current;
    if (previous === location.pathname) return;

    if (previous === '/invite') {
      stopAudio?.(1200);
    }

    if (location.pathname === '/invite' && isPlaying) {
      startAudio?.({ force: false });
    }

    previousPathRef.current = location.pathname;
  }, [isPlaying, location.pathname, startAudio, stopAudio]);

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
              <Route
                path="/"
                element={
                  <PageTransition>
                    <InviteEntryPage />
                  </PageTransition>
                }
              />
              <Route
                path="/invite"
                element={
                  <RequireGuest guest={guest}>
                    <PageTransition>
                      <InviteExperiencePage />
                    </PageTransition>
                  </RequireGuest>
                }
              />
              <Route
                path="/admin/*"
                element={
                  <PageTransition>
                    <AdminPage />
                  </PageTransition>
                }
              />
              <Route
                path="*"
                element={
                  <PageTransition>
                    <NotFoundPage />
                  </PageTransition>
                }
              />
            </Routes>
          </LazyAnimatePresence>
        </Suspense>
      </main>
    </div>
  );
};

export default App;
