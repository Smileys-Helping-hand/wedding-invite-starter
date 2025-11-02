import { useCallback, useMemo, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { motion } from 'framer-motion';
import TextInput from '../../components/common/TextInput.jsx';
import Button from '../../components/common/Button.jsx';
import localGuests from '../../data/local-guests.json';
import { RSVP_STATUSES, STORAGE_KEYS } from '../../utils/constants.js';
import GuestSpreadsheetImporter from '../../tools/GuestSpreadsheetImporter.jsx';
import ThemeStudioPage from './ThemeStudioPage.jsx';
import AdminGuestsPage from './AdminGuestsPage.jsx';
import { useFirebase } from '../../providers/FirebaseProvider.jsx';
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
    additionalGuests: guest.additionalGuests ?? 0,
    lastUpdated: guest.lastUpdated ?? null,
  };
};

const formatGuestNames = (names = []) => names.map((value) => value?.trim()).filter(Boolean);

const lettersOnly = (value = '') => value.replace(/[^a-z]/gi, '').toUpperCase();

const computeNextHouseholdId = (entries = []) => {
  const highest = entries.reduce((acc, guest) => {
    const match = /H(\d+)/i.exec(guest.householdId ?? '');
    if (!match) return acc;
    const numeric = Number(match[1]);
    return Number.isFinite(numeric) ? Math.max(acc, numeric) : acc;
  }, 0);

  return `H${String(highest + 1).padStart(3, '0')}`;
};

