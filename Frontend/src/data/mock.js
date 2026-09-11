// All static/demo data for the app — replace with API calls later.
import React from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ---------- Mandi Finder ----------
export const mandis = [
  {
    id: 'PUN-KAP-08',
    name: 'Phagwara Main Mandi Centre',
    hindiName: 'फगवाड़ा मुख्य मंडी',
    address: 'Grand Trunk Rd, Focal Point, Phagwara, Kapurthala',
    distanceKm: 8.2,
    driveMins: 14,
    queueTrolleys: 21,
    waitMins: 18,
    freePct: 61,
    hours: '08:00 AM – 06:00 PM',
    bays: 'Bay #1, #2 & 3 Active',
    crops: 'Wheat (HD-2967, PBW), Paddy',
    status: 'open', // open | busy | closed | warn
    recommended: true,
  },
  {
    id: 'PUN-KAP-04',
    name: 'Markfed Focal Point',
    hindiName: 'मार्कफेड फोकल पॉइंट',
    address: 'Focal Point Industrial Area, Phagwara',
    distanceKm: 11.4,
    driveMins: 21,
    queueTrolleys: 34,
    waitMins: 35,
    freePct: 38,
    hours: '08:00 AM – 05:00 PM',
    bays: 'Bay #1 & #2 Active',
    crops: 'Wheat, Paddy, Maize',
    status: 'busy',
  },
  {
    id: 'PUN-KAP-11',
    name: 'Patiala Road Yard',
    hindiName: 'पटियाला रोड यार्ड',
    address: 'Patiala Road, Phagwara Outskirts',
    distanceKm: 14.9,
    driveMins: 26,
    queueTrolleys: 58,
    waitMins: 65,
    freePct: 12,
    hours: '08:00 AM – 04:00 PM',
    bays: 'Only Bay #1 Active',
    crops: 'Paddy',
    status: 'warn',
  },
  {
    id: 'PUN-KAP-19',
    name: 'Mehtan Sub-Yard',
    hindiName: 'मेहतां उप-यार्ड',
    address: 'Mehtan Village, Kapurthala',
    distanceKm: 6.1,
    driveMins: 12,
    queueTrolleys: 0,
    waitMins: 0,
    freePct: 0,
    hours: 'Closed for Rabi',
    bays: '—',
    crops: '—',
    status: 'closed',
  },
];

export const filterChips = [
  { key: 'all', label: 'All Centres', count: 12 },
  { key: 'available', label: '🟢 Available Now' },
  { key: 'wait', label: 'Lowest Wait (<20m)' },
  { key: 'near', label: 'Nearest (<10km)' },
  { key: 'space', label: 'High Space Free' },
  { key: 'wheat', label: '🌾 Wheat (कनक)' },
];

// ---------- Booking Pass ----------
export const booking = {
  id: 'KS-20260907-A247-X8K4',
  token: 'A-247',
  crop: '52 क्विंटल',
  cropDetail: 'Wheat (HD-2967) Gr-A',
  farmer: 'Raj Kumar (राज कुमार)',
  farmerId: '••••••4721 • Aadhaar Linked',
  issuer: 'PUNJAB STATE MANDI BOARD',
  issuerSub: 'FCI Central Pool Procurement',
  centre: 'Phagwara Procurement Centre',
  bay: 'Markfed Weighing Bay #02, GT Road Hub',
  date: '7 September 2026',
  slot: '10:00 AM – 12:00 PM (Morning Window)',
  tMinus: 'T-MINUS 90 MIN',
  route: '8.2 km via GT Road',
  drive: '~14 min drive',
  currentPhase: 2,
};

export const journeyPhases = [
  { title: 'CONFIRMED', hindi: 'स्लॉट पक्का', note: 'Slot reserved & token linked to Farmer ID', time: '08:30 AM' },
  { title: 'CHECK-IN READY', hindi: 'गेट प्रवेश तैयार', note: 'Show QR code or quote verification ID at Gate #02 operator booth', time: '' },
  { title: 'CHECKED IN', hindi: 'गेट सत्यापन', note: '', time: '' },
  { title: 'IN LIVE QUEUE', hindi: 'मंडी कतार', note: '', time: '' },
  { title: 'MOISTURE & QUALITY TEST', hindi: 'नमी व गुणवत्ता', note: 'target ≤ 12%', time: '' },
  { title: 'WEIGHBRIDGE WEIGHING', hindi: 'तौल कांटा', note: '', time: '' },
  { title: 'J-FORM ISSUED', hindi: 'जे-फॉर्म जारी', note: '', time: '' },
  { title: 'DBT PAYMENT INITIATED', hindi: 'सीधा बैंक भुगतान', note: 'within 48 hours to Aadhaar bank', time: '' },
];

