import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Brand, Neutral, Shadow, Radius, Spacing } from '@/constants/theme';
import { mockRiskZones } from '@/services/mockData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAP_HEIGHT = 280;

type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';

function riskColor(risk: RiskLevel): string {
  switch (risk) {
    case 'HIGH': return Brand.danger;
    case 'MEDIUM': return Brand.warning;
    case 'LOW': return Brand.success;
  }
}

function riskBg(risk: RiskLevel): string {
  switch (risk) {
    case 'HIGH': return Brand.dangerLight;
    case 'MEDIUM': return Brand.warningLight;
    case 'LOW': return Brand.successLight;
  }
}

// Simulated map with SVG-style zone cards
function MockMap({ selectedZone, onSelectZone }: {
  selectedZone: string | null;
  onSelectZone: (id: string) => void;
}) {
  // Simplified zone marker positions (relative percentages)
  const positions = [
    { id: 'z1', x: 0.36, y: 0.48 },
    { id: 'z2', x: 0.52, y: 0.26 },
    { id: 'z3', x: 0.62, y: 0.38 },
    { id: 'z4', x: 0.42, y: 0.72 },
    { id: 'z5', x: 0.75, y: 0.58 },
  ];

  return (
    <View style={styles.mapContainer}>
      {/* Grid overlay to simulate map */}
      <View style={styles.mapGrid}>
        {[...Array(6)].map((_, i) => (
          <View key={i} style={styles.mapGridRow} />
        ))}
      </View>
      {/* Road lines */}
      <View style={[styles.mapRoad, { top: '40%', left: 0, right: 0, height: 2 }]} />
      <View style={[styles.mapRoad, { top: 0, bottom: 0, left: '45%', width: 2 }]} />

      {/* Zone pins */}
      {mockRiskZones.map((zone) => {
        const pos = positions.find((p) => p.id === zone.id);
        if (!pos) return null;
        const isSelected = selectedZone === zone.id;
        return (
          <TouchableOpacity
            key={zone.id}
            style={[
              styles.zonePin,
              {
                left: `${pos.x * 100}%`,
                top: `${pos.y * 100}%`,
                backgroundColor: riskColor(zone.risk),
                borderWidth: isSelected ? 3 : 0,
                borderColor: Neutral.white,
                transform: [{ scale: isSelected ? 1.2 : 1 }],
              },
            ]}
            onPress={() => onSelectZone(zone.id)}
          >
            <Text style={styles.zonePinText}>{zone.risk[0]}</Text>
          </TouchableOpacity>
        );
      })}

      {/* Legend overlay */}
      <View style={styles.mapLegend}>
        {(['HIGH', 'MEDIUM', 'LOW'] as RiskLevel[]).map((risk) => (
          <View key={risk} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: riskColor(risk) }]} />
            <Text style={styles.legendText}>{risk}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ZoneDetail({ zoneId }: { zoneId: string | null }) {
  if (!zoneId) return null;
  const zone = mockRiskZones.find((z) => z.id === zoneId);
  if (!zone) return null;

  const color = riskColor(zone.risk);

  return (
    <View style={[styles.zoneDetail, { borderLeftColor: color }]}>
      <View style={styles.zoneDetailTop}>
        <View>
          <Text style={styles.zoneName}>{zone.name}</Text>
          <View style={[styles.riskBadge, { backgroundColor: riskBg(zone.risk) }]}>
            <View style={[styles.riskDot, { backgroundColor: color }]} />
            <Text style={[styles.riskBadgeText, { color }]}>{zone.risk} RISK</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Neutral[300]} />
      </View>
      <View style={styles.zoneStats}>
        <View style={styles.zoneStat}>
          <Ionicons name="rainy-outline" size={14} color={Brand.rain} />
          <Text style={styles.zoneStatText}>62mm avg rain/month</Text>
        </View>
        <View style={styles.zoneStat}>
          <Ionicons name="leaf-outline" size={14} color={Brand.aqi} />
          <Text style={styles.zoneStatText}>AQI peaks 380+</Text>
        </View>
        <View style={styles.zoneStat}>
          <Ionicons name="cash-outline" size={14} color={Brand.success} />
          <Text style={styles.zoneStatText}>Avg ₹1,200 payouts/month</Text>
        </View>
      </View>
    </View>
  );
}

export default function RiskMapScreen() {
  const [selectedZone, setSelectedZone] = useState<string | null>('z1');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Risk Map</Text>
          <Text style={styles.headerSub}>Tap a zone to see disruption details & payout history</Text>
        </View>

        {/* Map */}
        <MockMap selectedZone={selectedZone} onSelectZone={setSelectedZone} />

        {/* Zone detail */}
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Zone Details</Text>
          <ZoneDetail zoneId={selectedZone} />

          {/* Zone list */}
          <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>All Zones</Text>
          <View style={styles.zoneList}>
            {mockRiskZones.map((zone) => (
              <TouchableOpacity
                key={zone.id}
                style={[
                  styles.zoneListItem,
                  selectedZone === zone.id && styles.zoneListItemSelected,
                ]}
                onPress={() => setSelectedZone(zone.id)}
              >
                <View style={[styles.zoneDot, { backgroundColor: riskColor(zone.risk) }]} />
                <Text style={styles.zoneListName}>{zone.name}</Text>
                <View style={[styles.riskBadge, { backgroundColor: riskBg(zone.risk), marginLeft: 'auto' }]}>
                  <Text style={[styles.riskBadgeText, { color: riskColor(zone.risk) }]}>{zone.risk}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Info card */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={18} color={Brand.primary} />
            <Text style={styles.infoText}>
              Risk scores are recalculated daily using weather, air quality, and historical flood data.
            </Text>
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Neutral[50] },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },

  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    backgroundColor: Neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Neutral[100],
  },
  headerTitle: { fontSize: 28, fontWeight: '700', color: Neutral[900], letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: Neutral[500], marginTop: 4 },

  // Map
  mapContainer: {
    height: MAP_HEIGHT,
    backgroundColor: '#e8f4f0',
    position: 'relative',
    overflow: 'hidden',
  },
  mapGrid: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'column',
    justifyContent: 'space-evenly',
  },
  mapGridRow: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(2,85,93,0.08)',
  },
  mapRoad: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  zonePin: {
    position: 'absolute',
    width: 28, height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -14, marginTop: -14,
    ...Shadow.md,
  },
  zonePinText: { color: Neutral.white, fontSize: 11, fontWeight: '800' },
  mapLegend: {
    position: 'absolute',
    bottom: 12, right: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    gap: 4,
    ...Shadow.sm,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, fontWeight: '600', color: Neutral[700] },

  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Neutral[900], marginBottom: Spacing.md, letterSpacing: -0.3 },

  // Zone detail
  zoneDetail: {
    backgroundColor: Neutral.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderLeftWidth: 4,
    ...Shadow.sm,
  },
  zoneDetailTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  zoneName: { fontSize: 17, fontWeight: '700', color: Neutral[900], marginBottom: 6 },
  riskBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full, alignSelf: 'flex-start' },
  riskDot: { width: 7, height: 7, borderRadius: 3.5 },
  riskBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
  zoneStats: { gap: Spacing.sm },
  zoneStat: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  zoneStatText: { fontSize: 13, color: Neutral[600], fontWeight: '500' },

  // Zone list
  zoneList: {
    backgroundColor: Neutral.white,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  zoneListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Neutral[100],
  },
  zoneListItemSelected: { backgroundColor: Brand.primaryLight },
  zoneDot: { width: 10, height: 10, borderRadius: 5 },
  zoneListName: { fontSize: 14, fontWeight: '600', color: Neutral[800] },

  infoCard: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Brand.primaryLight,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  infoText: { flex: 1, fontSize: 12, color: Brand.primaryDark, lineHeight: 18, fontWeight: '500' },
});
