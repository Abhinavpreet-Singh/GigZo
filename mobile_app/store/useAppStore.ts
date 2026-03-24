import { create } from "zustand";
import {
  mockUser,
  mockLiveConditions,
  mockEarnings,
  mockAlert,
  mockActiveClaim,
  mockPayoutHistory,
  mockHistoryStats,
} from "@/services/mockData";

type Plan = "basic" | "pro" | null;
type HistoryFilter = "ALL" | "RAIN" | "AQI" | "FLOOD";

type AppUser = typeof mockUser & {
  workerId?: string | null;
  type?: "full-time" | "part-time" | null;
  pincode?: string | null;
  workingArea?: string | null;
  workingHoursPerDay?: number | null;
  avgDailyEarning?: number | null;
  age?: number | null;
};

interface AppState {
  // User
  user: AppUser;
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
  setUser: (user: Partial<AppUser>) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: mockUser,
  isOnboarded: false, // false = show onboarding flow
  conditions: mockLiveConditions,
  earnings: mockEarnings,
  alert: mockAlert,
  selectedPlan: "pro" as Plan,
  activeClaim: mockActiveClaim,
  historyFilter: "ALL" as HistoryFilter,
  payoutHistory: mockPayoutHistory,
  historyStats: mockHistoryStats,

  setSelectedPlan: (plan) => set({ selectedPlan: plan }),
  setHistoryFilter: (filter) => set({ historyFilter: filter }),
  setOnboarded: (val) => set({ isOnboarded: val }),
  setUser: (user) => set((state) => ({ user: { ...state.user, ...user } })),
}));