// ---------- Verification (operator) ----------
export const verifyResult = {
  eligible: true,
  token: 'A-247',
  slot: '10:00 AM – 12:00 PM',
  arrival: 'On-Time (10:14 AM)',
  farmer: 'Raj Kumar / राज कुमार',
  aadhaar: '•••• •••• 4721',
  mobile: '+91 98765-•••••',
  vehicle: 'PB-11-X-8902',
  vehicleType: 'Tractor Trolley',
  commodity: 'Wheat (HD-2967)',
  msp: '₹2,275 / Qtl',
  declared: '52.0',
  queuePos: '#04',
  estWeigh: '12 Mins',
};

// ---------- Live Queue Control ----------
export const counters = [
  { id: 'C01', state: 'active', token: 'A103', farmer: 'Harpreet Singh', qty: 'Paddy 40 Q', op: 'Sunita Devi', elapsed: '06m 14s' },
  { id: 'C02', state: 'active', token: 'A104', farmer: 'Manpreet Kaur', qty: 'Wheat 25 Q', op: 'Gurdeep S.', note: 'Moisture lab assay pending' },
  { id: 'C03', state: 'idle', note: 'Ready for next vehicle', op: 'Amrik S.', extra: 'Bay 3 Unoccupied' },
  { id: 'C04', state: 'paused', note: 'Weighbridge Drift (0.2%)', extra: 'NABL check underway' },
  { id: 'C05', state: 'payment', token: 'A101', farmer: 'Raj Kumar (Mehtiana)', qty: 'Paddy 52 Q', extra: 'DBT PFMS Initiated • GP-8839' },
];

export const queueRecords = [
  { token: 'A103', name: 'Harpreet Singh', id: 'PB-99201', village: 'Hadiabad', crop: 'Paddy (PR-126)', qty: '40.00 Q', arrival: '09:15 AM', wait: 18, assay: { label: '11.4% OK', kind: 'pass' }, foreign: 'Foreign: 0.8% (Pass)', bay: 'Counter 01', status: 'Processing' },
  { token: 'A104', name: 'Manpreet Kaur', id: 'PB-99204', village: 'Phagwara East', crop: 'Wheat (Sharbati)', qty: '25.00 Q', arrival: '09:22 AM', wait: 26, assay: { label: 'Lab Testing', kind: 'pending' }, foreign: 'Assay #88431', bay: 'Counter 02', status: 'Verification' },
  { token: 'A105', name: 'Balwant Singh Dhillon', id: 'PB-99205', village: 'Mehtiana', crop: 'Paddy', qty: '60.00 Q', arrival: '09:28 AM', wait: 34, assay: { label: '10.9% OK', kind: 'pass' }, foreign: 'Moisture Verified', bay: 'Unassigned', status: 'Next In Line' },
  { token: 'A106', name: 'Jagtar Singh Randhawa', id: 'PB-99212', village: 'Chaheru', crop: 'Paddy', qty: '45.00 Q', arrival: '09:34 AM', wait: 28, assay: { label: '13.9% HIGH', kind: 'fail' }, foreign: 'Re-aeration Yard 2', bay: 'Holding Bay', status: 'Escalated' },
  { token: 'A107', name: 'Sukhwinder Pal', id: 'PB-99219', village: 'Palahi', crop: 'Wheat (PBW-550)', qty: '32.00 Q', arrival: '09:41 AM', wait: 21, assay: { label: '11.1% OK', kind: 'pass' }, foreign: 'Nafed Cert. Attached', bay: 'Unassigned', status: 'Waiting' },
  { token: 'A108', name: 'Kewal Ram Sharma', id: 'PB-99224', village: 'Ranipur', crop: 'Paddy', qty: '50.00 Q', arrival: '09:48 AM', wait: 14, assay: { label: 'Lab In-Progress', kind: 'pending' }, foreign: 'Sample Tray #14', bay: 'Unassigned', status: 'Waiting' },
  { token: 'A102', name: 'Gurnam Singh Gill', id: 'PB-99195', village: 'Hadiabad', crop: 'Paddy (Basmati 1509)', qty: '38.50 Q', arrival: '08:52 AM', wait: null, assay: { label: "Grade 'A' Passed", kind: 'done' }, foreign: 'MSP ₹2,203/Q Credited', bay: 'Counter 05', status: 'Completed' },
];

