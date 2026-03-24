import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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

export default function OTPScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState("");

  const normalizedPhone = useMemo(() => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) {
      return "";
    }

    return `+91${digits}`;
  }, [phone]);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
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
              <View
                key={s}
                style={[styles.step, s <= 1 && styles.stepActive]}
              />
            ))}
          </View>

          <View style={styles.content}>
            <Text style={styles.label}>STEP 1 OF 4</Text>
            <Text style={styles.title}>Phone Number</Text>
            <Text style={styles.sub}>Add your contact number to continue</Text>

            <View style={styles.phoneInput}>
              <Text style={styles.prefix}>+91</Text>
              <TextInput
                style={styles.input}
                placeholder="98765 43210"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                maxLength={10}
                placeholderTextColor={Neutral[300]}
              />
            </View>
            <TouchableOpacity
              style={[styles.cta, !normalizedPhone && styles.ctaDisabled]}
              onPress={() => router.push("/onboarding/profile")}
              disabled={!normalizedPhone}
            >
              <Text style={styles.ctaText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    marginBottom: Spacing.xxxl,
  },
  phoneInput: {
    flexDirection: "row",
    borderWidth: 1.5,
    borderColor: Neutral[200],
    borderRadius: Radius.lg,
    overflow: "hidden",
    marginBottom: Spacing.xl,
  },
  prefix: {
    fontFamily: Font.semiBold,
    fontSize: 15,
    color: Neutral[700],
    paddingHorizontal: 14,
    paddingVertical: 15,
    backgroundColor: Neutral[50],
    borderRightWidth: 1,
    borderRightColor: Neutral[200],
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 15,
    fontFamily: Font.semiBold,
    fontSize: 16,
    color: Neutral[900],
  },
  cta: {
    backgroundColor: Brand.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: Radius.lg,
    ...Shadow.md,
  },
  ctaDisabled: { backgroundColor: Neutral[200] },
  ctaText: { fontFamily: Font.bold, fontSize: 16, color: Neutral.white },
});
