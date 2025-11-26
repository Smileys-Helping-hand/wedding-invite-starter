import { useEffect, useMemo, useState } from 'react';
import Button from '../../components/common/Button.jsx';
import Tag from '../../components/common/Tag.jsx';
import GuestModal from '../../components/GuestModal.jsx';
import { RSVP_STATUSES } from '../../utils/constants.js';
import {
  applyMetaToEntries,
  broadcastCheckIns,
  broadcastMeta,
  broadcastReset,
  clearCheckInStorage,
  computeArrivalStats,
  ensureCheckInsForEntries,
  formatCheckInTime,
  formatRelativeCheckInTime,
  EVENT_DAY_MODE_KEY,
  isEventDayModeEnabled,
  setEventDayModeEnabled,
  readStoredCheckIns,
  readStoredMeta,
  sortEntriesForEventDay,
  subscribeToEventState,
  toggleCheckInRecord,
  updateGuestMeta,
} from '../../utils/guestUtils.js';
import { getRoleLabel, STAFF_ROLE_STORAGE_KEY, STAFF_ROLES } from '../../utils/roles.js';
import { exportArrivalsCsv, openArrivalsPrintView } from '../../utils/csvExports.js';
import './EventDayPage.css';

const FILTERS = [
  { key: 'all', label: 'All households' },
  { key: 'checked-in', label: 'Arrived' },
  { key: 'pending', label: 'Pending arrival' },
  { key: 'regret', label: 'Regret' },
];

