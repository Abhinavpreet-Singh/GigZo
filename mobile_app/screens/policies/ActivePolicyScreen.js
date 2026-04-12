import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Brand, Neutral, Shadow, Radius, Spacing, Font } from "@/constants/theme";

const RUPEE = "\u20B9";

function TriggerItem({ icon, label }) {
  return (
    <View style={styles.triggerItem}>
      <View style={styles.triggerIconWrap}>
        <Ionicons name={icon} size={16} color={Brand.primary} />
      </View>
      <Text style={styles.triggerLabel}>{label}</Text>
    </View>
  );
}

export default function ActivePolicyScreen({
  policy,
  onRenew,
  onCancel,
  loadingRenew,
  loadingCancel,
}) {
  if (!policy) return null;

  const triggerLabels = [
    { key: "rain", icon: "rainy-outline", label: `Heavy Rain > ${policy.triggers?.rain ?? 50}mm` },
    { key: "aqi", icon: "leaf-outline", label: `AQI > ${policy.triggers?.aqi ?? 400}` },
    ...(policy.triggers?.flood ? [{ key: "flood", icon: "water-outline", label: "Flood Alert" }] : []),
    ...(policy.triggers?.curfew ? [{ key: "curfew", icon: "shield-outline", label: "Curfew Restrictions" }] : []),
  ];

  return (
    <View style={styles.wrap}>
      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <Text style={styles.statusTitle}>Coverage Status</Text>
          <View style={styles.protectedPill}>
            <View style={styles.protectedDot} />
            <Text style={styles.protectedText}>ACTIVE</Text>
          </View>
        </View>

        <View style={styles.detailGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Policy number</Text>
            <Text style={styles.detailValue}>{policy.policyNumber || policy.id}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Validity</Text>
            <Text style={styles.detailValue}>{policy.validRange || `${new Date(policy.startDate).toLocaleDateString("en-IN")} - ${new Date(policy.endDate).toLocaleDateString("en-IN")}`}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Plan</Text>
            <Text style={styles.detailValue}>{policy.planName}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Coverage per day</Text>
            <Text style={styles.detailValue}>{RUPEE}{policy.coveragePerDay}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Weekly premium</Text>
            <Text style={styles.detailValue}>{RUPEE}{policy.weeklyPremium}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Zone</Text>
            <Text style={styles.detailValue}>{policy.zone}</Text>
          </View>
        </View>
      </View>

      <View style={styles.triggersCard}>
        <Text style={styles.sectionTitle}>Triggers Covered</Text>
        <View style={styles.triggersList}>
          {triggerLabels.map((trigger) => (
            <TriggerItem key={trigger.key} icon={trigger.icon} label={trigger.label} />
          ))}
        </View>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={onRenew}
          disabled={loadingRenew}
          style={[styles.actionButton, styles.renewButton]}
        >
          {loadingRenew ? (
            <ActivityIndicator size="small" color={Neutral.white} />
          ) : (
            <>
              <Ionicons name="refresh-outline" size={16} color={Neutral.white} />
              <Text style={styles.actionButtonText}>Renew Policy</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.88}
          onPress={onCancel}
          disabled={loadingCancel}
          style={[styles.actionButton, styles.cancelButton]}
        >
          {loadingCancel ? (
            <ActivityIndicator size="small" color={Neutral.white} />
          ) : (
            <>
              <Ionicons name="close-circle-outline" size={16} color={Neutral.white} />
              <Text style={styles.actionButtonText}>Cancel Policy</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.lg,
  },
  statusCard: {
    backgroundColor: Neutral.white,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Brand.line,
    padding: Spacing.xl,
    gap: Spacing.lg,
    ...Shadow.sm,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusTitle: {
    fontFamily: Font.display,
    fontSize: 22,
    color: Neutral[900],
  },
  protectedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Brand.successLight,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  protectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Brand.success,
  },
  protectedText: {
    fontFamily: Font.semiBold,
    fontSize: 11,
    color: Brand.success,
    letterSpacing: 0.6,
  },
  detailGrid: {
    gap: 12,
  },
  detailItem: {
    borderBottomWidth: 1,
    borderBottomColor: Neutral[100],
    paddingBottom: 10,
  },
  detailLabel: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: Neutral[500],
    marginBottom: 2,
  },
  detailValue: {
    fontFamily: Font.semiBold,
    fontSize: 16,
    color: Neutral[900],
  },
  triggersCard: {
    backgroundColor: Neutral.white,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Brand.line,
    padding: Spacing.xl,
    ...Shadow.sm,
  },
  sectionTitle: {
    fontFamily: Font.display,
    fontSize: 20,
    color: Neutral[900],
    marginBottom: Spacing.md,
  },
  triggersList: {
    gap: 10,
  },
  triggerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  triggerIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Brand.surfaceTint,
    alignItems: "center",
    justifyContent: "center",
  },
  triggerLabel: {
    fontFamily: Font.medium,
    fontSize: 14,
    color: Neutral[700],
  },
  actionsRow: {
    gap: 10,
  },
  actionButton: {
    borderRadius: Radius.full,
    paddingVertical: 13,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  renewButton: {
    backgroundColor: Brand.primary,
  },
  cancelButton: {
    backgroundColor: Brand.danger,
  },
  actionButtonText: {
    fontFamily: Font.semiBold,
    fontSize: 14,
    color: Neutral.white,
  },
});
