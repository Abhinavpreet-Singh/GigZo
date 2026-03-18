import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  Brand,
  Neutral,
  Shadow,
  Radius,
  Spacing,
  Font,
} from "@/constants/theme";
import { useAppStore } from "@/store/useAppStore";
import { mockHistoryStats, mockPayoutHistory } from "@/services/mockData";
import { ModernNavBar } from "@/components/ModernNavBar";

type HistoryFilter = "ALL" | "RAIN" | "AQI" | "FLOOD";
type PayoutType = "RAIN" | "AQI" | "FLOOD";
type PayoutStatus = "PAID" | "VERIFIED" | "PENDING";

const FILTERS: HistoryFilter[] = ["ALL", "RAIN", "AQI", "FLOOD"];

// All use teal tones instead of multicolor
const typeIcon = (
  t: PayoutType,
): React.ComponentProps<typeof Ionicons>["name"] =>
  ({ RAIN: "rainy", AQI: "leaf", FLOOD: "water" })[t] as any;

const statusColor = (s: PayoutStatus) => {
  switch (s) {
    case "PAID":
      return { text: Brand.primary, bg: Brand.primaryLight };
    case "VERIFIED":
      return { text: Brand.primaryMid, bg: Brand.primaryLight };
    case "PENDING":
      return { text: Brand.primaryDark, bg: Brand.accentLight };
    default:
      return { text: Neutral[500], bg: Neutral[100] };
  }
};

function HistoryItem({
  item,
}: {
  item: {
    id: string;
    type: PayoutType;
    title: string;
    date: string;
    amount: number;
    status: PayoutStatus;
  };
}) {
  const sc = statusColor(item.status);
  return (
    <View style={styles.item}>
      <View style={[styles.itemIcon, { backgroundColor: Brand.primaryLight }]}>
        <Ionicons name={typeIcon(item.type)} size={16} color={Brand.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.itemMeta}>
          <Text style={styles.itemDate}>{item.date}</Text>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.statusText, { color: sc.text }]}>
              {item.status}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.itemRight}>
        <Text
          style={[
            styles.itemAmt,
            { color: item.status === "PAID" ? Brand.primary : Neutral[400] },
          ]}
        >
          {item.status === "PAID" ? "+" : ""}₹{item.amount}
        </Text>
        <Text style={styles.itemType}>{item.type}</Text>
      </View>
    </View>
  );
}

const SETTINGS = [
  {
    icon: "notifications-outline",
    label: "Notifications",
    sub: "Alert preferences",
  },
  {
    icon: "shield-outline",
    label: "Fraud Transparency",
    sub: "How we verify claims",
  },
  {
    icon: "help-circle-outline",
    label: "Help & Support",
    sub: "FAQs and contact",
  },
  {
    icon: "document-text-outline",
    label: "Policy Documents",
    sub: "Terms and coverage details",
  },
] as const;