const EventDayPage = ({ entries = [] }) => {
  const [filter, setFilter] = useState('all');
  const [checkIns, setCheckIns] = useState({});
  const [meta, setMeta] = useState(() => readStoredMeta());
  const [justUpdated, setJustUpdated] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [vipToast, setVipToast] = useState('');
  const [eventDayEnabled, setEventDayEnabled] = useState(() => isEventDayModeEnabled());
  const [staffRole] = useState(() => {
    if (typeof window === 'undefined') return STAFF_ROLES.manager;
    return window.localStorage.getItem(STAFF_ROLE_STORAGE_KEY) || STAFF_ROLES.manager;
  });

  const entriesWithMeta = useMemo(() => applyMetaToEntries(entries, meta), [entries, meta]);

  useEffect(() => {
    setCheckIns((prev) => {
      const base = Object.keys(prev).length ? prev : readStoredCheckIns();
      const next = ensureCheckInsForEntries(entriesWithMeta, base);
      broadcastCheckIns(next);
      return next;
    });
  }, [entriesWithMeta]);

  useEffect(() => {
    const cleanup = subscribeToEventState(entriesWithMeta, {
      onCheckIns: setCheckIns,
      onMeta: setMeta,
    });
    return () => cleanup?.();
  }, [entriesWithMeta]);

  useEffect(() => {
    if (!vipToast) return undefined;
    const timer = window.setTimeout(() => setVipToast(''), 2000);
    return () => window.clearTimeout(timer);
  }, [vipToast]);

  useEffect(() => {
    const syncToggle = () => setEventDayEnabled(isEventDayModeEnabled());
    const storageHandler = (event) => {
      if (event.key === EVENT_DAY_MODE_KEY) {
        syncToggle();
      }
    };

    window.addEventListener('storage', storageHandler);
    window.addEventListener('hs:event-mode-change', syncToggle);

    return () => {
      window.removeEventListener('storage', storageHandler);
      window.removeEventListener('hs:event-mode-change', syncToggle);
    };
  }, []);

  const stats = useMemo(() => computeArrivalStats(entriesWithMeta, checkIns), [checkIns, entriesWithMeta]);

  const recentArrivals = useMemo(
    () =>
      sortEntriesForEventDay(entriesWithMeta, checkIns)
        .filter((guest) => checkIns[guest.code?.toUpperCase()]?.checkedInAt)
        .slice(0, 5),
    [checkIns, entriesWithMeta]
  );

  const filteredEntries = useMemo(() => {
    const sorted = sortEntriesForEventDay(entriesWithMeta, checkIns);
    return sorted.filter((guest) => {
      const record = checkIns[guest.code?.toUpperCase()] ?? {};
      if (filter === 'checked-in') return record.checkedIn;
      if (filter === 'pending') return !record.checkedIn && guest.rsvpStatus !== RSVP_STATUSES.declined;
      if (filter === 'regret') return guest.rsvpStatus === RSVP_STATUSES.declined;
      return true;
    });
  }, [checkIns, entriesWithMeta, filter]);

  const toggleCheckIn = (code) => {
    const guest = entriesWithMeta.find((item) => item.code === code);
    setCheckIns((prev) => {
      const next = toggleCheckInRecord(prev, code);
      broadcastCheckIns(next);
      setJustUpdated(code.toUpperCase());
      window.setTimeout(() => setJustUpdated(null), 1400);
      const record = next[code.toUpperCase()];
      if (guest?.vip && record?.checkedIn) {
        setVipToast(`✨ VIP Guest Arrived — ${guest.primaryGuest}`);
      }
      return next;
    });
  };

  const handleExport = () => exportArrivalsCsv(entriesWithMeta, checkIns);
  const handlePrint = () => openArrivalsPrintView(entriesWithMeta, checkIns);

  const handleReset = () => setShowResetConfirm(true);

  const handleToggleEventDay = () => {
    const next = !eventDayEnabled;
    setEventDayModeEnabled(next);
    setEventDayEnabled(next);
  };

  const confirmReset = () => {
    broadcastReset();
    clearCheckInStorage();
    const reset = ensureCheckInsForEntries(entriesWithMeta, {});
    setCheckIns(reset);
    setMeta({});
    setShowResetConfirm(false);
  };

  const statusLabel = (guest) => {
    if (guest.rsvpStatus === RSVP_STATUSES.confirmed) return 'Confirmed';
    if (guest.rsvpStatus === RSVP_STATUSES.pending) return 'Pending response';
    return 'Regretfully declined';
  };

  const activeGuest = entriesWithMeta.find((guest) => guest.code === selectedGuest);
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

  const roleLabel = getRoleLabel(staffRole);
  const canEditMeta = staffRole === STAFF_ROLES.manager;

  if (staffRole !== STAFF_ROLES.manager) {
    return (
      <div className="event-day-page">
        <div className="event-day-page__header">
          <div>
            <p className="eyebrow">Event day</p>
            <h1 className="page-title">Manager access required</h1>
            <p className="page-subtitle">Switch to manager PIN in staff check-in to unlock the dashboard.</p>
          </div>
        </div>
        <div className="event-empty">Only managers can open the Event Day dashboard.</div>
      </div>
    );
  }

  return (
    <div className="event-day-page">
      <header className="event-day-page__header">
        <div>
          <p className="eyebrow">Event day mode</p>
          <h1 className="page-title">Arrival Coordination</h1>
          <p className="page-subtitle">Monitor households, expected attendees, and simulate check-ins for rehearsal.</p>
        </div>
        <div className="event-day-page__actions">
          <div className="event-day-page__role">{roleLabel}</div>
          <div className="event-day-toggle">
            <label className="event-day-toggle__label" htmlFor="eventday-toggle">Enable Event Day Mode for Guests</label>
            <button
              id="eventday-toggle"
              type="button"
              className={eventDayEnabled ? 'toggle toggle--on' : 'toggle'}
              onClick={handleToggleEventDay}
              aria-pressed={eventDayEnabled}
            >
              <span className="toggle__knob" />
            </button>
          </div>
          <Button variant="ghost" onClick={handlePrint}>
            Print arrivals list
          </Button>
          <Button variant="outline" onClick={handleExport}>
            Export Arrivals CSV
          </Button>
          <Button variant="ghost" onClick={handleReset}>
            Reset Event Check-Ins
          </Button>
          <div className="event-day-page__meta">Local simulation only — no live writes yet.</div>
        </div>
      </header>

      <div className="event-day-grid">
        <div className="event-day-grid__main">
          <div className="event-day-toolbar">
            <div className="event-day-toolbar__filters" role="tablist" aria-label="Event day filters">
              {FILTERS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={filter === item.key ? 'toolbar-chip toolbar-chip--active' : 'toolbar-chip'}
                  onClick={() => setFilter(item.key)}
                  role="tab"
                  aria-selected={filter === item.key}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="event-day-toolbar__status">
              <span className="pill">{stats.checkedIn} checked in</span>
              <span className="pill pill--muted">{stats.guestsArrived} guests arrived</span>
              <span className="pill pill--muted">{stats.stillExpected} still expected</span>
            </div>
          </div>

          <div className="event-day-list" role="list">
            {filteredEntries.map((guest) => {
              const record = checkIns[guest.code?.toUpperCase()] ?? {};
              const isChecked = Boolean(record.checkedIn);
              const highlight = justUpdated === guest.code?.toUpperCase();
              const arrivalText = record.checkedInAt ? formatRelativeCheckInTime(record.checkedInAt) : '';

              return (
                <article
                  key={guest.code}
                  className={highlight ? 'event-card event-card--highlight' : 'event-card'}
                  role="listitem"
                  onClick={() => setSelectedGuest(guest.code)}
                >
                  <div className="event-card__heading">
                    <div>
                      <p className="event-card__title">
                        {guest.vip && <span className="vip-star">★ </span>}
                        {guest.guestNames.join(' & ')}
                      </p>
                      <p className="event-card__subtitle">
                        {guest.householdId ? `${guest.householdId} · ` : ''}Code {guest.code}
                      </p>
                    </div>
                    <div className="event-card__tags">
                      <Tag tone={guest.rsvpStatus === RSVP_STATUSES.confirmed ? 'success' : guest.rsvpStatus === RSVP_STATUSES.pending ? 'warning' : 'neutral'}>
                        {statusLabel(guest)}
                      </Tag>
                      <Tag tone={isChecked ? 'success' : 'info'}>{isChecked ? 'Arrived' : 'Awaiting'}</Tag>
                    </div>
                  </div>
                  <div className="event-card__details">
                    <div>
                      <p className="detail-label">Household size</p>
                      <p className="detail-value">{guest.householdCount + (guest.additionalGuests ?? 0)}</p>
                    </div>
                    <div>
                      <p className="detail-label">Contact</p>
                      <p className="detail-value">{guest.contact || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="detail-label">Notes</p>
                      <p className="detail-value">{guest.notes || 'No notes yet'}</p>
                    </div>
                    <div className="event-card__actions">
                      <div className="event-card__timestamp">
                        {record.checkedInAt && (
                          <span title={formatCheckInTime(record.checkedInAt)}>
                            {arrivalText}
                          </span>
                        )}
                      </div>
                      <Button
                        variant={isChecked ? 'ghost' : 'primary'}
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleCheckIn(guest.code);
                        }}
                      >
                        {isChecked ? 'Undo check-in' : 'Mark arrived'}
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
            {filteredEntries.length === 0 && (
              <div className="event-empty">No households match this filter.</div>
            )}
          </div>
        </div>

        <aside className="event-day-grid__side" aria-label="Event day stats">
          <div className="stat-card">
            <span className="stat-label">Total households</span>
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
            <span className="stat-label">Regrets</span>
            <span className="stat-value">{stats.declined}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Pending households</span>
            <span className="stat-value">{stats.pendingArrival}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Expected attendees</span>
            <span className="stat-value">{stats.guestsAttending}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Arrived households</span>
            <span className="stat-value">{stats.checkedIn}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Guests arrived</span>
            <span className="stat-value">{stats.guestsArrived}</span>
          </div>
          <div className="stat-card stat-card--accent">
            <span className="stat-label">Still expected</span>
            <span className="stat-value">{stats.stillExpected}</span>
          </div>

          <div className="recent-card" aria-label="Recent arrivals">
            <div className="recent-card__heading">
              <span className="stat-label">Recent arrivals</span>
              <span className="recent-card__count">{recentArrivals.length}</span>
            </div>
            <div className="recent-card__list">
              {recentArrivals.length === 0 && <p className="recent-card__empty">No arrivals yet.</p>}
              {recentArrivals.map((guest) => {
                const record = checkIns[guest.code?.toUpperCase()] ?? {};
                return (
                  <div key={guest.code} className="recent-card__item">
                    <div>
                      <p className="recent-card__name">{guest.primaryGuest}</p>
                      <p className="recent-card__meta">{guest.code}</p>
                    </div>
                    <div className="recent-card__time" title={formatCheckInTime(record.checkedInAt)}>
                      {formatRelativeCheckInTime(record.checkedInAt)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      {showResetConfirm && (
        <div className="reset-modal" role="dialog" aria-modal="true">
          <div className="reset-modal__card">
            <p className="eyebrow">Reset arrivals</p>
            <h2>Reset all arrivals?</h2>
            <p className="page-subtitle">This clears local check-ins for today. This cannot be undone.</p>
            <div className="reset-modal__actions">
              <Button variant="ghost" onClick={() => setShowResetConfirm(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={confirmReset}>
                Confirm reset
              </Button>
            </div>
          </div>
        </div>
      )}

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

export default EventDayPage;
