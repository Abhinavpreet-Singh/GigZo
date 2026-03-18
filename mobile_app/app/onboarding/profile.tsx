import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Brand, Neutral, Radius, Spacing, Font, Shadow } from '@/constants/theme';

const PLATFORMS = ['Zomato', 'Swiggy', 'Zepto', 'Blinkit', 'Amazon'];
const CITIES = ['Chandigarh', 'Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Pune'];

export default function ProfileScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState('');
  const [city, setCity] = useState('');
  const canContinue = name.length > 2 && platform && city;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Neutral[700]} />
        </TouchableOpacity>

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

          {/* Platform */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Delivery Platform</Text>
            <View style={styles.chips}>
              {PLATFORMS.map((p) => (
                <TouchableOpacity
                  key={p} style={[styles.chip, platform === p && styles.chipActive]}
                  onPress={() => setPlatform(p)}
                >
                  <Text style={[styles.chipText, platform === p && styles.chipTextActive]}>{p}</Text>
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
                  key={c} style={[styles.chip, city === c && styles.chipActive]}
                  onPress={() => setCity(c)}
                >
                  <Text style={[styles.chipText, city === c && styles.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Delivery Zone */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Delivery Zone</Text>
            <TouchableOpacity style={styles.mapBtn}>
              <Ionicons name="map-outline" size={16} color={Brand.primary} />
              <Text style={styles.mapBtnText}>Select zone on map</Text>
              <Ionicons name="chevron-forward" size={14} color={Neutral[300]} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.cta, !canContinue && styles.ctaDisabled]}
          onPress={() => canContinue && router.push('/onboarding/risk-preview')}
        >
          <Text style={styles.ctaText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Neutral.white },
  back: { padding: Spacing.xl },
  stepRow: { flexDirection: 'row', gap: 6, paddingHorizontal: Spacing.xl, marginBottom: Spacing.xxl },
  step: { flex: 1, height: 3, borderRadius: 2, backgroundColor: Neutral[100] },
  stepActive: { backgroundColor: Brand.primary },
  content: { paddingHorizontal: Spacing.xl },
  label: { fontFamily: Font.bold, fontSize: 10, color: Brand.primary, letterSpacing: 1.5, marginBottom: Spacing.sm },
  title: { fontFamily: Font.bold, fontSize: 28, color: Neutral[900], letterSpacing: -0.4, marginBottom: Spacing.sm },
  sub: { fontFamily: Font.regular, fontSize: 14, color: Neutral[500], marginBottom: Spacing.xl },

  field: { marginBottom: Spacing.xl },
  fieldLabel: { fontFamily: Font.semiBold, fontSize: 13, color: Neutral[700], marginBottom: Spacing.sm },
  textInput: {
    fontFamily: Font.medium, fontSize: 15, color: Neutral[900],
    borderWidth: 1.5, borderColor: Neutral[200],
    borderRadius: Radius.lg, paddingHorizontal: 14, paddingVertical: 14,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: Radius.full,
    borderWidth: 1.5, borderColor: Neutral[200],
  },
  chipActive: { backgroundColor: Brand.primary, borderColor: Brand.primary },
  chipText: { fontFamily: Font.medium, fontSize: 13, color: Neutral[600] },
  chipTextActive: { color: Neutral.white },
  mapBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Brand.primaryLight,
    backgroundColor: Brand.primaryLight, padding: Spacing.md,
  },
  mapBtnText: { fontFamily: Font.semiBold, fontSize: 14, color: Brand.primary },
  cta: {
    marginHorizontal: Spacing.xl, marginTop: Spacing.lg,
    backgroundColor: Brand.primary, alignItems: 'center', paddingVertical: 16,
    borderRadius: Radius.lg, ...Shadow.md,
  },
  ctaDisabled: { backgroundColor: Neutral[200] },
  ctaText: { fontFamily: Font.bold, fontSize: 16, color: Neutral.white },
});
