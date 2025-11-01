import { useMemo, useState } from 'react';
import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { motion } from 'framer-motion';
import TextInput from '../../components/common/TextInput.jsx';
import Button from '../../components/common/Button.jsx';
import localGuests from '../../data/local-guests.json';
import { RSVP_STATUSES, STORAGE_KEYS } from '../../utils/constants.js';
import GuestSpreadsheetImporter from '../../tools/GuestSpreadsheetImporter.jsx';
import ThemeStudioPage from './ThemeStudioPage.jsx';
import './AdminPage.css';

const normaliseGuest = (guest) => {
  const guestNames = Array.isArray(guest.guestNames)
    ? guest.guestNames.filter(Boolean).map((value) => value.trim())
    : [guest.guestName, guest.partnerName].filter(Boolean).map((value) => value.trim());

  const primaryGuest = guestNames[0] ?? '';
  const partnerName = guestNames[1] ?? null;
  const householdCount = Number.isFinite(guest.householdCount)
    ? guest.householdCount
    : Number.isFinite(guest.household)
      ? guest.household
      : Math.max(guestNames.length, 1);

  return {
    code: guest.code,
    guestNames,
    primaryGuest,
    partnerName,
    householdCount,
    householdId: guest.householdId ?? null,
    contact: guest.contact ?? '',
    rsvpStatus: guest.rsvpStatus ?? 'pending',
    notes: guest.notes ?? '',
    lastUpdated: guest.lastUpdated ?? null,
  };
};

const DashboardOverview = ({ entries, stats, updateGuestStatus }) => (
  <div className="admin-dashboard">
    <div className="admin-stats grid-two">
      <div className="stat-card">
        <span className="stat-label">Total Households</span>
        <span className="stat-value">{stats.total}</span>
      </div>
      <div className="stat-card">
        <span className="stat-label">Confirmed</span>
        <span className="stat-value">{stats.confirmed}</span>
      </div>
      <div className="stat-card">
        <span className="stat-label">Pending</span>
        <span className="stat-value">{stats.pending}</span>
      </div>
      <div className="stat-card">
        <span className="stat-label">Declined</span>
        <span className="stat-value">{stats.declined}</span>
      </div>
      <div className="stat-card full">
        <span className="stat-label">Expected attendees</span>
        <span className="stat-value">{stats.guestsAttending}</span>
      </div>
    </div>

    <div className="guest-table">
      <div className="guest-table__header">
        <span>Guest</span>
        <span>Partner</span>
        <span>Household</span>
        <span>Status</span>
        <span>Notes</span>
        <span>Actions</span>
      </div>
      {entries.map((guest) => (
        <div key={guest.code} className="guest-table__row">
          <span>
            <strong>{guest.primaryGuest || '—'}</strong>
            <small>{guest.code}</small>
          </span>
          <span>{guest.partnerName ?? '—'}</span>
          <span>{guest.householdId ?? guest.householdCount ?? '—'}</span>
          <span className={`status status--${guest.rsvpStatus}`}>{guest.rsvpStatus}</span>
          <span className="notes">{guest.notes || '—'}</span>
          <span className="actions">
            <Button size="md" variant="ghost" onClick={() => updateGuestStatus(guest.code, RSVP_STATUSES.confirmed)}>
              Confirm
            </Button>
            <Button size="md" variant="ghost" onClick={() => updateGuestStatus(guest.code, RSVP_STATUSES.pending)}>
              Pending
            </Button>
            <Button size="md" variant="ghost" onClick={() => updateGuestStatus(guest.code, RSVP_STATUSES.declined)}>
              Decline
            </Button>
          </span>
        </div>
      ))}
    </div>
  </div>
);

