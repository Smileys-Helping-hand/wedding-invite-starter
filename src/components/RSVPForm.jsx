import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';

import TextInput from './common/TextInput.jsx';
import Button from './common/Button.jsx';
import { RSVP_STATUSES } from '../utils/constants.js';
import './RSVPForm.css';

const RSVPForm = ({
  value,
  onChange,
  onSubmit,
  isSubmitting,
  error,
  success,
  disabled,
}) => {
  const [localState, setLocalState] = useState(value);
  const didCelebrateRef = useRef(false);
  const primaryInputRef = useRef(null);

  useEffect(() => {
    setLocalState(value);
  }, [value]);

  useEffect(() => {
    primaryInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!success) {
      didCelebrateRef.current = false;
      return;
    }

    if (didCelebrateRef.current) return;

    didCelebrateRef.current = true;
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.32 },
      colors: ['#d4af37', '#f5e6b2', '#fff9ed'],
      disableForReducedMotion: true,
    });
  }, [success]);

  const updateField = (field, fieldValue) => {
    const next = { ...localState, [field]: fieldValue };
    setLocalState(next);
    onChange?.(next);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.(localState);
  };

  return (
    <form className="rsvp-detail-form" onSubmit={handleSubmit}>
      <div className="rsvp-detail-form__row">
        <label className="rsvp-detail-form__field">
          <span>Status</span>
          <select
            value={localState.status}
            onChange={(event) => updateField('status', event.target.value)}
            disabled={disabled}
          >
            <option value={RSVP_STATUSES.pending}>Pending</option>
            <option value={RSVP_STATUSES.confirmed}>Joyfully Attending</option>
            <option value={RSVP_STATUSES.declined}>Regretfully Declining</option>
          </select>
        </label>
        <TextInput
          label="Household attending"
          type="number"
          min="1"
          max="8"
          value={localState.householdCount}
          onChange={(event) => updateField('householdCount', event.target.value)}
          disabled={disabled}
          hint="Total guests in your household joining"
        />
      </div>
      <TextInput
        label="Plus one name (optional)"
        value={localState.plusOneName}
        onChange={(event) => updateField('plusOneName', event.target.value)}
        disabled={disabled}
        hint="If you are bringing a guest, let us know their name"
        inputRef={primaryInputRef}
      />
      <TextInput
        label="Warm wishes or notes"
        as="textarea"
        value={localState.message}
        maxLength={240}
        onChange={(event) => updateField('message', event.target.value)}
        disabled={disabled}
        hint="Share a dua, dietary note, or any special request"
      />
      <div className="rsvp-detail-form__actions">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isSubmitting}
          disabled={disabled}
        >
          Save &amp; Share RSVP
        </Button>
      </div>
      {error && <p className="rsvp-detail-form__error">{error}</p>}
      {success && (
        <p className="rsvp-detail-form__success">
          JazakAllahu khairan — your RSVP is safely noted.
        </p>
      )}
    </form>
  );
};

export default RSVPForm;
