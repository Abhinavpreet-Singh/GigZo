import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Brand, Neutral, Shadow, Radius, Spacing, Font } from '@/constants/theme';
import { mockRiskZones } from '@/services/mockData';

type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';

const riskColor = (r: RiskLevel) => ({ HIGH: Brand.danger, MEDIUM: Brand.warning, LOW: Brand.success }[r]);
const riskBg = (r: RiskLevel) => ({ HIGH: Brand.dangerLight, MEDIUM: Brand.warningLight, LOW: Brand.successLight }[r]);

// Simulated map placeholder
function MapView({ selectedZone, onSelect }: { selectedZone: string | null; onSelect: (id: string) => void }) {
  const positions = [
    { id: 'z1', x: 0.36, y: 0.48 },
    { id: 'z2', x: 0.52, y: 0.26 },
    { id: 'z3', x: 0.62, y: 0.38 },
    { id: 'z4', x: 0.42, y: 0.72 },
    { id: 'z5', x: 0.75, y: 0.58 },
  ];

  return (
    <View style={styles.mapWrap}>
      {[...Array(8)].map((_, i) => (
        <View key={i} style={[styles.gridLine, { top: `${(i + 1) * 12}%` as any }]} />
      ))}
      {[...Array(6)].map((_, i) => (
        <View key={i} style={[styles.gridLineV, { left: `${(i + 1) * 16}%` as any }]} />
      ))}
      <View style={[styles.road, { top: '40%', left: 0, right: 0, height: 2 }]} />
      <View style={[styles.road, { top: 0, bottom: 0, left: '45%', width: 2 }]} />
      {mockRiskZones.map((zone) => {
        const pos = positions.find((p) => p.id === zone.id);
        if (!pos) return null;
        const isSelected = selectedZone === zone.id;
        const color = riskColor(zone.risk);
        return (
          <TouchableOpacity
            key={zone.id}
            style={[styles.pin, {
              left: `${pos.x * 100}%` as any,
              top: `${pos.y * 100}%` as any,
              backgroundColor: color,
              borderWidth: isSelected ? 3 : 0,
              borderColor: Neutral.white,
              transform: [{ scale: isSelected ? 1.25 : 1 }],
            }]}
            onPress={() => onSelect(zone.id)}
          >
            <Text style={styles.pinText}>{zone.risk[0]}</Text>
          </TouchableOpacity>
        );
      })}
      {/* Legend */}
      <View style={styles.legend}>
        {(['HIGH', 'MEDIUM', 'LOW'] as RiskLevel[]).map((r) => (
          <View key={r} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: riskColor(r) }]} />
            <Text style={styles.legendLabel}>{r}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function RiskMapScreen() {
  const [selected, setSelected] = useState<string | null>('z1');
  const zone = mockRiskZones.find((z) => z.id === selected);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Risk Map</Text>
          <Text style={styles.headerSub}>Tap a zone to view disruption details</Text>
        </View>

        <MapView selectedZone={selected} onSelect={setSelected} />

        <View style={styles.content}>
          {/* Selected zone detail */}
          {zone && (
            <View style={[styles.zoneCard, { borderLeftColor: riskColor(zone.risk) }]}>
              <View style={styles.zoneCardTop}>
                <Text style={styles.zoneName}>{zone.name}</Text>
                <View style={[styles.riskBadge, { backgroundColor: riskBg(zone.risk) }]}>
                  <Text style={[styles.riskBadgeText, { color: riskColor(zone.risk) }]}>{zone.risk} RISK</Text>
                </View>
              </View>
              <View style={styles.zoneStats}>
                {[
                  { icon: 'rainy-outline', text: '62mm avg rain / month', color: Brand.rain },
                  { icon: 'leaf-outline', text: 'AQI peaks above 380', color: Brand.aqi },
                  { icon: 'cash-outline', text: 'Avg ₹1,200 payouts / month', color: Brand.success },
                ].map((s) => (
                  <View key={s.text} style={styles.zoneStat}>
                    <Ionicons name={s.icon as any} size={13} color={s.color} />
                    <Text style={styles.zoneStatText}>{s.text}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Zone list */}
          <Text style={[styles.listTitle, { marginTop: Spacing.xl }]}>All Zones</Text>
          <View style={styles.zoneList}>
            {mockRiskZones.map((z, idx) => (
              <View key={z.id}>
                <TouchableOpacity
                  style={[styles.zoneRow, selected === z.id && styles.zoneRowSelected]}
                  onPress={() => setSelected(z.id)}
                >
                  <View style={[styles.zoneDot, { backgroundColor: riskColor(z.risk) }]} />
                  <Text style={styles.zoneRowName}>{z.name}</Text>
                  <View style={[styles.riskBadge, { backgroundColor: riskBg(z.risk), marginLeft: 'auto' }]}>
                    <Text style={[styles.riskBadgeText, { color: riskColor(z.risk) }]}>{z.risk}</Text>
                  </View>
                </TouchableOpacity>
                {idx < mockRiskZones.length - 1 && <View style={styles.sep} />}
              </View>
            ))}
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={16} color={Brand.primary} />
            <Text style={styles.infoText}>Risk scores update daily using live weather and air quality data.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Neutral[50] },
  header: {
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.lg,
    backgroundColor: Neutral.white,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Neutral[200],
  },
  headerTitle: { fontFamily: Font.bold, fontSize: 26, color: Neutral[900], letterSpacing: -0.4 },
  headerSub: { fontFamily: Font.regular, fontSize: 13, color: Neutral[500], marginTop: 4 },

  mapWrap: { height: 260, backgroundColor: '#dff0ee', position: 'relative', overflow: 'hidden' },
  gridLine: { position: 'absolute', left: 0, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(2,85,93,0.1)' },
  gridLineV: { position: 'absolute', top: 0, bottom: 0, width: StyleSheet.hairlineWidth, backgroundColor: 'rgba(2,85,93,0.1)' },
  road: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.5)' },
  pin: {
    position: 'absolute', width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center', marginLeft: -13, marginTop: -13,
    ...Shadow.md,
  },
  pinText: { fontFamily: Font.bold, color: Neutral.white, fontSize: 10 },
  legend: {
    position: 'absolute', bottom: 10, right: 10,
    backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: Radius.md, padding: Spacing.sm, gap: 4,
    ...Shadow.xs,
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 3.5 },
  legendLabel: { fontFamily: Font.semiBold, fontSize: 10, color: Neutral[700] },

  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
  zoneCard: {
    backgroundColor: Neutral.white, borderRadius: Radius.lg, padding: Spacing.lg,
    borderLeftWidth: 4, ...Shadow.xs, borderWidth: 1, borderColor: Neutral[100],
    borderTopColor: Neutral[100], borderRightColor: Neutral[100], borderBottomColor: Neutral[100],
  },
  zoneCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  zoneName: { fontFamily: Font.bold, fontSize: 17, color: Neutral[900] },
  riskBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  riskBadgeText: { fontFamily: Font.bold, fontSize: 11, letterSpacing: 0.3 },
  zoneStats: { gap: Spacing.sm - 2 },
  zoneStat: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  zoneStatText: { fontFamily: Font.regular, fontSize: 13, color: Neutral[600] },

  listTitle: { fontFamily: Font.bold, fontSize: 16, color: Neutral[900], marginBottom: Spacing.md },
  zoneList: {
    backgroundColor: Neutral.white, borderRadius: Radius.lg,
    overflow: 'hidden', ...Shadow.xs, borderWidth: 1, borderColor: Neutral[100],
  },
  zoneRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
  zoneRowSelected: { backgroundColor: Brand.primaryLight },
  zoneDot: { width: 9, height: 9, borderRadius: 4.5 },
  zoneRowName: { fontFamily: Font.medium, fontSize: 14, color: Neutral[800] },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: Neutral[100] },

  infoCard: {
    flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start',
    backgroundColor: Brand.primaryLight, borderRadius: Radius.lg, padding: Spacing.md, marginTop: Spacing.lg,
  },
  infoText: { flex: 1, fontFamily: Font.regular, fontSize: 12, color: Brand.primaryDark, lineHeight: 18 },
});
