import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button.jsx';
import Tag from '../components/common/Tag.jsx';
import QRCodeCard from '../components/QRCodeCard.jsx';
import MemoryWallPlaceholder from '../components/experience/MemoryWallPlaceholder.jsx';
import { useGuest } from '../providers/GuestProvider.jsx';
import { useFirebase } from '../providers/FirebaseProvider.jsx';
import {
  applyMetaToEntries,
  ensureCheckInsForEntries,
  formatCheckInTime,
  formatRelativeCheckInTime,
  EVENT_DAY_MODE_KEY,
  isEventDayModeEnabled,
  setEventDayModeEnabled,
  normalizeGuest,
  parseCheckInPayload,
  readStoredCheckIns,
  readStoredMeta,
  subscribeToEventState,
  applyCheckInState,
  broadcastCheckIns,
} from '../utils/guestUtils.js';
import './EventDayGuestPage.css';

const EventDayGuestPage = () => {
  const navigate = useNavigate();
  const { guest, inviteCode } = useGuest();
  const { subscribeToEventDayMode, getEventDayMode, isReady } = useFirebase();
  const [checkIns, setCheckIns] = useState(() => readStoredCheckIns());
  const [meta, setMeta] = useState(() => readStoredMeta());
  const [eventModeEnabled, setEventModeEnabled] = useState(() => isEventDayModeEnabled());

  const normalizedGuest = useMemo(() => {
    if (!guest) return null;
    return normalizeGuest({ ...guest, code: guest.code || inviteCode?.toUpperCase() });
  }, [guest, inviteCode]);

  const entry = useMemo(() => {
    if (!normalizedGuest) return null;
    return applyMetaToEntries([normalizedGuest], meta)[0];
  }, [meta, normalizedGuest]);

  useEffect(() => {
    if (!normalizedGuest) return undefined;
    setCheckIns((prev) => {
      const next = ensureCheckInsForEntries([normalizedGuest], prev);
      return next;
    });

    const cleanup = subscribeToEventState([normalizedGuest], {
      onCheckIns: setCheckIns,
      onMeta: setMeta,
    });

    return () => cleanup?.();
  }, [normalizedGuest]);

  // Load initial Event Day state from Firebase
  useEffect(() => {
    if (!isReady || !getEventDayMode) return;
    
    const loadInitialState = async () => {
      try {
        const firebaseState = await getEventDayMode();
        if (firebaseState !== null) {
          setEventDayModeEnabled(firebaseState);
          setEventModeEnabled(firebaseState);
        }
      } catch (err) {
        // Fallback to localStorage only
      }
    };

    loadInitialState();
  }, [isReady, getEventDayMode]);

  // Subscribe to Firebase changes for real-time sync
  useEffect(() => {
    if (!subscribeToEventDayMode) return undefined;

    const unsubscribe = subscribeToEventDayMode((enabled) => {
      setEventDayModeEnabled(enabled);
      setEventModeEnabled(enabled);
    });

    return () => unsubscribe?.();
  }, [subscribeToEventDayMode]);

  // Polling fallback: some mobile browsers or network conditions can delay real-time
  // updates. Poll every 7s as a safety net so Event Day toggles appear on other
  // devices even if onSnapshot isn't delivered promptly.
  useEffect(() => {
    let intervalId = null;
    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;
      if (!getEventDayMode) return;
      try {
        const firebaseState = await getEventDayMode();
        if (firebaseState !== null) {
          setEventDayModeEnabled(firebaseState);
          setEventModeEnabled(firebaseState);
        }
      } catch (err) {
        // ignore polling errors
      }
    };

    // Start immediate poll followed by interval
    poll();
    intervalId = window.setInterval(poll, 7000);

    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [getEventDayMode]);

  useEffect(() => {
    const syncEventMode = () => setEventModeEnabled(isEventDayModeEnabled());
    const storageHandler = (event) => {
      if (event.key === EVENT_DAY_MODE_KEY) {
        syncEventMode();
      }
    };

    syncEventMode();
    window.addEventListener('storage', storageHandler);
    window.addEventListener('hs:event-mode-change', syncEventMode);

    return () => {
      window.removeEventListener('storage', storageHandler);
      window.removeEventListener('hs:event-mode-change', syncEventMode);
    };
  }, []);

  useEffect(() => {
    if (!eventModeEnabled) {
      navigate('/invite', { replace: true });
    }
  }, [eventModeEnabled, navigate]);

  if (!entry) {
    return (
      <div className="event-guest-shell">
        <div className="event-guest-card">
          <p className="eyebrow">Event day</p>
          <h1>We could not load your invite</h1>
          <p className="page-subtitle">Please re-enter your invite code to continue.</p>
          <Button variant="primary" onClick={() => navigate('/')}>Return to invite entry</Button>
        </div>
      </div>
    );
  }

  const record = checkIns[entry.code?.toUpperCase()] ?? {};
  const arrived = Boolean(record.checkedIn);
  const arrivalLabel = record.checkedInAt
    ? formatRelativeCheckInTime(record.checkedInAt)
    : 'Awaiting arrival';

  return (
    <>
      <div className="event-guest-shell">
      <div className="event-guest-card">
        <header className="event-guest-header">
          <div>
            <p className="eyebrow">Event day guest view</p>
            <h1 className="page-title">Welcome, {entry.primaryGuest}</h1>
            <p className="page-subtitle">Your household details update live as the welcome team checks you in.</p>
          </div>
          <div className="event-guest-header__actions">
            <Tag tone={arrived ? 'success' : 'info'}>{arrived ? 'Arrived' : 'Awaiting check-in'}</Tag>
            <Button variant="ghost" onClick={() => navigate('/invite')}>Back to invitation</Button>
          </div>
        </header>

        <div className="event-guest-grid">
          <section className="event-guest-main">
            <div className="event-guest-status">
              <div>
                <p className="detail-label">Household</p>
                <h2 className="event-guest-name">
                  {entry.vip && <span className="vip-star">★ </span>}
                  {entry.guestNames.join(' & ')}
                </h2>
                <p className="event-guest-meta">{entry.householdId ? `${entry.householdId} · ` : ''}Invite code {entry.code}</p>
                <div className="event-guest-tags">
                  <Tag tone={entry.rsvpStatus === 'confirmed' ? 'success' : entry.rsvpStatus === 'pending' ? 'warning' : 'neutral'}>
                    {entry.rsvpStatus === 'confirmed' ? 'Confirmed' : entry.rsvpStatus === 'pending' ? 'Pending' : 'Regret'}
                  </Tag>
                  <Tag tone={arrived ? 'success' : 'info'}>{arrivalLabel}</Tag>
                </div>
                {record.checkedInAt && (
                  <p className="arrival-time" title={formatCheckInTime(record.checkedInAt)}>
                    {formatCheckInTime(record.checkedInAt)}
                  </p>
                )}
              </div>
              <div className="event-guest-qr">
                <QRCodeCard code={`CHECKIN:${parseCheckInPayload(entry.code)}`} label="Your arrival QR" />
                {eventModeEnabled && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <Button
                      variant={arrived ? 'ghost' : 'primary'}
                      onClick={() => {
                        // mark arrival locally and broadcast
                        const next = applyCheckInState(checkIns, entry.code, { checkedIn: true, checkedInAt: new Date().toISOString() });
                        setCheckIns(next);
                        try { broadcastCheckIns(next); } catch (err) { /* ignore */ }
                      }}
                      disabled={arrived}
                    >
                      {arrived ? 'Arrived' : 'Mark arrived'}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="event-guest-details">
              <div>
                <p className="detail-label">Household size</p>
                <p className="detail-value">{entry.householdCount + (entry.additionalGuests ?? 0)}</p>
              </div>
              <div>
                <p className="detail-label">Contact</p>
                <p className="detail-value">{entry.contact || 'Not provided'}</p>
              </div>
              <div>
                <p className="detail-label">Notes</p>
                <p className="detail-value">{entry.notes || 'No notes on file'}</p>
              </div>
            </div>
          </section>

          <aside className="event-guest-side">
            <div className="stat-card">
              <span className="stat-label">Arrival status</span>
              <span className="stat-value">{arrived ? 'Arrived' : 'Awaiting'}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Arrival time</span>
              <span className="stat-value">{record.checkedInAt ? formatRelativeCheckInTime(record.checkedInAt) : 'Pending'}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Guests</span>
              <span className="stat-value">{entry.guestNames.join(' • ')}</span>
            </div>
            {entry.vip && (
              <div className="stat-card stat-card--accent">
                <span className="stat-label">VIP</span>
                <span className="stat-value">Thank you for celebrating with us.</span>
              </div>
            )}
          </aside>
        </div>
      </div>
      </div>
      {eventModeEnabled && <MemoryWallPlaceholder />}
    </>
  );
};

export default EventDayGuestPage;