export default function ProfileScreen() {
  const { user, historyFilter, setHistoryFilter, payoutHistory } =
    useAppStore();
  const filtered =
    historyFilter === "ALL"
      ? payoutHistory
      : payoutHistory.filter((h) => h.type === historyFilter);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ModernNavBar
        title="Profile"
        showLogo={false}
        showProfile={false}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Driver card */}
        <View style={styles.driverCard}>
          {/* Avatar */}
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </Text>
            </View>
            <View style={styles.protectedDot} />
          </View>

          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{user.name}</Text>
            <View style={styles.driverMetaRow}>
              <View style={styles.platformPill}>
                <Text style={styles.platformText}>{user.platform}</Text>
              </View>
              <View style={styles.locationRow}>
                <Ionicons
                  name="location-outline"
                  size={11}
                  color={Neutral[400]}
                />
                <Text style={styles.locationText}>{user.zone}</Text>
              </View>
            </View>
            <Text style={styles.phone}>{user.phone}</Text>
          </View>
        </View>

        {/* Plan status strip */}
        <View style={styles.planStrip}>
          <View style={styles.planStripLeft}>
            <Ionicons name="shield-checkmark" size={18} color={Brand.primary} />
            <View>
              <Text style={styles.planStripTitle}>Pro Plan Active</Text>
              <Text style={styles.planStripSub}>
                ₹{user.coveragePerDay}/day · {user.daysLeft} days remaining
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.planStripBtn}>
            <Text style={styles.planStripBtnText}>Renew</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            {
              label: "Total Received",
              value: `₹${mockHistoryStats.totalReceived.toLocaleString()}`,
            },
            { label: "Claims Paid", value: `${mockHistoryStats.claimsPaid}` },
            { label: "Pending", value: `${mockHistoryStats.pending}` },
          ].map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Payout History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payout History</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {FILTERS.map((f) => (
              <TouchableOpacity
                key={f}
                style={[
                  styles.filterTab,
                  historyFilter === f && styles.filterTabActive,
                ]}
                onPress={() => setHistoryFilter(f)}
              >
                <Text
                  style={[
                    styles.filterText,
                    historyFilter === f && styles.filterTextActive,
                  ]}
                >
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.list}>
            {filtered.map((item, idx) => (
              <View key={item.id}>
                <HistoryItem item={item as any} />
                {idx < filtered.length - 1 && <View style={styles.sep} />}
              </View>
            ))}
          </View>
        </View>

        {/* Streak badge */}
        <View style={styles.streakCard}>
          <View
            style={[styles.streakIcon, { backgroundColor: Brand.primaryLight }]}
          >
            <Ionicons name="flame" size={18} color={Brand.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.streakTitle}>3-Week Streak</Text>
            <Text style={styles.streakSub}>You are a top protected rider</Text>
          </View>
          <View style={styles.dotsRow}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={styles.dot} />
            ))}
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingsCard}>
            {SETTINGS.map((s, idx) => (
              <View key={s.label}>
                <TouchableOpacity style={styles.settingRow}>
                  <View
                    style={[
                      styles.settingIcon,
                      { backgroundColor: Brand.primaryLight },
                    ]}
                  >
                    <Ionicons name={s.icon} size={16} color={Brand.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.settingLabel}>{s.label}</Text>
                    <Text style={styles.settingSub}>{s.sub}</Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={15}
                    color={Neutral[300]}
                  />
                </TouchableOpacity>
                {idx < SETTINGS.length - 1 && <View style={styles.sep} />}
              </View>
            ))}
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOut}>
          <Ionicons name="log-out-outline" size={16} color={Brand.danger} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Neutral[50] },

  // Driver card
  driverCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
    backgroundColor: Neutral.white,
    margin: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: 0,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Neutral[100],
    ...Shadow.xs,
  },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Brand.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: Font.bold,
    fontSize: 22,
    color: Neutral.white,
    letterSpacing: 1,
  },
  protectedDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Brand.success,
    borderWidth: 2,
    borderColor: Neutral.white,
  },
  driverInfo: { flex: 1 },
  driverName: {
    fontFamily: Font.bold,
    fontSize: 18,
    color: Neutral[900],
    marginBottom: 6,
  },
  driverMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 5,
  },
  platformPill: {
    backgroundColor: Brand.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  platformText: {
    fontFamily: Font.semiBold,
    fontSize: 11,
    color: Brand.primary,
  },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  locationText: { fontFamily: Font.regular, fontSize: 11, color: Neutral[400] },
  phone: { fontFamily: Font.regular, fontSize: 12, color: Neutral[400] },

  // Plan strip
  planStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Brand.primary,
    margin: Spacing.lg,
    marginBottom: 0,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
  },
  planStripLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  planStripTitle: {
    fontFamily: Font.semiBold,
    fontSize: 14,
    color: Neutral.white,
  },
  planStripSub: {
    fontFamily: Font.regular,
    fontSize: 11,
    color: "rgba(255,255,255,0.65)",
    marginTop: 2,
  },
  planStripBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
  },
  planStripBtnText: {
    fontFamily: Font.semiBold,
    fontSize: 13,
    color: Neutral.white,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Neutral.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: Neutral[100],
    ...Shadow.xs,
  },
  statValue: { fontFamily: Font.bold, fontSize: 17, color: Brand.primary },
  statLabel: {
    fontFamily: Font.regular,
    fontSize: 10,
    color: Neutral[400],
    textAlign: "center",
  },

  // History section
  section: { paddingHorizontal: Spacing.lg, marginTop: Spacing.xl },
  sectionTitle: {
    fontFamily: Font.bold,
    fontSize: 16,
    color: Neutral[900],
    marginBottom: Spacing.md,
  },
  filterRow: { gap: Spacing.sm, marginBottom: Spacing.md },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Neutral[200],
    backgroundColor: Neutral.white,
  },
  filterTabActive: {
    backgroundColor: Brand.primary,
    borderColor: Brand.primary,
  },
  filterText: { fontFamily: Font.semiBold, fontSize: 12, color: Neutral[500] },
  filterTextActive: { color: Neutral.white },

  list: {
    backgroundColor: Neutral.white,
    borderRadius: Radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Neutral[100],
    ...Shadow.xs,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  itemTitle: { fontFamily: Font.semiBold, fontSize: 13, color: Neutral[800] },
  itemMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 3,
  },
  itemDate: { fontFamily: Font.regular, fontSize: 11, color: Neutral[400] },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  statusText: { fontFamily: Font.bold, fontSize: 9, letterSpacing: 0.4 },
  itemRight: { alignItems: "flex-end", gap: 3 },
  itemAmt: { fontFamily: Font.bold, fontSize: 14 },
  itemType: {
    fontFamily: Font.bold,
    fontSize: 9,
    color: Neutral[400],
    letterSpacing: 0.4,
  },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: Neutral[100] },

  // Streak
  streakCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Neutral.white,
    margin: Spacing.lg,
    marginBottom: 0,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Neutral[100],
    ...Shadow.xs,
  },
  streakIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  streakTitle: { fontFamily: Font.semiBold, fontSize: 14, color: Neutral[800] },
  streakSub: {
    fontFamily: Font.regular,
    fontSize: 12,
    color: Neutral[400],
    marginTop: 2,
  },
  dotsRow: { flexDirection: "row", gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Brand.primary },

  // Settings
  settingsCard: {
    backgroundColor: Neutral.white,
    borderRadius: Radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Neutral[100],
    ...Shadow.xs,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  settingIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  settingLabel: {
    fontFamily: Font.semiBold,
    fontSize: 14,
    color: Neutral[800],
  },
  settingSub: {
    fontFamily: Font.regular,
    fontSize: 11,
    color: Neutral[400],
    marginTop: 2,
  },

  // Sign out
  signOut: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Brand.dangerLight,
  },
  signOutText: { fontFamily: Font.semiBold, fontSize: 14, color: Brand.danger },
});
