import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Brand,
  Neutral,
  Radius,
  Spacing,
  Font,
  Shadow,
} from "@/constants/theme";
import { GigzoLockup } from "@/components/gigzo-ui";
import { useAppStore } from "@/store/useAppStore";
import { updateMyProfile } from "@/services/userApi";

const PLATFORMS = ["Zomato", "Swiggy", "Zepto", "Blinkit", "Amazon"];
const CITIES = [
  "Chandigarh",
  "Delhi",
  "Mumbai",
  "Bengaluru",
  "Hyderabad",
  "Pune",
];

export default function ProfileScreen() {
  const router = useRouter();
  const { setUser, user } = useAppStore();
  const [name, setName] = useState(user.name || "");
  const [platform, setPlatform] = useState(user.platform || "");
  const [city, setCity] = useState(user.city || "");
  const [zone, setZone] = useState(user.zone || "");
  const [type, setType] = useState<"full-time" | "part-time" | "">(
    user.type || "",
  );
  const [workerId, setWorkerId] = useState(user.workerId || "");
  const [pincode, setPincode] = useState(user.pincode || "");
  const [workingArea, setWorkingArea] = useState(user.workingArea || "");
  const [age, setAge] = useState(user.age ? String(user.age) : "");
  const [workingHoursPerDay, setWorkingHoursPerDay] = useState(
    user.workingHoursPerDay ? String(user.workingHoursPerDay) : "",
  );
  const [avgDailyEarning, setAvgDailyEarning] = useState(
    user.avgDailyEarning ? String(user.avgDailyEarning) : "",
  );
  const [coveragePerDay, setCoveragePerDay] = useState(
    user.coveragePerDay ? String(user.coveragePerDay) : "",
  );
  const [isSaving, setIsSaving] = useState(false);
  const canContinue =
    name.trim().length > 2 &&
    Boolean(platform) &&
    Boolean(city) &&
    Boolean(zone.trim()) &&
    Boolean(type);

  const handleSaveAndContinue = async () => {
    if (!canContinue || isSaving) {
      return;
    }

    try {
      setIsSaving(true);

      const profile = await updateMyProfile({
        name: name.trim(),
        platform: platform as
          | "Zomato"
          | "Swiggy"
          | "Zepto"
          | "Blinkit"
          | "Amazon",
        city: city.trim(),
        zone: zone.trim(),
        type: type as "full-time" | "part-time",
        workerId: workerId.trim() || undefined,
        pincode: pincode.trim() || undefined,
        workingArea: workingArea.trim() || undefined,
        age: age ? Number(age) : undefined,
        workingHoursPerDay: workingHoursPerDay
          ? Number(workingHoursPerDay)
          : undefined,
        avgDailyEarning: avgDailyEarning ? Number(avgDailyEarning) : undefined,
        coveragePerDay: coveragePerDay ? Number(coveragePerDay) : undefined,
      });

      setUser({
        id: profile.id,
        phone: profile.phone,
        name: profile.name || user.name,
        platform: profile.platform || user.platform,
        city: profile.city || user.city,
        zone: profile.zone || user.zone,
        coveragePerDay: profile.coveragePerDay || user.coveragePerDay,
        activePlan: profile.activePlan || user.activePlan,
        isProtected: profile.isProtected,
        workerId: profile.workerId,
        type: profile.type,
        pincode: profile.pincode,
        workingArea: profile.workingArea,
        age: profile.age,
        workingHoursPerDay: profile.workingHoursPerDay,
        avgDailyEarning: profile.avgDailyEarning,
      });

      router.push("/onboarding/risk-preview");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save profile.";
      Alert.alert("Save profile failed", message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.back} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={Neutral[700]} />
          </TouchableOpacity>
          <GigzoLockup compact />
        </View>

        {/* Step bar */}
        <View style={styles.stepRow}>
          {[1, 2, 3, 4].map((s) => (
            <View key={s} style={[styles.step, s <= 3 && styles.stepActive]} />
          ))}
        </View>

        <View style={styles.content}>
          <Text style={styles.label}>STEP 3 OF 4</Text>
          <Text style={styles.title}>Your Profile</Text>
          <Text style={styles.sub}>Tell us a bit about yourself</Text>

          {/* Name */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Arjun Sharma"
              value={name}
              onChangeText={setName}
              placeholderTextColor={Neutral[300]}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Worker Type</Text>
            <View style={styles.chips}>
              {[
                { label: "Full-time", value: "full-time" },
                { label: "Part-time", value: "part-time" },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.chip,
                    type === option.value && styles.chipActive,
                  ]}
                  onPress={() =>
                    setType(option.value as "full-time" | "part-time")
                  }
                >
                  <Text
                    style={[
                      styles.chipText,
                      type === option.value && styles.chipTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Platform */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Delivery Platform</Text>
            <View style={styles.chips}>
              {PLATFORMS.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.chip, platform === p && styles.chipActive]}
                  onPress={() => setPlatform(p)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      platform === p && styles.chipTextActive,
                    ]}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* City */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>City</Text>
            <View style={styles.chips}>
              {CITIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, city === c && styles.chipActive]}
                  onPress={() => setCity(c)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      city === c && styles.chipTextActive,
                    ]}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Delivery Partner ID</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. ZO-145782"
              value={workerId}
              onChangeText={setWorkerId}
              placeholderTextColor={Neutral[300]}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Age</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 24"
              keyboardType="number-pad"
              value={age}
              onChangeText={setAge}
              placeholderTextColor={Neutral[300]}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Pincode</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 160036"
              keyboardType="number-pad"
              value={pincode}
              onChangeText={setPincode}
              maxLength={6}
              placeholderTextColor={Neutral[300]}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Working Area</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. IT Park - Zirakpur stretch"
              value={workingArea}
              onChangeText={setWorkingArea}
              placeholderTextColor={Neutral[300]}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Working Hours / Day</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 10"
              keyboardType="number-pad"
              value={workingHoursPerDay}
              onChangeText={setWorkingHoursPerDay}
              placeholderTextColor={Neutral[300]}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Average Daily Earning (INR)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 1200"
              keyboardType="number-pad"
              value={avgDailyEarning}
              onChangeText={setAvgDailyEarning}
              placeholderTextColor={Neutral[300]}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Coverage Needed / Day (INR)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 500"
              keyboardType="number-pad"
              value={coveragePerDay}
              onChangeText={setCoveragePerDay}
              placeholderTextColor={Neutral[300]}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Delivery Zone</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Sector 35"
              value={zone}
              onChangeText={setZone}
              placeholderTextColor={Neutral[300]}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.cta, !canContinue && styles.ctaDisabled]}
          onPress={handleSaveAndContinue}
          disabled={!canContinue || isSaving}
        >
          <Text style={styles.ctaText}>
            {isSaving ? "Saving..." : "Continue"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Neutral.white },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  back: { padding: Spacing.sm },
  stepRow: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  step: { flex: 1, height: 3, borderRadius: 2, backgroundColor: Neutral[100] },
  stepActive: { backgroundColor: Brand.primary },
  content: { paddingHorizontal: Spacing.xl },
  label: {
    fontFamily: Font.bold,
    fontSize: 10,
    color: Brand.primary,
    letterSpacing: 1.5,
    marginBottom: Spacing.sm,
  },
  title: {
    fontFamily: Font.bold,
    fontSize: 28,
    color: Neutral[900],
    letterSpacing: -0.4,
    marginBottom: Spacing.sm,
  },
  sub: {
    fontFamily: Font.regular,
    fontSize: 14,
    color: Neutral[500],
    marginBottom: Spacing.xl,
  },

  field: { marginBottom: Spacing.xl },
  fieldLabel: {
    fontFamily: Font.semiBold,
    fontSize: 13,
    color: Neutral[700],
    marginBottom: Spacing.sm,
  },
  textInput: {
    fontFamily: Font.medium,
    fontSize: 15,
    color: Neutral[900],
    borderWidth: 1.5,
    borderColor: Neutral[200],
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Neutral[200],
  },
  chipActive: { backgroundColor: Brand.primary, borderColor: Brand.primary },
  chipText: { fontFamily: Font.medium, fontSize: 13, color: Neutral[600] },
  chipTextActive: { color: Neutral.white },
  mapBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Brand.primaryLight,
    backgroundColor: Brand.primaryLight,
    padding: Spacing.md,
  },
  mapBtnText: { fontFamily: Font.semiBold, fontSize: 14, color: Brand.primary },
  cta: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    backgroundColor: Brand.primary,
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: Radius.lg,
    ...Shadow.md,
  },
  ctaDisabled: { backgroundColor: Neutral[200] },
  ctaText: { fontFamily: Font.bold, fontSize: 16, color: Neutral.white },
});
