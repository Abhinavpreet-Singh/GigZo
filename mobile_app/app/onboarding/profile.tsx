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
import { Brand, Neutral, Shadow, Radius, Spacing } from '@/constants/theme';

const PLATFORMS = ['Zomato', 'Swiggy', 'Zepto', 'Blinkit', 'Amazon'];
const CITIES = ['Chandigarh', 'Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Pune'];

export default function ProfileScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  const canContinue = name.length > 2 && selectedPlatform && selectedCity;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Neutral[700]} />
        </TouchableOpacity>

        {/* Step indicator */}
        <View style={styles.stepRow}>
          {[1, 2, 3, 4].map((s) => (
            <View key={s} style={[styles.stepDot, s <= 3 && styles.stepDotActive]} />
          ))}
        </View>

        <View style={styles.content}>
          <Text style={styles.label2}>STEP 3 OF 4</Text>
          <Text style={styles.title}>Your Profile</Text>
          <Text style={styles.sub}>Help us personalize your coverage</Text>

          {/* Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Arjun Sharma"
              value={name}
              onChangeText={setName}
              placeholderTextColor={Neutral[300]}
            />
          </View>

          {/* Platform selector */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Delivery Platform</Text>
            <View style={styles.chipRow}>
              {PLATFORMS.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.chip, selectedPlatform === p && styles.chipActive]}
                  onPress={() => setSelectedPlatform(p)}
                >
                  <Text style={[styles.chipText, selectedPlatform === p && styles.chipTextActive]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* City selector */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>City</Text>
            <View style={styles.chipRow}>
              {CITIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, selectedCity === c && styles.chipActive]}
                  onPress={() => setSelectedCity(c)}
                >
                  <Text style={[styles.chipText, selectedCity === c && styles.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Delivery zone */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Delivery Zone</Text>
            <TouchableOpacity style={styles.mapSelectBtn}>
              <Ionicons name="map-outline" size={18} color={Brand.primary} />
              <Text style={styles.mapSelectText}>Select on map</Text>
              <Ionicons name="chevron-forward" size={16} color={Neutral[400]} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.ctaBtn, !canContinue && styles.ctaBtnDisabled]}
          onPress={() => canContinue && router.push('/onboarding/risk-preview')}
          activeOpacity={canContinue ? 0.88 : 1}
        >
          <Text style={styles.ctaBtnText}>Continue</Text>
          <Ionicons name="arrow-forward" size={18} color={Neutral.white} />
        </TouchableOpacity>
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Neutral.white },
  scroll: { flexGrow: 1, paddingBottom: 24 },
  back: { padding: Spacing.xl },
  stepRow: { flexDirection: 'row', gap: 6, paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl },
  stepDot: { height: 4, flex: 1, borderRadius: 2, backgroundColor: Neutral[200] },
  stepDotActive: { backgroundColor: Brand.primary },

  content: { paddingHorizontal: Spacing.xl },
  label2: { fontSize: 11, fontWeight: '700', color: Brand.primary, letterSpacing: 1.2, marginBottom: 6 },
  title: { fontSize: 28, fontWeight: '800', color: Neutral[900], letterSpacing: -0.5, marginBottom: 6 },
  sub: { fontSize: 14, color: Neutral[500], marginBottom: Spacing.xl },

  fieldGroup: { marginBottom: Spacing.xl },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: Neutral[700], marginBottom: Spacing.sm },
  textInput: {
    borderWidth: 1.5, borderColor: Neutral[200],
    borderRadius: Radius.lg, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: Neutral[900], fontWeight: '500',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: Radius.full,
    borderWidth: 1.5, borderColor: Neutral[200],
    backgroundColor: Neutral.white,
  },
  chipActive: { backgroundColor: Brand.primary, borderColor: Brand.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: Neutral[600] },
  chipTextActive: { color: Neutral.white },

  mapSelectBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderWidth: 1.5, borderColor: Brand.primaryLight,
    backgroundColor: Brand.primaryLight,
    borderRadius: Radius.lg, padding: Spacing.md,
  },
  mapSelectText: { fontSize: 14, fontWeight: '600', color: Brand.primary },

  ctaBtn: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    backgroundColor: Brand.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: 16, borderRadius: Radius.lg,
    ...Shadow.md,
  },
  ctaBtnDisabled: { backgroundColor: Neutral[200] },
  ctaBtnText: { fontSize: 16, fontWeight: '700', color: Neutral.white },
});
