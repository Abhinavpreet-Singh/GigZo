import { create } from 'zustand';
import {
  mockUser,
  mockLiveConditions,
  mockEarnings,
  mockAlert,
  mockActiveClaim,
  mockPayoutHistory,
  mockHistoryStats,
} from '@/services/mockData';

type Plan = 'basic' | 'pro' | null;
type HistoryFilter = 'ALL' | 'RAIN' | 'AQI' | 'FLOOD';

interface AppState {
  // User
  user: typeof mockUser;
  isOnboarded: boolean;

  // Live data
  conditions: typeof mockLiveConditions;
  earnings: typeof mockEarnings;
  alert: typeof mockAlert | null;

  // Plan
  selectedPlan: Plan;

  // Claims
  activeClaim: typeof mockActiveClaim | null;
  historyFilter: HistoryFilter;
  payoutHistory: typeof mockPayoutHistory;
  historyStats: typeof mockHistoryStats;

  // Actions
  setSelectedPlan: (plan: Plan) => void;
  setHistoryFilter: (filter: HistoryFilter) => void;
  setOnboarded: (val: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: mockUser,
  isOnboarded: false, // set to false to show onboarding
  conditions: mockLiveConditions,
  earnings: mockEarnings,
  alert: mockAlert,
  selectedPlan: 'pro' as Plan,
  activeClaim: mockActiveClaim,
  historyFilter: 'ALL' as HistoryFilter,
  payoutHistory: mockPayoutHistory,
  historyStats: mockHistoryStats,

  setSelectedPlan: (plan) => set({ selectedPlan: plan }),
  setHistoryFilter: (filter) => set({ historyFilter: filter }),
  setOnboarded: (val) => set({ isOnboarded: val }),
}));
