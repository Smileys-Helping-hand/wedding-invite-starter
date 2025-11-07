import { useMemo, useState } from 'react';
import clsx from 'clsx';

import Button from '../components/common/Button.jsx';
import './GuestSpreadsheetImporter.css';

const REQUIRED_HEADERS = [
  'guestName',
  'partnerName',
  'contact',
  'notes',
  'householdCount',
];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

const normaliseName = (value) => value?.trim() ?? '';

const parseCsvLine = (line) => {
  const values = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
};

const sanitisePrefix = (name) => {
  const letters = name.replace(/[^a-z]/gi, '').toUpperCase();
  if (!letters) {
    return 'GUEST';
  }
  return (letters + 'XXXX').slice(0, 4);
};

const extractNumericSuffix = (value = '') => {
  const match = /([0-9]+)$/.exec(value);
  return match ? parseInt(match[1], 10) : null;
};

const extractHouseholdIndex = (guest) => {
  if (!guest?.householdId) return null;
  const match = /^H(\d+)$/i.exec(guest.householdId);
  return match ? parseInt(match[1], 10) : null;
};

const normaliseExistingGuests = (existingGuests) =>
  existingGuests.map((guest) => {
    const names = Array.isArray(guest.guestNames)
      ? guest.guestNames.filter(Boolean).map((value) => value.trim())
      : [guest.guestName, guest.partnerName].filter(Boolean).map((value) => value.trim());

    const householdCount = Number.isFinite(guest.householdCount)
      ? guest.householdCount
      : Number.isFinite(guest.household)
        ? guest.household
        : Math.max(names.length, 1);

    return {
      code: guest.code,
      guestNames: names,
      householdId: guest.householdId ?? null,
      contact: guest.contact ?? '',
      rsvpStatus: guest.rsvpStatus ?? 'pending',
      notes: guest.notes ?? '',
      householdCount,
    };
  });

const formatHouseholdId = (index) => `H${String(index).padStart(3, '0')}`;

const buildJsonEntry = ({
  code,
  guestNames,
  householdId,
  contact,
  notes,
  householdCount,
}) => ({
  code,
  guestNames,
  householdId,
  contact,
  householdCount,
  rsvpStatus: 'pending',
  notes,
});