export const congestionZones = [
  { name: 'North Weighbridge Ramp (Bay 1-2)', note: '3 Vehicles (Smooth)', pct: 40 },
  { name: 'Moisture & Assay Testing Shed', note: '7 Vehicles (Mild Wait)', pct: 60 },
  { name: 'South Gate Outflow & DBT Window', note: '2 Vehicles (Cleared)', pct: 25 },
];

export const gridEvents = [
  { text: 'A102 MSP payment ₹84,815 cleared via PFMS', kind: 'good' },
  { text: 'Counter 04 auto-flagged tare discrepancy 0.2%', kind: 'bad' },
  { text: 'Balwant Singh completed Aadhaar biometric OTP sign-off', kind: 'info' },
];

// ---------- Operations Dashboard ----------
export const kpis = [
  { icon: 'tractor', label: 'Arrival Footfall', value: '147', unit: 'Farmers', footer: '83 Done · 11 Active · 31 Queue' },
  { icon: 'trending-up', label: 'Total Procured', value: '4,890', unit: 'Quintals', chip: '81.5% Target', footer: 'Daily Target: 6,000 Q' },
  { icon: 'warehouse', label: 'Remaining Capacity', value: '280', unit: 'Q Left', footer: 'Booked: 4,720 / 5,000 Q' },
  { icon: 'timer-outline', label: 'Depot Avg TAT', value: '42', unit: 'Minutes', chip: '-8 min', footer: 'Gate-in to Out Gate Pass' },
  { icon: 'currency-inr', label: 'PFMS Disbursed', value: '₹1.11', unit: 'Cr', footer: '48 Beneficiaries Credited' },
  { icon: 'water-percent', label: 'Moisture Variance', value: '11.3', unit: '% Avg Lot', chip: 'Max 12.0%', footer: 'Hold/Rejection: 3.2%' },
];

export const intakeSlots = [
  { slot: '08:00–10:00', q: 1100, pct: 78, full: '100%', state: 'done' },
  { slot: '10:00–12:00', q: 1350, pct: 96, full: '98%', state: 'done' },
  { slot: '12:00–14:00', q: 980, pct: 70, full: '85% Inflow', state: 'active' },
  { slot: '14:00–16:00', q: 820, pct: 58, full: 'Surge Alert', state: 'pending' },
  { slot: '16:00–18:00', q: 640, pct: 45, full: 'Open (45%)', state: 'pending' },
];

export const telemetry = [
  { name: 'Weighbridge 01', chip: 'Gross Scale', value: '42.15 MT', sub: 'Calibrated 06:00 AM' },
  { name: 'Weighbridge 02', chip: 'Active Tare', value: '38.60 MT', sub: 'Reading Steady' },
  { name: 'Moisture Unit #1', chip: 'Kett PM-650', value: '11.2% MC', sub: 'Lot #WH-1049 — Pass' },
  { name: 'Moisture Unit #2', chip: 'Pre-Warmed', value: 'Standby', sub: 'Ready for 13:00' },
];

// ---------- Procurement Processing ----------
export const processing = {
  token: 'A103',
  farmer: 'Harpreet Singh',
  father: 'S/o Balwant Singh',
  reg: 'PB-KPR-2024-88392',
  village: 'Kotrani, Block Phagwara, Kapurthala',
  phone: '+91 98765-43210 (PM-KISAN Linked)',
  land: 'Jamabandi Verified: 8.40 Acres',
  tractor: 'Swaraj 855 FE / PB-08-AU-4421',
  gateIn: '10:14 AM / 42m in terminal',
  steps: [
    { title: 'Gate & Token', time: '10:14 AM' },
    { title: 'Biometrics & Land', time: '10:18 AM' },
    { title: 'Assay & Quality', time: '10:24 AM' },
    { title: 'Gross/Tare Weighing', time: 'Bay 1 Active' },
    { title: 'MSP Sanction', time: '' },
    { title: 'Digital Receipt', time: '' },
    { title: 'DBT PFMS Payout', time: 'T+0' },
  ],
  currentStep: 4,
  assay: { moisture: 11.6, moistureMax: 12, foreign: 0.8, foreignMax: 2.5, damaged: 1.1, damagedMax: 5 },
  weights: { gross: '6,850 kg', tare: '2,850 kg', net: '4,000 kg', netQ: '40.00' },
  ledger: { msp: '₹2,183.00', gross: '₹87,320.00', deductions: '₹0.00', cess: '₹0.00', net: '₹87,320.00', words: 'Rupees Eighty-Seven Thousand Three Hundred Twenty Only' },
  bank: { name: 'Punjab National Bank', ac: '**** **** **** 4821', ifsc: 'PUNB0014200 (Kotrani Br.)' },
  receipt: 'PB-KPR-2024-99182',
};