const computeInviteCode = (
  entries = [],
  primaryName = '',
  partnerName = '',
  preferredCode,
  excludeCode
) => {
  const used = new Set(entries.map((guest) => guest.code?.toUpperCase()).filter(Boolean));
  if (excludeCode) {
    used.delete(excludeCode.toUpperCase());
  }

  if (preferredCode) {
    const candidate = preferredCode.toUpperCase();
    if (!used.has(candidate)) {
      return candidate;
    }
  }

  const baseLetters = lettersOnly(primaryName) || lettersOnly(partnerName) || 'RAZI';
  const prefix = (baseLetters.length >= 4 ? baseLetters.slice(0, 4) : baseLetters.padEnd(4, 'A')).toUpperCase();
  let counter = entries.length + 1;
  let candidate = `${prefix}${String(counter).padStart(4, '0')}`;

  while (used.has(candidate)) {
    counter += 1;
    candidate = `${prefix}${String(counter).padStart(4, '0')}`;
  }

  return candidate;
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
        <span>Companions</span>
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
          <span>
            {guest.guestNames.slice(1).length > 0
              ? guest.guestNames.slice(1).join(' & ')
              : '—'}
            {guest.additionalGuests > 0 && (
              <small>
                +{guest.additionalGuests} guest{guest.additionalGuests > 1 ? 's' : ''}
              </small>
            )}
          </span>
          <span>
            <strong>{guest.householdId ?? '—'}</strong>
            <small>{guest.householdCount ?? 1} invited</small>
          </span>
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
      return false;
    }
  });

  const [entries, setEntries] = useState(() => {
    const storedAdmin = (() => {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.adminGuests);
        if (!stored) return null;
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : null;
      } catch (err) {
        return null;
      }
    })();

    if (storedAdmin && storedAdmin.length > 0) {
      return storedAdmin.map((guest) => normaliseGuest(guest)).sort((a, b) =>
        a.primaryGuest.localeCompare(b.primaryGuest)
      );
    }

    const storedGuest = (() => {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.guest);
        if (!stored) return null;
        const parsed = JSON.parse(stored);
        return parsed?.guest ? { ...parsed.guest, code: parsed.inviteCode } : null;
      } catch (err) {
        return null;
      }
    })();

    const combined = storedGuest && !localGuests.some((guest) => guest.code === storedGuest.code)
      ? [...localGuests, storedGuest]
      : localGuests;

    return combined
      .map((guest) => normaliseGuest(guest))
      .sort((a, b) => a.primaryGuest.localeCompare(b.primaryGuest));
  });

  const updateEntries = useCallback((mutator) => {
    setEntries((prev) => {
      const next = mutator(prev);
      try {
        localStorage.setItem(STORAGE_KEYS.adminGuests, JSON.stringify(next));
      } catch (err) {
        /* storage unavailable; skip persistence */
      }
      return next;
    });
  }, []);

  const firebase = useFirebase();
  const remoteAddGuest = firebase?.addGuest;
  const remoteDeleteGuest = firebase?.deleteGuest;
  const remoteSaveRSVP = firebase?.saveRSVP;

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
        /* storage unavailable; session won't persist */
      }
    } else {
      setError('Incorrect passcode');
    }
  };

  const updateGuestStatus = (code, status) => {
    const timestamp = new Date().toISOString();
    updateEntries((prev) =>
      prev.map((guest) =>
        guest.code === code ? { ...guest, rsvpStatus: status, lastUpdated: timestamp } : guest
      )
    );
    if (remoteSaveRSVP) {
      remoteSaveRSVP(code, { rsvpStatus: status, lastUpdated: timestamp }).catch(() => {});
    }
  };

  const handleAddGuest = useCallback(
    (payload) => {
      const names = formatGuestNames(payload.guestNames);
      const primary = names[0] ?? '';
      const partner = names[1] ?? '';
      const code = computeInviteCode(entries, primary, partner, payload.code);
      const householdId = payload.householdId?.trim()
        ? payload.householdId.trim().toUpperCase()
        : computeNextHouseholdId(entries);
      const timestamp = new Date().toISOString();
      const guest = normaliseGuest({
        ...payload,
        code,
        guestNames: names,
        householdId,
        householdCount: Math.max(Number(payload.householdCount) || names.length, names.length),
        contact: payload.contact ?? '',
        notes: payload.notes ?? '',
        lastUpdated: timestamp,
      });

      updateEntries((prev) => [...prev, guest].sort((a, b) => a.primaryGuest.localeCompare(b.primaryGuest)));

      if (remoteAddGuest) {
        remoteAddGuest(code, {
          ...guest,
          lastUpdated: timestamp,
        }).catch(() => {});
      }
    },
    [entries, remoteAddGuest, updateEntries]
  );

  const handleUpdateGuest = useCallback(
    (existingCode, payload) => {
      const current = entries.find((guest) => guest.code === existingCode);
      if (!current) return;

      const names = formatGuestNames(payload.guestNames ?? current.guestNames);
      const primary = names[0] ?? '';
      const partner = names[1] ?? '';
      const code = computeInviteCode(entries, primary, partner, payload.code ?? existingCode, existingCode);
      const householdId = payload.householdId?.trim()
        ? payload.householdId.trim().toUpperCase()
        : current.householdId ?? computeNextHouseholdId(entries);
      const timestamp = new Date().toISOString();
      const guest = normaliseGuest({
        ...current,
        ...payload,
        code,
        guestNames: names,
        householdId,
        householdCount: Math.max(Number(payload.householdCount) || names.length, names.length),
        contact: payload.contact ?? current.contact ?? '',
        notes: payload.notes ?? current.notes ?? '',
        lastUpdated: timestamp,
      });

      updateEntries((prev) =>
        [...prev.filter((entry) => entry.code !== existingCode), guest].sort((a, b) =>
          a.primaryGuest.localeCompare(b.primaryGuest)
        )
      );

      if (remoteAddGuest) {
        remoteAddGuest(code, {
          ...guest,
          lastUpdated: timestamp,
        }).catch(() => {});
      }

      if (remoteDeleteGuest && code !== existingCode) {
        remoteDeleteGuest(existingCode).catch(() => {});
      }
    },
    [entries, remoteAddGuest, remoteDeleteGuest, updateEntries]
  );

  const handleDeleteGuest = useCallback(
    (code) => {
      updateEntries((prev) => prev.filter((guest) => guest.code !== code));
      if (remoteDeleteGuest) {
        remoteDeleteGuest(code).catch(() => {});
      }
    },
    [remoteDeleteGuest, updateEntries]
  );

  const handleExportCsv = useCallback(() => {
    if (typeof document === 'undefined') return;
    const headers = ['code', 'guestNames', 'householdId', 'householdCount', 'contact', 'status', 'notes'];
    const rows = entries.map((guest) => [
      guest.code,
      guest.guestNames.join(' & '),
      guest.householdId ?? '',
      guest.householdCount ?? '',
      guest.contact ?? '',
      guest.rsvpStatus,
      guest.notes ?? '',
    ]);
    const encode = (value) =>
      `"${String(value ?? '')
        .replace(/"/g, '""')
        .replace(/\r?\n|\r/g, ' ')}"`;
    const csv = [headers.join(','), ...rows.map((row) => row.map(encode).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `guest-list-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [entries]);

  const generateInviteCode = useCallback(
    (primary, partner, preferred, exclude) =>
      computeInviteCode(entries, primary, partner, preferred, exclude),
    [entries]
  );

  const getNextHouseholdId = useCallback(() => computeNextHouseholdId(entries), [entries]);

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
            to="/admin/guests"
            className={({ isActive }) => (isActive ? 'admin-nav__link admin-nav__link--active' : 'admin-nav__link')}
          >
            Guests
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
        <div className="admin-content__header">
          <Link to="/invite" className="admin-content__back">
            ⬅ Back to Invitation
          </Link>
        </div>
        <Routes>
          <Route
            index
            element={<DashboardOverview entries={entries} stats={stats} updateGuestStatus={updateGuestStatus} />}
          />
          <Route
            path="guests"
            element={
              <AdminGuestsPage
                entries={entries}
                onAddGuest={handleAddGuest}
                onUpdateGuest={handleUpdateGuest}
                onDeleteGuest={handleDeleteGuest}
                onStatusChange={updateGuestStatus}
                onExportCsv={handleExportCsv}
                generateInviteCode={generateInviteCode}
                getNextHouseholdId={getNextHouseholdId}
              />
            }
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
