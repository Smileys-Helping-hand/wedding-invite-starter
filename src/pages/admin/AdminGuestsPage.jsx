import { useEffect, useMemo, useState } from 'react';
import Button from '../../components/common/Button.jsx';
import TextInput from '../../components/common/TextInput.jsx';
import { RSVP_STATUSES } from '../../utils/constants.js';
import './AdminGuestsPage.css';

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: RSVP_STATUSES.confirmed, label: 'Confirmed' },
  { id: RSVP_STATUSES.pending, label: 'Pending' },
  { id: RSVP_STATUSES.declined, label: 'Regret' },
];

const STATUS_LABELS = {
  [RSVP_STATUSES.confirmed]: 'Confirmed',
  [RSVP_STATUSES.pending]: 'Pending',
  [RSVP_STATUSES.declined]: 'Regret',
};

const emptyFormState = {
  code: '',
  primaryGuest: '',
  plusOneName: '',
  contact: '',
  householdCount: 1,
  notes: '',
  rsvpStatus: RSVP_STATUSES.pending,
  householdId: '',
};

const toastCopy = {
  added: 'Guest added ✅',
  updated: 'Guest updated ✅',
  removed: 'Guest removed ✅',
  copied: 'Invite link copied',
  status: 'RSVP updated',
};

const AdminGuestsPage = ({
  entries = [],
  onAddGuest,
  onUpdateGuest,
  onDeleteGuest,
  onStatusChange,
  onExportCsv,
  generateInviteCode,
  getNextHouseholdId,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(emptyFormState);
  const [editingCode, setEditingCode] = useState(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase();
    const status = statusFilter;

    return entries
      .filter((guest) => {
        const matchesStatus = status === 'all' || guest.rsvpStatus === status;
        if (!matchesStatus) return false;

        if (!query) return true;
        const haystack = [
          guest.primaryGuest,
          guest.partnerName,
          guest.code,
          guest.contact,
          guest.notes,
          ...(guest.guestNames ?? []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(query);
      })
      .sort((a, b) => a.primaryGuest.localeCompare(b.primaryGuest));
  }, [entries, search, statusFilter]);

  const openAddModal = () => {
    setEditingCode(null);
    setForm({
      ...emptyFormState,
      householdId: getNextHouseholdId ? getNextHouseholdId() : '',
    });
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (guest) => {
    setEditingCode(guest.code);
    setForm({
      code: guest.code,
      primaryGuest: guest.primaryGuest ?? '',
      plusOneName: guest.partnerName ?? guest.guestNames?.[1] ?? '',
      contact: guest.contact ?? '',
      householdCount: guest.householdCount ?? guest.guestNames?.length ?? 1,
      notes: guest.notes ?? '',
      rsvpStatus: guest.rsvpStatus ?? RSVP_STATUSES.pending,
      householdId: guest.householdId ?? '',
    });
    setError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError('');
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerateCode = () => {
    if (!generateInviteCode) return;
    const code = generateInviteCode(
      form.primaryGuest,
      form.plusOneName,
      form.code,
      editingCode ?? undefined
    );
    if (code) {
      setForm((prev) => ({ ...prev, code }));
    }
  };

  const handleAssignHousehold = () => {
    if (!getNextHouseholdId) return;
    const next = getNextHouseholdId();
    if (next) {
      setForm((prev) => ({ ...prev, householdId: next }));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const names = [form.primaryGuest, form.plusOneName]
      .map((value) => value?.trim())
      .filter(Boolean);

    if (names.length === 0) {
      setError('Please provide at least one guest name.');
      return;
    }

    const desiredCode = form.code?.trim();
    const code = generateInviteCode
      ? generateInviteCode(names[0], names[1] ?? '', desiredCode, editingCode ?? undefined)
      : desiredCode || `${names[0].slice(0, 4).toUpperCase()}${String(Date.now()).slice(-4)}`;

    const payload = {
      code,
      guestNames: names,
      householdId: form.householdId?.trim() || (getNextHouseholdId ? getNextHouseholdId() : ''),
      contact: form.contact.trim(),
      householdCount: Math.max(Number(form.householdCount) || names.length || 1, names.length || 1),
      notes: form.notes.trim(),
      rsvpStatus: form.rsvpStatus,
    };

    if (editingCode) {
      onUpdateGuest?.(editingCode, payload);
      setToast(toastCopy.updated);
    } else {
      onAddGuest?.(payload);
      setToast(toastCopy.added);
    }

    setIsModalOpen(false);
    setForm(emptyFormState);
    setEditingCode(null);
  };

  const handleDelete = (guest) => {
    if (window.confirm(`Remove household ${guest.primaryGuest}?`)) {
      onDeleteGuest?.(guest.code);
      setToast(toastCopy.removed);
    }
  };

  const handleCopyLink = async (guest) => {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const link = `${origin}/?code=${encodeURIComponent(guest.code)}`;
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      }
      setToast(toastCopy.copied);
    } catch (err) {
      setToast('Unable to copy link');
    }
  };

  const handleStatusUpdate = (guest, status) => {
    if (guest.rsvpStatus === status) return;
    onStatusChange?.(guest.code, status);
    setToast(toastCopy.status);
  };

  return (
    <div className="admin-guests">
      {toast && (
        <div className="admin-guests__toast" role="status">
          {toast}
        </div>
      )}
      <header className="admin-guests__header">
        <div>
          <h1 className="page-title">Guests</h1>
          <p className="page-subtitle">Gracefully manage each household, update RSVPs, and share invite links in moments.</p>
        </div>
        <div className="admin-guests__header-actions">
          <Button variant="ghost" size="md" onClick={onExportCsv}>
            Export CSV
          </Button>
          <Button variant="primary" size="md" onClick={openAddModal}>
            + Add Guest
          </Button>
        </div>
      </header>

      <div className="admin-guests__toolbar">
        <TextInput
          label="Search guests"
          placeholder="Search by name, code, or notes"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="admin-guests__filters" role="tablist" aria-label="RSVP status filter">
          {STATUS_FILTERS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={option.id === statusFilter ? 'status-chip status-chip--active' : 'status-chip'}
              onClick={() => setStatusFilter(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-guests__table" role="table">
        <div className="admin-guests__row admin-guests__row--head" role="row">
          <span role="columnheader">Guest household</span>
          <span role="columnheader">Status</span>
          <span role="columnheader">Invite code</span>
          <span role="columnheader">Edit</span>
          <span role="columnheader">Delete</span>
        </div>
        {filteredEntries.map((guest) => (
          <div key={guest.code} className="admin-guests__row" role="row">
            <span role="cell">
              <strong>{guest.primaryGuest || '—'}</strong>
              {guest.partnerName && <small>{guest.partnerName}</small>}
              {guest.additionalGuests > 0 && (
                <small className="muted">+{guest.additionalGuests} guest{guest.additionalGuests > 1 ? 's' : ''}</small>
              )}
              {guest.notes && <small className="muted note">{guest.notes}</small>}
              <small className="muted">Household {guest.householdId ?? '—'} • {guest.householdCount ?? 1} invited</small>
            </span>
            <span role="cell">
              <span className={`status-pill status-pill--${guest.rsvpStatus}`}>{STATUS_LABELS[guest.rsvpStatus]}</span>
              <div className="status-actions">
                <button type="button" onClick={() => handleStatusUpdate(guest, RSVP_STATUSES.confirmed)}>
                  Confirm
                </button>
                <button type="button" onClick={() => handleStatusUpdate(guest, RSVP_STATUSES.pending)}>
                  Pending
                </button>
                <button type="button" onClick={() => handleStatusUpdate(guest, RSVP_STATUSES.declined)}>
                  Regret
                </button>
              </div>
            </span>
            <span role="cell" className="code-cell">
              <code>{guest.code}</code>
              <button type="button" onClick={() => handleCopyLink(guest)} className="link-button">
                Send Invite Link
              </button>
            </span>
            <span role="cell" className="admin-guests__actions">
              <Button variant="ghost" size="sm" onClick={() => openEditModal(guest)}>
                Edit
              </Button>
            </span>
            <span role="cell" className="admin-guests__actions">
              <Button variant="ghost" size="sm" onClick={() => handleDelete(guest)}>
                Delete
              </Button>
            </span>
          </div>
        ))}

        {filteredEntries.length === 0 && (
          <div className="admin-guests__empty" role="row">
            No guests match your search yet.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="admin-guests__modal" role="dialog" aria-modal="true">
          <div className="admin-guests__modal-panel">
            <header className="admin-guests__modal-header">
              <h2>{editingCode ? 'Edit household' : 'Add household'}</h2>
              <button type="button" className="link-button" onClick={closeModal}>
                Close
              </button>
            </header>
            <form className="admin-guests__form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <TextInput
                  label="Primary guest name"
                  value={form.primaryGuest}
                  onChange={(event) => handleChange('primaryGuest', event.target.value)}
                  required
                />
                <TextInput
                  label="Partner name (optional)"
                  value={form.plusOneName}
                  onChange={(event) => handleChange('plusOneName', event.target.value)}
                  hint="Leave blank for single guest"
                />
                <TextInput
                  label="Invite code"
                  value={form.code}
                  onChange={(event) => handleChange('code', event.target.value.toUpperCase())}
                  hint="Auto-generate if left blank"
                />
                <div className="inline-actions">
                  <Button type="button" variant="ghost" size="sm" onClick={handleGenerateCode}>
                    Auto-generate code
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={handleAssignHousehold}>
                    Next household ID
                  </Button>
                </div>
                <TextInput
                  label="Household ID"
                  value={form.householdId}
                  onChange={(event) => handleChange('householdId', event.target.value.toUpperCase())}
                />
                <TextInput
                  label="Household size"
                  type="number"
                  min="1"
                  value={form.householdCount}
                  onChange={(event) => handleChange('householdCount', event.target.value)}
                />
                <TextInput
                  label="Email or phone"
                  value={form.contact}
                  onChange={(event) => handleChange('contact', event.target.value)}
                />
                <label className="select-label">
                  RSVP status
                  <select
                    value={form.rsvpStatus}
                    onChange={(event) => handleChange('rsvpStatus', event.target.value)}
                  >
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="textarea-label">
                  Notes
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(event) => handleChange('notes', event.target.value)}
                  />
                </label>
              </div>

              {error && <p className="form-error">{error}</p>}

              <footer className="admin-guests__modal-footer">
                <Button type="button" variant="ghost" size="md" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md">
                  {editingCode ? 'Save changes' : 'Add guest'}
                </Button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGuestsPage;
