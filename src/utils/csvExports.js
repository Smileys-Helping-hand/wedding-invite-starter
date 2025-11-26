import { encodeCsvValue, formatCheckInTime } from './guestUtils.js';

const exportArrivalsCsv = (entries = [], checkIns = {}) => {
  if (typeof document === 'undefined') return;
  const headers = [
    'code',
    'primaryGuest',
    'householdId',
    'householdCount',
    'rsvpStatus',
    'checkedIn',
    'checkedInAt',
  ];

  const rows = entries.map((guest) => {
    const record = checkIns[guest.code?.toUpperCase()] ?? {};
    return [
      guest.code,
      guest.primaryGuest,
      guest.householdId ?? '',
      (guest.householdCount ?? 0) + (guest.additionalGuests ?? 0),
      guest.rsvpStatus,
      record.checkedIn ? 'Yes' : 'No',
      record.checkedInAt ? formatCheckInTime(record.checkedInAt) : '',
    ];
  });

  const csv = [headers.join(','), ...rows.map((row) => row.map(encodeCsvValue).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `event-arrivals-${Date.now()}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const openArrivalsPrintView = (entries = [], checkIns = {}) => {
  if (typeof document === 'undefined') return;
  const popup = window.open('', '_blank', 'noopener,noreferrer,width=900,height=1200');
  if (!popup) return;

  const safe = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const tableRows = entries
    .map((guest) => {
      const record = checkIns[guest.code?.toUpperCase()] ?? {};
      const arrival = record.checkedInAt ? formatCheckInTime(record.checkedInAt) : '';
      return `
        <tr>
          <td>${safe(guest.primaryGuest)}</td>
          <td>${safe(guest.code)}</td>
          <td>${safe(guest.householdId ?? '')}</td>
          <td>${safe((guest.householdCount ?? 0) + (guest.additionalGuests ?? 0))}</td>
          <td>${safe(guest.rsvpStatus)}</td>
          <td>${safe(record.checkedIn ? 'Yes' : 'No')}</td>
          <td>${safe(arrival)}</td>
        </tr>`;
    })
    .join('');

  const html = `
    <html>
      <head>
        <title>Arrivals print view</title>
        <style>
          body { font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif; padding: 18px; color: #1f1b16; }
          h1 { margin: 0 0 12px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #d7c8a5; padding: 8px; text-align: left; font-size: 14px; }
          th { background: #f7f1e5; }
          tr:nth-child(even) { background: #faf7ef; }
          @media print {
            body { padding: 0; }
            th, td { font-size: 12px; }
          }
        </style>
      </head>
      <body>
        <h1>Event arrivals</h1>
        <table>
          <thead>
            <tr>
              <th>Primary guest</th>
              <th>Code</th>
              <th>Household</th>
              <th>Size</th>
              <th>Status</th>
              <th>Arrived</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </body>
    </html>
  `;

  popup.document.write(html);
  popup.document.close();
  popup.focus();
};

export { exportArrivalsCsv, openArrivalsPrintView };
