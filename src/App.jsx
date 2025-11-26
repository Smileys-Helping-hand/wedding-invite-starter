import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import InviteEntryPage from './pages/InviteEntryPage.jsx';
import InviteExperiencePage from './pages/InviteExperiencePage.jsx';
import CheckInPage from './pages/CheckInPage.jsx';
import EventDayGuestPage from './pages/EventDayGuestPage.jsx';
import AdminPage from './pages/admin/AdminPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import AppBackground from './components/layout/AppBackground.jsx';
import TopBar from './components/layout/TopBar.jsx';
import { useGuest } from './providers/GuestProvider.jsx';
import { EVENT_DAY_MODE_KEY, isEventDayModeEnabled } from './utils/guestUtils.js';
import './styles/app.css';

const ScrollRestoration = ({ pathname }) => {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
};

const InviteRoute = ({ guest, eventDayEnabled }) => {
  if (!guest) return <Navigate to="/" replace />;
  if (eventDayEnabled) return <Navigate to="/event-day/guest" replace />;
  return <InviteExperiencePage />;
};

const EventDayGuestRoute = ({ guest, eventDayEnabled }) => {
  if (!guest) return <Navigate to="/" replace />;
  if (!eventDayEnabled) return <Navigate to="/invite" replace />;
  return <EventDayGuestPage />;
};

const App = () => {
  const location = useLocation();
  const { guest } = useGuest();
  const [eventDayEnabled, setEventDayEnabled] = useState(() => isEventDayModeEnabled());

  useEffect(() => {
    const refreshMode = () => setEventDayEnabled(isEventDayModeEnabled());
    const storageHandler = (event) => {
      if (event.key === EVENT_DAY_MODE_KEY) {
        refreshMode();
      }
    };

    window.addEventListener('storage', storageHandler);
    window.addEventListener('hs:event-mode-change', refreshMode);

    return () => {
      window.removeEventListener('storage', storageHandler);
      window.removeEventListener('hs:event-mode-change', refreshMode);
    };
  }, []);

  return (
    <div className="app-shell">
      <ScrollRestoration pathname={location.pathname} />
      <AppBackground />
      <TopBar />
      <main className="app-main">
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<InviteEntryPage />} />
            <Route path="/invite" element={<InviteRoute guest={guest} eventDayEnabled={eventDayEnabled} />} />
            <Route
              path="/event-day/guest"
              element={<EventDayGuestRoute guest={guest} eventDayEnabled={eventDayEnabled} />}
            />
            <Route path="/checkin" element={<CheckInPage />} />
            <Route path="/check" element={<CheckInPage />} />
            <Route path="/admin/*" element={<AdminPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default App;
