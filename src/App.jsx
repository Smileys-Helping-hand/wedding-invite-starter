import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import InviteEntryPage from './pages/InviteEntryPage.jsx';
import InviteExperiencePage from './pages/InviteExperiencePage.jsx';
import AdminPage from './pages/admin/AdminPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import AppBackground from './components/layout/AppBackground.jsx';
import TopBar from './components/layout/TopBar.jsx';
import { useGuest } from './providers/GuestProvider.jsx';
import './styles/app.css';

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

  return (
    <div className="app-shell">
      <ScrollRestoration pathname={location.pathname} />
      <AppBackground />
      <TopBar />
      <main className="app-main">
        <AnimatePresence mode="wait" initial={false}>
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
        </AnimatePresence>
      </main>
    </div>
  );
};

export default App;
