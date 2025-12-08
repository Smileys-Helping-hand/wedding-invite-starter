import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import QRCodeScanner from '../components/QRCodeScanner.jsx';
import Button from '../components/common/Button.jsx';
import TextInput from '../components/common/TextInput.jsx';
import Tag from '../components/common/Tag.jsx';
import GuestModal from '../components/GuestModal.jsx';
import localGuests from '../data/local-guests.json';
import { RSVP_STATUSES, STORAGE_KEYS } from '../utils/constants.js';
import {
  applyMetaToEntries,
  broadcastCheckIns,
  broadcastMeta,
  computeArrivalStats,
  ensureCheckInsForEntries,
  formatCheckInTime,
  formatRelativeCheckInTime,
  normalizeGuest,
  parseCheckInPayload,
  readStoredCheckIns,
  readStoredMeta,
  sortEntriesForEventDay,
  subscribeToEventState,
  toggleCheckInRecord,
  updateGuestMeta,
} from '../utils/guestUtils.js';
import { getRoleByPin, getRoleLabel, getRolePins, STAFF_ROLE_STORAGE_KEY, STAFF_ROLES } from '../utils/roles.js';
import './CheckInPage.css';

const loadStoredGuests = () => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEYS.adminGuests);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : null;
  } catch (err) {
    return null;
  }
};

const buildGuestList = (payload = []) =>
  payload
    .map((guest) => normalizeGuest(guest))
    .sort((a, b) => a.primaryGuest.localeCompare(b.primaryGuest));

const CheckInPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState('');
  const [checkIns, setCheckIns] = useState({});
  const [meta, setMeta] = useState(() => readStoredMeta());
  const [search, setSearch] = useState('');
  const [justUpdated, setJustUpdated] = useState(null);
  const [scanInput, setScanInput] = useState('');
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [darkMode, setDarkMode] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [staffRole, setStaffRole] = useState(() => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(STAFF_ROLE_STORAGE_KEY);
  });
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [vipToast, setVipToast] = useState('');

  const baseEntries = useMemo(() => {
    if (Array.isArray(location.state?.entries)) {
      return buildGuestList(location.state.entries);
    }
    const stored = loadStoredGuests();
    if (stored?.length) {
      return buildGuestList(stored);
    }
    return buildGuestList(localGuests);
  }, [location.state?.entries]);

  const entries = useMemo(() => applyMetaToEntries(baseEntries, meta), [baseEntries, meta]);

  useEffect(() => {
    setCheckIns((prev) => {
      const base = Object.keys(prev).length ? prev : readStoredCheckIns();
      const next = ensureCheckInsForEntries(entries, base);
      broadcastCheckIns(next);
      return next;
    });
  }, [entries]);

  useEffect(() => {
    const cleanup = subscribeToEventState(entries, {
      onCheckIns: setCheckIns,
      onMeta: setMeta,
    });
    const onlineHandler = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', onlineHandler);
    window.addEventListener('offline', onlineHandler);
    return () => {
      cleanup?.();
      window.removeEventListener('online', onlineHandler);
      window.removeEventListener('offline', onlineHandler);
    };
  }, [entries]);

  useEffect(() => {
    if (staffRole) {
      setIsUnlocked(true);
    }
  }, [staffRole]);

  useEffect(() => {
    if (!vipToast) return undefined;
    const timer = window.setTimeout(() => setVipToast(''), 2000);
    return () => window.clearTimeout(timer);
  }, [vipToast]);

  const filteredEntries = useMemo(() => {
    const sorted = sortEntriesForEventDay(entries, checkIns);
    if (!search.trim()) return sorted;
    const term = search.trim().toLowerCase();
    return sorted.filter((guest) =>
      guest.primaryGuest.toLowerCase().includes(term)
      || guest.guestNames.some((name) => name.toLowerCase().includes(term))
      || guest.code.toLowerCase().includes(term)
      || (guest.householdId ?? '').toLowerCase().includes(term)
    );
  }, [checkIns, entries, search]);

  const stats = useMemo(() => computeArrivalStats(entries, checkIns), [checkIns, entries]);
  const rolePins = useMemo(() => getRolePins(), []);

  const toggleArrival = (code, viaScan = false) => {
    if (staffRole === STAFF_ROLES.security) return;
    const guest = entries.find((item) => item.code === code);
    setCheckIns((prev) => {
      const next = toggleCheckInRecord(prev, code);
      broadcastCheckIns(next);
      setJustUpdated(code.toUpperCase());
      window.setTimeout(() => setJustUpdated(null), 1400);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(40);
      }
      const record = next[code.toUpperCase()];
      if (guest?.vip && record?.checkedIn) {
        setVipToast(`✨ VIP Guest Arrived — ${guest.primaryGuest}`);
      }
      if (viaScan) {
        setShowScanner(false);
        setSearch(guest?.primaryGuest ?? '');
      }
      return next;
    });
  };

  const handleSubmitPin = (event) => {
    event.preventDefault();
    const role = getRoleByPin(pin.trim());
    if (role) {
      setStaffRole(role);
      setIsUnlocked(true);
      setError('');
      setPin('');
      window.localStorage.setItem(STAFF_ROLE_STORAGE_KEY, role);
    } else {
      setError('Incorrect PIN');
    }
  };

  const handleScanSubmit = (event) => {
    if (event.key !== 'Enter') return;
    const value = scanInput.trim().toUpperCase();
    if (!value) return;
    const match = entries.find((guest) => guest.code === value);
    if (match) {
      toggleArrival(match.code, true);
      setScanInput('');
    } else {
      setSearch(value);
    }
  };

  const handleScanResult = (result, error) => {
    if (result?.text) {
      const value = result.text.trim().toUpperCase();
      const match = entries.find((guest) => guest.code === value);
      if (match) {
        toggleArrival(match.code, true);
      }
    }
    if (error) {
      // ignore intermittent errors to avoid noise
    }
  };

  const roleLabel = getRoleLabel(staffRole);
  const canEditMeta = staffRole === STAFF_ROLES.manager || staffRole === STAFF_ROLES.checkIn;

  if (!isUnlocked) {
    return (
      <div className="checkin-shell">
        <div className="checkin-card" role="dialog" aria-modal="true">
          <p className="eyebrow">Staff check-in</p>
          <h1>Enter PIN to continue</h1>
          <form className="checkin-form" onSubmit={handleSubmitPin}>
            <TextInput label="Access PIN" type="password" value={pin} onChange={(event) => setPin(event.target.value)} required />
            <p className="muted">Manager: {rolePins[STAFF_ROLES.manager]} • Check-in: {rolePins[STAFF_ROLES.checkIn]} • Security: {rolePins[STAFF_ROLES.security]}</p>
            {error && <p className="form-error">{error}</p>}
            <Button type="submit" variant="primary" size="lg">
              Unlock screen
            </Button>
            <Button variant="ghost" type="button" onClick={() => navigate('/')}>Back to invite</Button>
          </form>
          <p className="checkin-hint">Offline-ready — arrivals persist locally across refresh.</p>
        </div>
      </div>
    );
  }

  const shellClass = ['checkin-shell', 'checkin-shell--unlocked', darkMode ? 'checkin-shell--dark' : null]
    .filter(Boolean)
    .join(' ');

  const activeGuest = entries.find((guest) => guest.code === selectedGuest);
  const activeRecord = activeGuest ? checkIns[activeGuest.code] : null;
  const arrivalLabel = activeRecord?.checkedInAt ? formatRelativeCheckInTime(activeRecord.checkedInAt) : 'Awaiting arrival';
  const handleSaveMeta = (payload) => {
    if (!activeGuest) return;
    setMeta((prev) => {
      const next = updateGuestMeta(prev, activeGuest.code, payload);
      broadcastMeta(next);
      return next;
    });
    setSelectedGuest(null);
  };

  return (
    <div className={shellClass}>
      <header className="checkin-header">
        <div>
          <p className="eyebrow">Event day</p>
          <h1>Guest arrival tracker</h1>
          <p className="page-subtitle">Search by name, invite code, or household ID and mark arrivals effortlessly.</p>
        </div>
        <div className="checkin-header__actions">
          <Tag tone={isOnline ? 'success' : 'neutral'}>{isOnline ? 'Offline-ready' : 'Offline'}</Tag>
          <Tag tone="info">{roleLabel}</Tag>
          <Button variant="ghost" onClick={() => setDarkMode((prev) => !prev)}>
            {darkMode ? 'Light mode' : 'Dark mode'}
          </Button>
          <Button variant="outline" onClick={() => setShowScanner((prev) => !prev)} aria-pressed={showScanner}>
            {showScanner ? 'Hide scanner' : 'QR scanner'}
          </Button>
          <Button variant="ghost" onClick={() => navigate('/admin/event-day')}>Back to admin</Button>
        </div>
      </header>

      {showScanner && (
        <div className="scanner-panel">
          <div className="scanner-panel__header">
            <p className="detail-label">Scan invite QR</p>
            <Tag tone="info">Live camera</Tag>
          </div>
          <QRCodeScanner
            onScan={(text) => {
              const value = String(text || '').trim().toUpperCase();
              if (!value) return;
              const match = entries.find((guest) => guest.code === value);
              if (match) toggleArrival(match.code, true);
            }}
            facingMode="environment"
          />
        </div>
      )}

      <div className="checkin-layout">
        <section className="checkin-main">
          <div className="checkin-toolbar">
            <TextInput
              label="Search guests"
              placeholder="Search name, invite code, or household ID"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <TextInput
              label="Scan barcode / QR"
              placeholder="Paste or scan code, press Enter"
              value={scanInput}
              onChange={(event) => setScanInput(event.target.value)}
              onKeyDown={handleScanSubmit}
            />
            <div className="checkin-toolbar__meta">
              <span className="pill">{stats.checkedIn} checked in</span>
              <span className="pill pill--muted">{stats.stillExpected} still expected</span>
            </div>
          </div>

          <div className="checkin-list" role="list">
            {filteredEntries.map((guest) => {
              const record = checkIns[guest.code?.toUpperCase()] ?? {};
              const isChecked = Boolean(record.checkedIn);
              const highlight = justUpdated === guest.code?.toUpperCase();

              return (
                <article
                  key={guest.code}
                  className={highlight ? 'checkin-card checkin-card--highlight' : 'checkin-card'}
                  role="listitem"
                  onClick={() => setSelectedGuest(guest.code)}
                >
                  <div className="checkin-card__row">
                    <div>
                      <p className="checkin-title">
                        {guest.vip && <span className="vip-star">★ </span>}
                        {guest.guestNames.join(' & ')}
                      </p>
                      <p className="checkin-subtitle">
                        {guest.householdId ? `${guest.householdId} · ` : ''}Code {guest.code}
                      </p>
                    </div>
                    <div className="checkin-tags">
                      <Tag tone={guest.rsvpStatus === RSVP_STATUSES.confirmed ? 'success' : guest.rsvpStatus === RSVP_STATUSES.pending ? 'warning' : 'neutral'}>
                        {guest.rsvpStatus === RSVP_STATUSES.confirmed
                          ? 'Confirmed'
                          : guest.rsvpStatus === RSVP_STATUSES.pending
                            ? 'Pending'
                            : 'Regret'}
                      </Tag>
                      <Tag tone={isChecked ? 'success' : 'info'}>{isChecked ? 'Arrived' : 'Awaiting'}</Tag>
                    </div>
                  </div>
                  <div className="checkin-card__row checkin-card__row--details">
                    <div>
                      <p className="detail-label">Household size</p>
                      <p className="detail-value">{guest.householdCount + (guest.additionalGuests ?? 0)}</p>
                    </div>
                    <div>
                      <p className="detail-label">Contact</p>
                      <p className="detail-value">{guest.contact || 'Not provided'}</p>
                    </div>
                    <div className="checkin-actions">
                      <div className="arrival-meta">
                        {record.checkedInAt
                          ? formatRelativeCheckInTime(record.checkedInAt)
                          : 'Awaiting arrival'}
                        {record.checkedInAt && (
                          <span className="arrival-meta__time" title={formatCheckInTime(record.checkedInAt)}>
                            • {formatCheckInTime(record.checkedInAt)}
                          </span>
                        )}
                      </div>
                      <Button
                        variant={isChecked ? 'ghost' : 'primary'}
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleArrival(guest.code);
                        }}
                        disabled={staffRole === STAFF_ROLES.security}
                      >
                        {isChecked ? 'Undo' : 'Mark Arrived'}
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
            {filteredEntries.length === 0 && <div className="event-empty">No guests match your search.</div>}
          </div>
        </section>

        <aside className="checkin-side" aria-label="Arrival stats">
          <div className="stat-card">
            <span className="stat-label">Total households</span>
            <span className="stat-value">{stats.total}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Confirmed households</span>
            <span className="stat-value">{stats.confirmed}</span>
          </div>
          <div className="stat-card stat-card--accent">
            <span className="stat-label">Checked-in</span>
            <span className="stat-value">{stats.checkedIn}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Awaiting</span>
            <span className="stat-value">{stats.stillExpected}</span>
          </div>
        </aside>
      </div>

      {activeGuest && (
        <GuestModal
          guest={{ ...activeGuest, arrivalLabel }}
          record={activeRecord}
          canEdit={canEditMeta}
          onSave={handleSaveMeta}
          onClose={() => setSelectedGuest(null)}
        />
      )}

      {vipToast && <div className="vip-toast" role="status">{vipToast}</div>}
    </div>
  );
};

export default CheckInPage;
