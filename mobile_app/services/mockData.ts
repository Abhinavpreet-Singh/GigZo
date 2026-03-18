// GigZo Mock Data — realistic sample data for all screens

export const mockUser = {
  id: 'W001',
  name: 'Arjun Sharma',
  phone: '+91 98765 43210',
  platform: 'Zomato',
  city: 'Chandigarh',
  zone: 'Sector 35',
  isProtected: true,
  activePlan: 'pro',
  planExpiry: '2026-03-25',
  daysLeft: 7,
  coveragePerDay: 500,
  riskLevel: 'HIGH' as const,
  riskScore: 82,
};

export const mockLiveConditions = {
  rainfall: { value: 62, unit: 'mm', threshold: 50, triggered: true },
  aqi: { value: 385, unit: '', threshold: 300, triggered: true },
  temperature: { value: 31, unit: '°C', threshold: 40, triggered: false },
  windSpeed: { value: 24, unit: 'km/h', threshold: 60, triggered: false },
  overallRisk: 'HIGH' as const,
  status: 'Conditions near payout threshold — monitoring active',
  isLive: true,
};

export const mockEarnings = {
  thisWeek: 1500,
  weeklyMax: 3000,
  totalProtected: 2100,
};

export const mockAlert = {
  title: 'Heavy rain detected in your area',
  subtitle: 'You may receive payout if threshold crosses',
  type: 'rain' as const,
};

export const mockPlans = [
  {
    id: 'basic',
    name: 'Basic',
    price: 40,
    period: 'week',
    payoutPerDay: 300,
    tagLine: '₹300 payout per disruption day',
    features: [
      'Rain coverage ₹300/day',
      'AQI alert protection',
      'Weekly auto-renewal',
    ],
    recommended: false,
    color: '#ffffff',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 55,
    period: 'week',
    payoutPerDay: 500,
    tagLine: '₹500 payout per disruption day',
    features: [
      'Rain + Flood coverage',
      'AQI + Curfew protection',
      'Instant payout (< 2 hrs)',
    ],
    recommended: true,
    color: '#02555d',
  },
];

export const mockActiveClaim = {
  id: 'CLM005',
  type: 'AQI',
  reason: 'AQI > 380 — Verification in progress',
  amount: 300,
  status: 'in_progress' as const,
  steps: [
    { label: 'Detected', icon: 'radio-button-on', done: true },
    { label: 'Triggered', icon: 'flash', done: true },
    { label: 'Fraud Check', icon: 'shield-checkmark', done: false },
    { label: 'Payout', icon: 'cash', done: false },
  ],
};

export const mockThresholds = [
  {
    id: 'rain',
    label: 'Rainfall',
    icon: 'rainy',
    current: 62,
    threshold: 50,
    unit: 'mm',
    triggered: true,
    color: '#3b82f6',
  },
  {
    id: 'aqi',
    label: 'AQI',
    icon: 'leaf',
    current: 385,
    threshold: 300,
    unit: '',
    triggered: true,
    color: '#f59e0b',
  },
  {
    id: 'wind',
    label: 'Wind Speed',
    icon: 'speedometer',
    current: 24,
    threshold: 60,
    unit: 'km/h',
    triggered: false,
    color: '#8b5cf6',
  },
];

export const mockPayoutHistory = [
  {
    id: '1',
    type: 'RAIN' as const,
    title: 'Heavy Rain > 50mm',
    date: '2026-03-14',
    amount: 500,
    status: 'PAID' as const,
  },
  {
    id: '2',
    type: 'AQI' as const,
    title: 'Severe Air Quality AQI > 400',
    date: '2026-03-10',
    amount: 300,
    status: 'PAID' as const,
  },
  {
    id: '3',
    type: 'RAIN' as const,
    title: 'Heavy Rain > 50mm',
    date: '2026-03-05',
    amount: 500,
    status: 'PAID' as const,
  },
  {
    id: '4',
    type: 'FLOOD' as const,
    title: 'Flood Alert in Zone',
    date: '2026-02-28',
    amount: 800,
    status: 'PAID' as const,
  },
  {
    id: '5',
    type: 'AQI' as const,
    title: 'AQI > 380 — Verification in progr...',
    date: '2026-03-18',
    amount: 300,
    status: 'VERIFIED' as const,
  },
];

export const mockHistoryStats = {
  totalReceived: 2100,
  claimsPaid: 4,
  pending: 1,
};

export const mockRiskZones = [
  { id: 'z1', name: 'Sector 35', risk: 'HIGH' as const, lat: 30.7333, lng: 76.7794 },
  { id: 'z2', name: 'Sector 17', risk: 'MEDIUM' as const, lat: 30.7411, lng: 76.7785 },
  { id: 'z3', name: 'Sector 22', risk: 'LOW' as const, lat: 30.7388, lng: 76.8041 },
  { id: 'z4', name: 'Industrial Area', risk: 'HIGH' as const, lat: 30.7046, lng: 76.8029 },
  { id: 'z5', name: 'Panchkula', risk: 'MEDIUM' as const, lat: 30.6942, lng: 76.8606 },
];
