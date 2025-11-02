import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../../components/common/Button.jsx';
import TextInput from '../../components/common/TextInput.jsx';
import localGuests from '../../data/local-guests.json';
import { RSVP_STATUSES, STORAGE_KEYS } from '../../utils/constants.js';
import GuestSpreadsheetImporter from '../../tools/GuestSpreadsheetImporter.jsx';
import ThemeStudioPage from './ThemeStudioPage.jsx';
import AdminGuestsPage from './AdminGuestsPage.jsx';
import ExportInviteCard from './ExportInviteCard.jsx';
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
    code: guest.code?.toUpperCase(),
    guestNames,
    primaryGuest,
    partnerName,
    householdCount,
    householdId: guest.householdId ?? null,
    contact: guest.contact ?? '',
    rsvpStatus: guest.rsvpStatus ?? RSVP_STATUSES.pending,
    notes: guest.notes ?? '',
    additionalGuests: guest.additionalGuests ?? 0,
    lastUpdated: guest.lastUpdated ?? null,
    role: guest.role ?? 'guest',
  };
};

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

const computeInviteCode = (entries = [], primaryName = '', partnerName = '', preferredCode, excludeCode) => {
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

const buildGuestPayload = (payload, options) => {
  const names = payload.guestNames?.length ? payload.guestNames : [payload.guestName, payload.partnerName];
  const guestNames = names.filter(Boolean).map((value) => value.trim());
  const primary = guestNames[0] ?? '';
  const partner = guestNames[1] ?? '';
  const code = computeInviteCode(options.entries, primary, partner, payload.code, options.excludeCode);
  const householdId = payload.householdId?.trim()
    ? payload.householdId.trim().toUpperCase()
    : options.currentHouseholdId ?? computeNextHouseholdId(options.entries);
  const timestamp = new Date().toISOString();

  return normaliseGuest({
    ...payload,
    code,
    guestNames,
    householdId,
    householdCount: Math.max(Number(payload.householdCount) || guestNames.length || 1, guestNames.length || 1),
    contact: payload.contact ?? '',
    notes: payload.notes ?? '',
    lastUpdated: timestamp,
    role: payload.role ?? 'guest',
  });
};

const tabs = [
  { to: '', label: 'Overview' },
  { to: 'guests', label: 'Guests' },
  { to: 'studio', label: 'Theme Studio' },
  { to: 'import', label: 'Import CSV' },
  { to: 'export', label: 'Export Cards' },
];

const AdminPage = () => {
  const navigate = useNavigate();
  const firebase = useFirebase();
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [undoStack, setUndoStack] = useState([]);
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
      return storedAdmin.map((guest) => normaliseGuest(guest)).sort((a, b) => a.primaryGuest.localeCompare(b.primaryGuest));
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

  useEffect(() => {
    if (!firebase?.subscribeToGuests) return undefined;
    const unsubscribe = firebase.subscribeToGuests((data) => {
      if (!data) return;
      setEntries((prev) => {
        const normalised = data.map((guest) => normaliseGuest(guest));
        try {
          localStorage.setItem(STORAGE_KEYS.adminGuests, JSON.stringify(normalised));
        } catch (err) {
          /* ignore */
        }
        return normalised.sort((a, b) => a.primaryGuest.localeCompare(b.primaryGuest));
      });
    });
    return unsubscribe;
  }, [firebase?.subscribeToGuests]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

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

  const persistEntries = useCallback((next) => {
    try {
      localStorage.setItem(STORAGE_KEYS.adminGuests, JSON.stringify(next));
    } catch (err) {
      /* storage unavailable */
    }
  }, []);

  const pushUndo = useCallback((payload) => {
    setUndoStack((prev) => [payload, ...prev].slice(0, 10));
  }, []);

  const logAction = useCallback(
    (action, meta = {}) => {
      if (!firebase?.appendAdminLog) return;
      firebase.appendAdminLog({ action, meta }).catch(() => {});
    },
    [firebase]
  );

  const authenticate = (event) => {
    event.preventDefault();
    const expected = (import.meta.env.VITE_ADMIN_CODE || import.meta.env.VITE_ADMIN_PASSCODE || 'emerald-veil').toString();
    if (passcode.trim() === expected) {
      setIsAuthenticated(true);
      setError('');
      try {
        localStorage.setItem(STORAGE_KEYS.adminSession, 'true');
      } catch (err) {
        /* ignore */
      }
      navigate('/admin/guests', { replace: true });
    } else {
      setError('Incorrect passcode');
    }
  };

  const updateEntries = useCallback(
    (mutator, undoDescription) => {
      setEntries((prev) => {
        const next = mutator(prev).sort((a, b) => a.primaryGuest.localeCompare(b.primaryGuest));
        persistEntries(next);
        if (undoDescription) {
          const snapshot = prev.map((guest) => ({ ...guest, guestNames: [...(guest.guestNames ?? [])] }));
          pushUndo({ label: undoDescription, snapshot });
        }
        return next;
      });
    },
    [persistEntries, pushUndo]
  );

  const handleUndo = useCallback(() => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const [latest, ...rest] = prev;
      if (latest?.snapshot) {
        persistEntries(latest.snapshot);
        setEntries(latest.snapshot);
      }
      return rest;
    });
  }, [persistEntries]);

  const handleAddGuest = useCallback(
    (payload) => {
      const guest = buildGuestPayload(payload, { entries });
      updateEntries((prev) => [...prev, guest], `Added ${guest.primaryGuest}`);
      setToast('Guest added ✅');
      logAction('guest:add', { code: guest.code, name: guest.primaryGuest });
      firebase?.addGuest?.(guest.code, guest).catch(() => {});
    },
    [entries, firebase, logAction, updateEntries]
  );

  const handleUpdateGuest = useCallback(
    (existingCode, payload) => {
      const current = entries.find((entry) => entry.code === existingCode);
      if (!current) return;
      const guest = buildGuestPayload(payload, {
        entries,
        excludeCode: existingCode,
        currentHouseholdId: current.householdId,
      });
      updateEntries(
        (prev) => [...prev.filter((entry) => entry.code !== existingCode), guest],
        `Updated ${guest.primaryGuest}`
      );
      setToast('Guest updated ✅');
      logAction('guest:update', { from: existingCode, to: guest.code, name: guest.primaryGuest });
      firebase?.addGuest?.(guest.code, guest).catch(() => {});
      if (guest.code !== existingCode) {
        firebase?.deleteGuest?.(existingCode).catch(() => {});
      }
    },
    [entries, firebase, logAction, updateEntries]
  );

  const handleDeleteGuest = useCallback(
    (code) => {
      const current = entries.find((entry) => entry.code === code);
      if (!current) return;
      updateEntries((prev) => prev.filter((guest) => guest.code !== code), `Removed ${current.primaryGuest}`);
      setToast('Guest removed ✅');
      logAction('guest:delete', { code, name: current.primaryGuest });
      firebase?.deleteGuest?.(code).catch(() => {});
    },
    [entries, firebase, logAction, updateEntries]
  );

  const handleStatusChange = useCallback(
    (code, status) => {
      updateEntries(
        (prev) =>
          prev.map((guest) => (guest.code === code ? { ...guest, rsvpStatus: status, lastUpdated: new Date().toISOString() } : guest)),
        `Updated RSVP for ${code}`
      );
      logAction('guest:rsvp', { code, status });
      firebase?.saveRSVP?.(code, { rsvpStatus: status, lastUpdated: new Date().toISOString() }).catch(() => {});
      setToast('RSVP updated');
    },
    [firebase, logAction, updateEntries]
  );

  const handleExportCsv = useCallback((list) => {
    if (typeof document === 'undefined') return;
    const dataset = Array.isArray(list) && list.length > 0 ? list : entries;
    const headers = ['code', 'guestNames', 'householdId', 'householdCount', 'contact', 'status', 'notes'];
    const rows = dataset.map((guest) => [
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
    (primary, partner, preferred, exclude) => computeInviteCode(entries, primary, partner, preferred, exclude),
    [entries]
  );

  const getNextHouseholdId = useCallback(() => computeNextHouseholdId(entries), [entries]);

  const copyShareMessage = useCallback(async (guest) => {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const inviteUrl = `${origin}/?code=${encodeURIComponent(guest.code)}`;
      const message = `Assalamu Alaikum ${guest.primaryGuest},\nYou are warmly invited to the engagement soirée of Razia & Abduraziq. Use your invite code ${guest.code} to unlock the experience: ${inviteUrl}`;
      await navigator.clipboard?.writeText(message);
      setToast('WhatsApp text copied');
    } catch (err) {
      setToast('Unable to copy link');
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="page-panel admin-login">
        <motion.form className="admin-login__form" onSubmit={authenticate} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}>
          <h1>Secure Admin Entrance</h1>
          <p>Enter the passcode to view RSVP insights, manage guests, and curate the theme studio.</p>
          <TextInput label="Admin passcode" type="password" value={passcode} onChange={(event) => setPasscode(event.target.value)} required />
          {error && <p className="form-error">{error}</p>}
          <Button type="submit" variant="primary" size="lg">
            Unlock Dashboard
          </Button>
        </motion.form>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      {toast && (
        <div className="admin-toast" role="status">
          {toast}
        </div>
      )}
      <aside className="admin-sidebar">
        <div className="admin-sidebar__label">Admin Suite</div>
        <Link to="/invite" className="admin-sidebar__logo" aria-label="Back to invitation">
          Razia &amp; Abduraziq
        </Link>
        <nav className="admin-nav" aria-label="Admin navigation">
          {tabs.map((tab) => (
            <NavLink key={tab.to} end={tab.to === ''} to={tab.to} className={({ isActive }) => (isActive ? 'admin-nav__link admin-nav__link--active' : 'admin-nav__link')}>
              {tab.label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar__footer">
          <Button variant="ghost" size="sm" onClick={handleUndo} disabled={undoStack.length === 0}>
            Undo last change
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/invite')}>
            Back to invitation
          </Button>
        </div>
      </aside>
      <div className="admin-content">
        <Routes>
          <Route
            index
            element={
              <div className="admin-dashboard">
                <header className="admin-dashboard__header">
                  <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">Live RSVP status with quick insight into your honoured guests.</p>
                  </div>
                  <Button variant="ghost" size="md" onClick={() => navigate('guests')}>
                    Manage guests
                  </Button>
                </header>
                <div className="admin-dashboard__stats">
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
                    <span className="stat-label">Regret</span>
                    <span className="stat-value">{stats.declined}</span>
                  </div>
                  <div className="stat-card stat-card--accent">
                    <span className="stat-label">Expected attendees</span>
                    <span className="stat-value">{stats.guestsAttending}</span>
                  </div>
                </div>
              </div>
            }
          />
          <Route
            path="guests"
            element={
              <AdminGuestsPage
                entries={entries}
                onAddGuest={handleAddGuest}
                onUpdateGuest={handleUpdateGuest}
                onDeleteGuest={handleDeleteGuest}
                onStatusChange={handleStatusChange}
                onExportCsv={handleExportCsv}
                generateInviteCode={generateInviteCode}
                getNextHouseholdId={getNextHouseholdId}
                onCopyShare={copyShareMessage}
              />
            }
          />
          <Route path="studio" element={<ThemeStudioPage entries={entries} />} />
          <Route path="import" element={<GuestSpreadsheetImporter existingGuests={entries} />} />
          <Route path="export" element={<ExportInviteCard guests={entries} />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminPage;