const GuestSpreadsheetImporter = ({ existingGuests = [] }) => {
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [fileMeta, setFileMeta] = useState({ name: '', lastUpdated: null });
  const [isParsing, setIsParsing] = useState(false);

  const normalisedExisting = useMemo(
    () => normaliseExistingGuests(existingGuests),
    [existingGuests]
  );

  const existingCodes = useMemo(() => {
    const codes = new Set();
    normalisedExisting.forEach((guest) => {
      if (guest.code) {
        codes.add(guest.code.toUpperCase());
      }
    });
    return codes;
  }, [normalisedExisting]);

  const startingSequence = useMemo(() => {
    let maxSuffix = 1000;
    normalisedExisting.forEach((guest) => {
      const suffix = extractNumericSuffix(guest.code);
      if (suffix && suffix > maxSuffix) {
        maxSuffix = suffix;
      }
    });
    return maxSuffix + 1;
  }, [normalisedExisting]);

  const startingHouseholdIndex = useMemo(() => {
    let maxIndex = 0;
    normalisedExisting.forEach((guest) => {
      const index = extractHouseholdIndex(guest);
      if (index && index > maxIndex) {
        maxIndex = index;
      }
    });
    return maxIndex;
  }, [normalisedExisting]);

  const generateCode = (() => {
    const usedCodes = new Set(existingCodes);
    let sequence = startingSequence;
    return (guestName) => {
      const prefix = sanitisePrefix(guestName);
      let candidate = `${prefix}${sequence}`;
      while (usedCodes.has(candidate)) {
        sequence += 1;
        candidate = `${prefix}${sequence}`;
      }
      usedCodes.add(candidate);
      sequence += 1;
      return candidate;
    };
  })();

  const generateHouseholdId = (() => {
    let index = startingHouseholdIndex;
    return () => {
      index += 1;
      return formatHouseholdId(index);
    };
  })();

  const handleFile = async (file) => {
    if (!file) return;
    setIsParsing(true);
    setRows([]);
    setErrors([]);

    try {
      const text = await file.text();
      const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (lines.length === 0) {
        setErrors(['The CSV appears to be empty.']);
        return;
      }

      const headers = parseCsvLine(lines[0]).map((header) => header.trim());
      const unexpectedHeaders = headers.filter(
        (header) => !REQUIRED_HEADERS.includes(header)
      );
      const missingHeaders = REQUIRED_HEADERS.filter(
        (required) => !headers.includes(required)
      );

      if (unexpectedHeaders.length > 0) {
        setErrors([
          `Unexpected column(s): ${unexpectedHeaders.join(', ')}. Only ${REQUIRED_HEADERS.join(', ')} are supported.`,
        ]);
        return;
      }

      if (missingHeaders.length > 0) {
        setErrors([`Missing required column(s): ${missingHeaders.join(', ')}`]);
        return;
      }

      const headerIndex = headers.reduce(
        (acc, header, index) => ({ ...acc, [header]: index }),
        {}
      );
      const nextRows = [];
      const nextErrors = [];

      lines.slice(1).forEach((line, lineIndex) => {
        if (!line.trim()) return;
        const rawValues = parseCsvLine(line);
        const guestName = normaliseName(rawValues[headerIndex.guestName]);
        const partnerName = normaliseName(rawValues[headerIndex.partnerName]);
        const contact = normaliseName(rawValues[headerIndex.contact]);
        const notes = normaliseName(rawValues[headerIndex.notes]);
        const householdInput = normaliseName(rawValues[headerIndex.householdCount]);
        const rowNumber = lineIndex + 2; // account for header row

        if (!guestName) {
          nextErrors.push(`Row ${rowNumber}: Guest name is required.`);
          return;
        }

        if (contact && !EMAIL_REGEX.test(contact)) {
          nextErrors.push(`Row ${rowNumber}: Contact email is invalid.`);
          return;
        }

        const guestNames = [guestName];
        if (partnerName) {
          guestNames.push(partnerName);
        }

        let householdCount = Number.parseInt(householdInput, 10);
        if (Number.isNaN(householdCount) || householdCount <= 0) {
          householdCount = partnerName ? 2 : 1;
        }

        const code = generateCode(guestName);
        const householdId = generateHouseholdId();

        nextRows.push(
          buildJsonEntry({
            code,
            guestNames,
            householdId,
            contact,
            notes,
            householdCount,
          })
        );
      });

      setRows(nextRows);
      setErrors(nextErrors);
      setFileMeta({ name: file.name, lastUpdated: new Date() });
    } catch (err) {
      setErrors([`Failed to read CSV: ${err.message}`]);
    } finally {
      setIsParsing(false);
    }
  };

  const onFileChange = (event) => {
    const [file] = event.target.files;
    if (file) {
      void handleFile(file);
    }
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    const baseName = fileMeta.name
      ? fileMeta.name.replace(/\.[^/.]+$/, '')
      : 'guest-import';
    anchor.download = `${baseName}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="importer-panel">
      <header className="importer-header">
        <h1 className="page-title">Bulk Import Guests</h1>
        <p className="page-subtitle">
          Upload a CSV exported from your spreadsheet with the expected columns. We will
          validate each row, auto-generate invite codes, and prepare JSON entries you can
          append to <code>src/data/local-guests.json</code>.
        </p>
      </header>

      <div className="importer-card">
        <label className="importer-upload">
          <input type="file" accept=".csv" onChange={onFileChange} disabled={isParsing} />
          <span className="importer-upload__hint">Choose CSV file</span>
          {fileMeta.name && (
            <span className="importer-upload__file">{fileMeta.name}</span>
          )}
        </label>

        <ul className="importer-guidelines">
          <li>
            Columns must be exactly: <code>{REQUIRED_HEADERS.join(', ')}</code>
          </li>
          <li>
            Leave <code>householdCount</code> blank to use automatic defaults (1 or 2
            based on partner).
          </li>
          <li>Email addresses are optional but must be valid when provided.</li>
        </ul>
      </div>

      {errors.length > 0 && (
        <div className="importer-card importer-card--error">
          <h2>Import issues</h2>
          <ul>
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {rows.length > 0 && (
        <div className="importer-card importer-card--results">
          <div className="importer-results__header">
            <div>
              <h2>Generated entries</h2>
              <p>
                {rows.length} household{rows.length > 1 ? 's' : ''} ready for export.
              </p>
            </div>
            <Button onClick={downloadJson} variant="primary" size="md">
              Download JSON
            </Button>
          </div>

          <div className="importer-results__table">
            <div className="importer-results__row importer-results__row--head">
              <span>Code</span>
              <span>Guest names</span>
              <span>Household ID</span>
              <span>Household count</span>
              <span>Contact</span>
              <span>Notes</span>
            </div>
            {rows.map((row) => (
              <div key={row.code} className="importer-results__row">
                <span>{row.code}</span>
                <span>{row.guestNames.join(', ')}</span>
                <span>{row.householdId}</span>
                <span>{row.householdCount}</span>
                <span>{row.contact || '—'}</span>
                <span className={clsx({ 'importer-results__muted': !row.notes })}>
                  {row.notes || '—'}
                </span>
              </div>
            ))}
          </div>

          <details className="importer-json-preview">
            <summary>Preview JSON</summary>
            <pre>{JSON.stringify(rows, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default GuestSpreadsheetImporter;
