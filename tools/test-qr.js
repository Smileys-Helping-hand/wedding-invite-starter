import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

// Import the project's guest utils
import { ensureCheckInsForEntries, toggleCheckInRecord, parseCheckInPayload } from '../src/utils/guestUtils.js';
const localGuests = JSON.parse(fs.readFileSync(path.join(root, 'src', 'data', 'local-guests.json'), 'utf8'));

function pretty(obj) {
  return JSON.stringify(obj, null, 2);
}

console.log('Loaded', localGuests.length, 'guests');

const entries = localGuests.map((g) => ({ ...g, code: (g.code || '').toUpperCase(), guestNames: g.guestNames || [g.guestName].filter(Boolean) }));

let checkIns = ensureCheckInsForEntries(entries, {});
console.log('Initial check-ins for first 3 guests:');
console.log(pretty(Object.fromEntries(Object.entries(checkIns).slice(0, 3))));

const samples = [
  'lumina001',
  'LUMINA001',
  'CHECKIN:lumina001',
  ' Ami123 ',
  'checkin: Ami123',
];

for (const s of samples) {
  const parsed = parseCheckInPayload(s);
  console.log('\nSample input:', JSON.stringify(s), '-> parsed:', parsed);
  if (!parsed) continue;
  const key = parsed.toUpperCase();
  if (!checkIns[key]) {
    console.log('No existing record for', key, '- adding default');
    checkIns = ensureCheckInsForEntries(entries, checkIns);
  }
  const before = checkIns[key];
  console.log('Before:', pretty(before));
  checkIns = toggleCheckInRecord(checkIns, key);
  console.log('After:', pretty(checkIns[key]));
}

console.log('\nFinal check-in snapshot (all codes):');
console.log(pretty(checkIns));
