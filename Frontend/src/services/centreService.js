// CENTRE SERVICE — mock procurement-centre data.
// Replace with GET /api/centres later.
import { delay } from '../utils/storage';

export const CENTRES = [
  {
    id: 'KR-PHK-01',
    name: 'Phagwara Procurement Centre',
    address: 'Grand Trunk Rd, Focal Point, Phagwara, Kapurthala, Punjab',
    distanceKm: 8.2,
    driveMins: 14,
    waitingFarmers: 21,
    waitMins: 18,
    freePct: 61,
    hours: '08:00 AM – 06:00 PM',
    bays: 'Bay #1, #2 & 3 Active',
    crops: ['Wheat', 'Paddy', 'Maize'],
    status: 'open',
    recommended: true,
    mapPos: { x: 58, y: 30 }, // % position on mock map canvas
  },
  {
    id: 'KR-PHK-02',
    name: 'Markfed Focal Point Centre',
    address: 'Focal Point Industrial Area, Phagwara, Kapurthala, Punjab',
    distanceKm: 11.4,
    driveMins: 21,
    waitingFarmers: 34,
    waitMins: 35,
    freePct: 38,
    hours: '08:00 AM – 05:00 PM',
    bays: 'Bay #1 & #2 Active',
    crops: ['Wheat', 'Paddy'],
    status: 'busy',
    mapPos: { x: 76, y: 44 },
  },
  {
    id: 'KR-PHK-03',
    name: 'Patiala Road Yard Centre',
    address: 'Patiala Road, Phagwara Outskirts, Kapurthala, Punjab',
    distanceKm: 14.9,
    driveMins: 26,
    waitingFarmers: 58,
    waitMins: 65,
    freePct: 12,
    hours: '08:00 AM – 04:00 PM',
    bays: 'Only Bay #1 Active',
    crops: ['Paddy'],
    status: 'busy',
    mapPos: { x: 34, y: 62 },
  },
  {
    id: 'KR-PHK-04',
    name: 'Mehtan Sub Centre',
    address: 'Mehtan Village Road, Kapurthala, Punjab',
    distanceKm: 6.1,
    driveMins: 12,
    waitingFarmers: 0,
    waitMins: 0,
    freePct: 0,
    hours: 'Closed for Rabi Season',
    bays: '—',
    crops: [],
    status: 'closed',
    mapPos: { x: 82, y: 20 },
  },
];

export async function getProcurementCentres() {
  await delay(900); // lets the skeleton loader show
  return CENTRES.map((c) => ({ ...c }));
}

export async function getCentre(centreId) {
  await delay(350);
  return CENTRES.find((c) => c.id === centreId) || null;
}

// Deterministic pseudo-random from a string, so a given centre+date always
// yields the same slot layout (stable across refreshes, like a real server).
function seedOf(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

const SLOT_TIMES = [
  { id: 's1', label: '08:00 AM – 10:00 AM' },
  { id: 's2', label: '10:00 AM – 12:00 PM' },
  { id: 's3', label: '12:00 PM – 02:00 PM' },
  { id: 's4', label: '02:00 PM – 04:00 PM' },
  { id: 's5', label: '04:00 PM – 06:00 PM' },
];

export async function getAvailableSlots(centreId, dateISO) {
  await delay(700);
  const seed = seedOf(`${centreId}:${dateISO}`);
  return SLOT_TIMES.map((s, i) => {
    const roll = (seed >> (i * 3)) % 10;
    const status = roll < 2 ? 'full' : roll < 4 ? 'limited' : roll < 9 ? 'available' : 'closed';
    const qAvailable = status === 'full' || status === 'closed' ? 0 : 5 + ((seed >> (i + 2)) % 60);
    return { ...s, status, qAvailable };
  });
}

// Day-level availability for the calendar.
export async function getDayAvailability(centreId, dateISO) {
  const seed = seedOf(`${centreId}:${dateISO}:day`);
  const roll = seed % 10;
  if (roll < 2) return 'full';
  if (roll < 4) return 'limited';
  return 'available';
}
