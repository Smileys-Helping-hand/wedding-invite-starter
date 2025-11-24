import Button from './common/Button.jsx';
import Tag from './common/Tag.jsx';
import './GuestModal.css';

const GuestModal = ({ guest, record, canEdit = false, onSave, onClose }) => {
  if (!guest) return null;
  const arrivalText = record?.checkedInAt ? guest?.arrivalLabel : 'Awaiting arrival';

  const handleSave = () => {
    if (!canEdit || !onSave) return;
    const form = document.getElementById('guest-modal-form');
    if (!form) return;
    const formData = new FormData(form);
    const notes = formData.get('notes');
    const vip = formData.get('vip') === 'on';
    onSave({ notes, vip });
  };

  return (
    <div className="guest-modal" role="dialog" aria-modal="true">
      <div className="guest-modal__card">
        <header className="guest-modal__header">
          <div>
            <p className="eyebrow">Household</p>
            <h3 className="guest-modal__title">{guest.guestNames?.join(' & ')}</h3>
            <p className="guest-modal__subtitle">{guest.householdId ? `${guest.householdId} · ` : ''}Code {guest.code}</p>
          </div>
          <div className="guest-modal__tags">
            <Tag tone={guest.rsvpStatus === 'confirmed' ? 'success' : guest.rsvpStatus === 'pending' ? 'warning' : 'neutral'}>
              {guest.rsvpStatus === 'confirmed'
                ? 'Confirmed'
                : guest.rsvpStatus === 'pending'
                  ? 'Pending'
                  : 'Regret'}
            </Tag>
            {guest.vip && <Tag tone="warning">VIP</Tag>}
          </div>
        </header>

        <form id="guest-modal-form" className="guest-modal__body" onSubmit={(event) => event.preventDefault()}>
          <div className="guest-modal__info">
            <div>
              <p className="detail-label">Contact</p>
              <p className="detail-value">{guest.contact || 'Not provided'}</p>
            </div>
            <div>
              <p className="detail-label">Household size</p>
              <p className="detail-value">{guest.householdCount + (guest.additionalGuests ?? 0)}</p>
            </div>
            <div>
              <p className="detail-label">Arrival</p>
              <p className="detail-value">{arrivalText}</p>
            </div>
          </div>

          <label className="textarea-label">
            Notes
            <textarea name="notes" rows={3} defaultValue={guest.notes || ''} disabled={!canEdit} />
          </label>

          <label className="checkbox-label">
            <input type="checkbox" name="vip" defaultChecked={guest.vip} disabled={!canEdit} />
            <span>Mark as VIP</span>
          </label>
        </form>

        <footer className="guest-modal__footer">
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button variant="primary" onClick={handleSave} disabled={!canEdit}>
            Save
          </Button>
        </footer>
      </div>
    </div>
  );
};

export default GuestModal;
