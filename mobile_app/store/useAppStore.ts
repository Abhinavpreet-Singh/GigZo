import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createJSONStorage, persist } from "zustand/middleware";
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

function sanitizePhoneForUi(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  if (value.startsWith("email:")) {
    return value.slice("email:".length);
  }

  return value;
}

interface AppState {
  // User
  user: AppUser;
  isOnboarded: boolean;
  hasHydrated: boolean;

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
  resetSession: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: mockUser,
      isOnboarded: false,
      hasHydrated: false,
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
      setUser: (user) =>
        set((state) => ({
          user: {
            ...state.user,
            ...user,
            phone: sanitizePhoneForUi(user.phone) || state.user.phone,
          },
        })),
      resetSession: () =>
        set({
          user: mockUser,
          isOnboarded: false,
          selectedPlan: "pro",
          historyFilter: "ALL",
        }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "gigzo-app-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isOnboarded: state.isOnboarded,
        selectedPlan: state.selectedPlan,
        historyFilter: state.historyFilter,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