const AdminPage = () => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return Boolean(localStorage.getItem(STORAGE_KEYS.adminSession));
    } catch (err) {
      console.warn('Unable to load admin session', err);
      return false;
    }
  });

  const [entries, setEntries] = useState(() => {
    const storedGuest = (() => {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.guest);
        if (!stored) return null;
        const parsed = JSON.parse(stored);
        return parsed?.guest ? { ...parsed.guest, code: parsed.inviteCode } : null;
      } catch (err) {
        console.warn('Failed to parse stored guest', err);
        return null;
      }
    })();

    const combined = storedGuest && !localGuests.some((guest) => guest.code === storedGuest.code)
      ? [...localGuests, storedGuest]
      : localGuests;

    return combined.map((guest) => normaliseGuest(guest));
  });

  const stats = useMemo(() => {
    const total = entries.length;
    const confirmed = entries.filter((guest) => guest.rsvpStatus === RSVP_STATUSES.confirmed).length;
    const pending = entries.filter((guest) => guest.rsvpStatus === RSVP_STATUSES.pending).length;
    const declined = entries.filter((guest) => guest.rsvpStatus === RSVP_STATUSES.declined).length;
    const guestsAttending = entries.reduce((acc, guest) => {
      if (guest.rsvpStatus === RSVP_STATUSES.confirmed) {
        return acc + (guest.householdCount ?? 1) + (guest.additionalGuests ?? 0);
      }
      return acc;
    }, 0);

    return { total, confirmed, pending, declined, guestsAttending };
  }, [entries]);

  const authenticate = (event) => {
    event.preventDefault();
    const expected = (import.meta.env.VITE_ADMIN_CODE || import.meta.env.VITE_ADMIN_PASSCODE || 'emerald-veil').toString();
    if (passcode.trim() === expected) {
      setIsAuthenticated(true);
      setError('');
      try {
        localStorage.setItem(STORAGE_KEYS.adminSession, 'true');
      } catch (err) {
        console.warn('Unable to persist admin session', err);
      }
    } else {
      setError('Incorrect passcode');
    }
  };

  const updateGuestStatus = (code, status) => {
    setEntries((prev) =>
      prev.map((guest) =>
        guest.code === code
          ? { ...guest, rsvpStatus: status, lastUpdated: new Date().toISOString() }
          : guest
      )
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="page-panel admin-login">
        <motion.form
          className="admin-login__form"
          onSubmit={authenticate}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="badge">Admin portal</span>
          <h1 className="page-title">Steward of the Guest List</h1>
          <p className="page-subtitle">Enter the passcode shared privately to access attendance insights.</p>
          <TextInput
            label="Passcode"
            type="password"
            value={passcode}
            onChange={(event) => setPasscode(event.target.value)}
            error={error}
          />
          <Button type="submit" variant="primary" size="lg">
            Unlock Dashboard
          </Button>
        </motion.form>
      </div>
    );
  }

  return (
    <div className="page-panel admin-shell">
      <aside className="admin-sidebar">
        <span className="admin-sidebar__label">Admin navigation</span>
        <nav className="admin-nav">
          <NavLink end to="/admin" className={({ isActive }) => (isActive ? 'admin-nav__link admin-nav__link--active' : 'admin-nav__link')}>
            Overview
          </NavLink>
          <NavLink
            to="/admin/import"
            className={({ isActive }) => (isActive ? 'admin-nav__link admin-nav__link--active' : 'admin-nav__link')}
          >
            Bulk Import Guests
          </NavLink>
          <NavLink
            to="/admin/studio"
            className={({ isActive }) => (isActive ? 'admin-nav__link admin-nav__link--active' : 'admin-nav__link')}
          >
            Theme Studio
          </NavLink>
        </nav>
      </aside>

      <section className="admin-content">
        <Routes>
          <Route
            index
            element={<DashboardOverview entries={entries} stats={stats} updateGuestStatus={updateGuestStatus} />}
          />
          <Route path="import" element={<GuestSpreadsheetImporter existingGuests={entries} />} />
          <Route path="studio" element={<ThemeStudioPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </section>
    </div>
  );
};

export default AdminPage;
