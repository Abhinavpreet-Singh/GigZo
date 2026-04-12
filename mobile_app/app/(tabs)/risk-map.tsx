import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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
import { ModernNavBar } from "@/components/ModernNavBar";
import {
  fetchLiveWeather,
  computeRiskLevel,
  fetchCityZones,
  type CityZone,
} from "@ai";
import { updateMyProfile } from "@/services/userApi";

type RiskLevel = "HIGH" | "MEDIUM" | "LOW";
type AlertType = "rain" | "aqi" | "heat";
type ZoneAlert = { type: AlertType; message: string; ago: string };

type RiskZone = {
  id: string;
  name: string;
  risk: RiskLevel;
  distanceKm: number;
  triggerHistory: { rain: number; aqi: number; heat: number };
  alerts: ZoneAlert[];
};

const riskColor = (risk: RiskLevel) =>
  ({ HIGH: Brand.danger, MEDIUM: Brand.warning, LOW: Brand.success })[risk];

const riskBg = (risk: RiskLevel) =>
  ({
    HIGH: Brand.dangerLight,
    MEDIUM: Brand.warningLight,
    LOW: Brand.successLight,
  })[risk];

function getAlertIcon(
  type: AlertType,
): React.ComponentProps<typeof Ionicons>["name"] {
  if (type === "rain") return "rainy-outline";
  if (type === "aqi") return "leaf-outline";
  return "thermometer-outline";
}

function HeatTrack({ value, color }: { value: number; color: string }) {
  return (
    <View style={styles.heatTrack}>
      <View
        style={[
          styles.heatFill,
          { width: `${Math.max(4, value)}%`, backgroundColor: color },
        ]}
      />
    </View>
  );
}

function MapCanvas({
  zones,
  selectedZone,
  onSelect,
  onCycle,
}: {
  zones: RiskZone[];
  selectedZone: string | null;
  onSelect: (id: string) => void;
  onCycle: () => void;
}) {
  const pulse = useRef(new Animated.Value(0)).current;
  const routePulse = useRef(new Animated.Value(0)).current;
  const scanLine = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1100,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1100,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulse]);

  useEffect(() => {
    Animated.loop(
      Animated.timing(routePulse, {
        toValue: 1,
        duration: 2400,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    ).start();

    Animated.loop(
      Animated.timing(scanLine, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [routePulse, scanLine]);

  const positions = [
    { x: 0.5, y: 0.48 },
    { x: 0.3, y: 0.28 },
    { x: 0.72, y: 0.3 },
    { x: 0.28, y: 0.72 },
    { x: 0.74, y: 0.7 },
  ];

  const selectedIndex = Math.max(
    0,
    zones.findIndex((zone) => zone.id === selectedZone),
  );
  const selectedPos = positions[selectedIndex % positions.length];

  const riderX = routePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [36, 36 + selectedPos.x * 250],
  });
  const riderY = routePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [32, 32 + selectedPos.y * 250],
  });

  return (
    <View style={styles.mapCard}>
      <View style={styles.mapTexture} />
      <View style={styles.mapGlowOne} />
      <View style={styles.mapGlowTwo} />

      {[0, 1, 2, 3, 4].map((line) => (
        <View
          key={`h-${line}`}
          style={[styles.mapLineH, { top: 30 + line * 43 }]}
        />
      ))}
      {[0, 1, 2, 3].map((line) => (
        <View
          key={`v-${line}`}
          style={[styles.mapLineV, { left: 46 + line * 72 }]}
        />
      ))}

      <View
        style={[styles.mapRoad, { top: 86, left: 20, right: 24, height: 2 }]}
      />
      <View
        style={[styles.mapRoad, { top: 34, bottom: 32, left: "49%", width: 2 }]}
      />

      <Animated.View
        style={[
          styles.scanLine,
          {
            transform: [
              {
                translateX: scanLine.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-130, 330],
                }),
              },
            ],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.riderMarker,
          {
            transform: [{ translateX: riderX }, { translateY: riderY }],
          },
        ]}
      >
        <Ionicons name="bicycle" size={12} color={Neutral.white} />
      </Animated.View>

      {zones.map((zone, index) => {
        const pos = positions[index % positions.length];
        const selected = selectedZone === zone.id;
        const color = riskColor(zone.risk);
        const heatScale =
          zone.risk === "HIGH" ? 1 : zone.risk === "MEDIUM" ? 0.8 : 0.65;

        return (
          <View key={zone.id} style={styles.zoneNodeWrap}>
            <View
              style={[
                styles.heatBlob,
                {
                  left: `${pos.x * 100}%`,
                  top: `${pos.y * 100}%`,
                  transform: [{ scale: heatScale }],
                  backgroundColor: `${color}33`,
                },
              ]}
            />

            {zone.id === "current-zone" ? (
              <View
                style={[
                  styles.currentPulseAnchor,
                  {
                    left: `${pos.x * 100}%`,
                    top: `${pos.y * 100}%`,
                  },
                ]}
              >
                <Animated.View
                  style={[
                    styles.currentPulse,
                    {
                      opacity: pulse.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.18, 0.45],
                      }),
                      transform: [
                        {
                          scale: pulse.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.9, 1.35],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              </View>
            ) : null}

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => onSelect(zone.id)}
              style={[
                styles.pin,
                {
                  left: `${pos.x * 100}%`,
                  top: `${pos.y * 100}%`,
                  backgroundColor: color,
                  transform: [{ scale: selected ? 1.14 : 1 }],
                  borderWidth: selected ? 3 : 0,
                },
              ]}
            >
              <Ionicons
                name={zone.id === "current-zone" ? "navigate" : "alert-circle"}
                size={13}
                color={Neutral.white}
              />
            </TouchableOpacity>

            <View
              style={[
                styles.zoneTag,
                { left: `${pos.x * 100}%`, top: `${pos.y * 100}%` },
              ]}
            >
              <Text numberOfLines={1} style={styles.zoneTagText}>
                {zone.name}
              </Text>
            </View>
          </View>
        );
      })}

      <View style={styles.legend}>
        {(["HIGH", "MEDIUM", "LOW"] as RiskLevel[]).map((risk) => (
          <View key={risk} style={styles.legendRow}>
            <View
              style={[styles.legendDot, { backgroundColor: riskColor(risk) }]}
            />
            <Text style={styles.legendText}>{risk}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onCycle}
        style={styles.simButton}
      >
        <Ionicons name="pulse" size={12} color={Brand.primaryDark} />
        <Text style={styles.simButtonText}>Simulate route</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function RiskMapScreen() {
  const { user, conditions, setConditions, setUser } = useAppStore();
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [zoneFeed, setZoneFeed] = useState<CityZone[] | null>(null);

  const refreshLiveConditions = useCallback(async () => {
    const city =
      user.city?.trim() || user.workingArea?.trim() || user.zone?.trim();
    if (!city) return;

    setSyncing(true);
    try {
      const data = await fetchLiveWeather(city);
      if (!data) return;

      const risk = computeRiskLevel(data);
      const updatedAt = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      setConditions({
        rainfall: {
          value: Math.round(data.rain_mm * 10) / 10,
          unit: "mm",
          threshold: 50,
          triggered: data.rain_mm >= 50,
        },
        aqi: {
          value: Math.round(data.aqi),
          unit: "",
          threshold: 350,
          triggered: data.aqi >= 350,
        },
        temperature: {
          value: Math.round(data.temperature * 10) / 10,
          unit: "°C",
          threshold: 42,
          triggered: data.temperature >= 42 || data.temperature <= 5,
        },
        windSpeed: {
          value: Math.round(data.wind_kph * 10) / 10,
          unit: "km/h",
          threshold: 60,
          triggered: data.wind_kph >= 60,
        },
        overallRisk: risk,
        status: `Live · Map · ${city} · updated ${updatedAt}`,
        isLive: true,
      });

      setLastSync(updatedAt);
    } finally {
      setSyncing(false);
    }
  }, [setConditions, user.city, user.workingArea, user.zone]);

  useEffect(() => {
    refreshLiveConditions();
    const timer = setInterval(() => refreshLiveConditions(), 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [refreshLiveConditions]);

  useEffect(() => {
    const loadZones = async () => {
      const city =
        user.city?.trim() || user.workingArea?.trim() || user.zone?.trim();
      if (!city) {
        setZoneFeed(null);
        return;
      }

      const result = await fetchCityZones(city);
      setZoneFeed(result?.zones ?? null);
    };

    loadZones();
  }, [lastSync, user.city, user.workingArea, user.zone]);

  const riskZones = useMemo<RiskZone[]>(() => {
    if (!zoneFeed?.length) return [];

    return zoneFeed.map((zone, index) => ({
      id: zone.id,
      name: zone.name,
      risk: zone.risk,
      distanceKm: zone.distance_km,
      triggerHistory: {
        rain: zone.trigger_history.rain,
        aqi: zone.trigger_history.aqi,
        heat: zone.trigger_history.heat,
      },
      alerts: zone.alerts.map((message, i) => {
        const lower = message.toLowerCase();
        const type: AlertType = lower.includes("aqi")
          ? "aqi"
          : lower.includes("heat")
            ? "heat"
            : "rain";
        return {
          type,
          message,
          ago: `${5 + index + i}m ago`,
        };
      }),
    }));
  }, [zoneFeed]);

  const [selected, setSelected] = useState<string | null>(null);

  const cycleSelection = useCallback(() => {
    if (!riskZones.length) return;
    const currentIndex = riskZones.findIndex((entry) => entry.id === selected);
    const nextIndex =
      currentIndex >= 0 ? (currentIndex + 1) % riskZones.length : 0;
    setSelected(riskZones[nextIndex].id);
  }, [riskZones, selected]);

  useEffect(() => {
    if (!riskZones.length) {
      setSelected(null);
      return;
    }

    if (!selected || !riskZones.some((entry) => entry.id === selected)) {
      setSelected("current-zone");
    }
  }, [riskZones, selected]);

  const selectedZone = riskZones.find((entry) => entry.id === selected) || null;

  useEffect(() => {
    if (!selectedZone) return;

    const persistZone = async () => {
      try {
        const cityBase = user.city || selectedZone.name.split(" ")[0];
        const profile = await updateMyProfile({
          city: cityBase,
          zone: selectedZone.name,
          workingArea: selectedZone.name,
        });

        setUser({
          city: profile.city || cityBase,
          zone: profile.zone || selectedZone.name,
          workingArea: profile.workingArea || selectedZone.name,
        });
      } catch {
        setUser({
          zone: selectedZone.name,
          workingArea: selectedZone.name,
        });
      }
    };

    persistZone();
  }, [selectedZone, setUser, user.city]);

  const nearbyAlerts = useMemo(
    () =>
      riskZones.flatMap((zone) =>
        zone.alerts.map((alert) => ({
          ...alert,
          zone: zone.name,
          distanceKm: zone.distanceKm,
          risk: zone.risk,
        })),
      ),
    [riskZones],
  );

  const suggestions = useMemo(() => {
    const highZones = riskZones.filter((zone) => zone.risk === "HIGH");
    const tips: string[] = [];

    if (highZones.length) {
      tips.push(
        `Avoid ${highZones.map((z) => z.name).join(", ")} until risk drops.`,
      );
    }
    if (conditions.aqi.triggered) {
      tips.push("Use mask and reduce wait time near congested roads.");
    }
    if (conditions.rainfall.triggered) {
      tips.push("Prefer covered routes and avoid underpasses in heavy rain.");
    }
    if (!tips.length) {
      tips.push("Primary zone is stable. Keep monitoring every 5 minutes.");
    }

    return tips.slice(0, 3);
  }, [conditions.aqi.triggered, conditions.rainfall.triggered, riskZones]);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ModernNavBar
        title="Risk Map"
        showLogo={false}
        backgroundColor={Brand.canvasStrong}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Map intelligence</Text>
          <Text style={styles.heroTitle}>Interactive city risk heatmap</Text>
          <Text style={styles.heroSub}>
            Zones are auto-generated for your city (Core/North/South/East/West)
            using live weather + AQI for each zone.
          </Text>

          <View style={styles.liveRow}>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveBadgeText}>
                {conditions.isLive ? "LIVE CONNECTED" : "SYNC PENDING"}
              </Text>
              {syncing ? (
                <ActivityIndicator size="small" color={Brand.primary} />
              ) : null}
            </View>
            <TouchableOpacity
              style={styles.refreshButton}
              activeOpacity={0.85}
              onPress={refreshLiveConditions}
            >
              <Ionicons name="refresh" size={14} color={Neutral.white} />
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        </View>

        <MapCanvas
          zones={riskZones}
          selectedZone={selected}
          onSelect={setSelected}
          onCycle={cycleSelection}
        />

        <View style={styles.zoneChipRow}>
          {riskZones.map((zone) => (
            <TouchableOpacity
              key={`chip-${zone.id}`}
              onPress={() => setSelected(zone.id)}
              activeOpacity={0.85}
              style={[
                styles.zoneChip,
                selected === zone.id && styles.zoneChipSelected,
              ]}
            >
              <Text
                style={[
                  styles.zoneChipText,
                  selected === zone.id && styles.zoneChipTextSelected,
                ]}
              >
                {zone.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedZone ? (
          <View style={styles.card}>
            <View style={styles.zoneHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>Current location pin</Text>
                <Text style={styles.zoneTitle}>{selectedZone.name}</Text>
                <Text style={styles.zoneDistance}>
                  {selectedZone.distanceKm.toFixed(1)} km from city center
                </Text>
              </View>
              <View
                style={[
                  styles.riskPill,
                  { backgroundColor: riskBg(selectedZone.risk) },
                ]}
              >
                <Text
                  style={[
                    styles.riskPillText,
                    { color: riskColor(selectedZone.risk) },
                  ]}
                >
                  {selectedZone.risk} risk
                </Text>
              </View>
            </View>

            <View style={styles.statGrid}>
              <View style={styles.statTile}>
                <Text style={styles.statTileLabel}>Rain</Text>
                <Text style={styles.statTileValue}>
                  {conditions.rainfall.value}
                  {conditions.rainfall.unit}
                </Text>
              </View>
              <View style={styles.statTile}>
                <Text style={styles.statTileLabel}>AQI</Text>
                <Text style={styles.statTileValue}>{conditions.aqi.value}</Text>
              </View>
              <View style={styles.statTile}>
                <Text style={styles.statTileLabel}>Temp</Text>
                <Text style={styles.statTileValue}>
                  {conditions.temperature.value}
                  {conditions.temperature.unit}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.sectionEyebrow}>Nearby disruption alerts</Text>
          <Text style={styles.sectionTitle}>Live alerts around your route</Text>

          <View style={styles.alertList}>
            {nearbyAlerts.length ? (
              nearbyAlerts.slice(0, 5).map((alert, index) => (
                <View
                  key={`${alert.zone}-${alert.type}-${index}`}
                  style={styles.alertRow}
                >
                  <View
                    style={[
                      styles.alertIcon,
                      { backgroundColor: `${riskColor(alert.risk)}18` },
                    ]}
                  >
                    <Ionicons
                      name={getAlertIcon(alert.type)}
                      size={16}
                      color={riskColor(alert.risk)}
                    />
                  </View>
                  <View style={styles.alertCopy}>
                    <Text style={styles.alertTitle}>{alert.message}</Text>
                    <Text style={styles.alertMeta}>
                      {alert.zone} · {alert.distanceKm.toFixed(1)} km ·{" "}
                      {alert.ago}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyZoneState}>
                <Text style={styles.emptyZoneText}>
                  No active disruption alerts nearby.
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionEyebrow}>Zone-wise trigger history</Text>
          <Text style={styles.sectionTitle}>
            Rain, AQI, and heat trigger intensity
          </Text>

          <View style={styles.historyList}>
            {riskZones.map((zone) => (
              <TouchableOpacity
                key={zone.id}
                activeOpacity={0.85}
                onPress={() => setSelected(zone.id)}
                style={[
                  styles.zoneHistoryRow,
                  selected === zone.id && styles.zoneHistoryRowSelected,
                ]}
              >
                <View style={styles.zoneHistoryHeader}>
                  <Text style={styles.zoneHistoryName}>{zone.name}</Text>
                  <Text style={styles.zoneHistoryRisk}>{zone.risk}</Text>
                </View>

                <View style={styles.historyMetric}>
                  <Text style={styles.historyMetricLabel}>Rain</Text>
                  <HeatTrack
                    value={zone.triggerHistory.rain}
                    color={Brand.rain}
                  />
                </View>
                <View style={styles.historyMetric}>
                  <Text style={styles.historyMetricLabel}>AQI</Text>
                  <HeatTrack
                    value={zone.triggerHistory.aqi}
                    color={Brand.aqi}
                  />
                </View>
                <View style={styles.historyMetric}>
                  <Text style={styles.historyMetricLabel}>Heat</Text>
                  <HeatTrack
                    value={zone.triggerHistory.heat}
                    color={Brand.warning}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionEyebrow}>Safety suggestions</Text>
          <Text style={styles.sectionTitle}>Avoid high risk areas</Text>

          <View style={styles.suggestionList}>
            {suggestions.map((suggestion, index) => (
              <View key={`suggestion-${index}`} style={styles.suggestionRow}>
                <Ionicons
                  name="navigate-circle"
                  size={16}
                  color={Brand.primary}
                />
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </View>
            ))}
          </View>

          <View style={styles.infoStrip}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={Brand.primary}
            />
            <Text style={styles.infoText}>
              {conditions.status}
              {lastSync ? ` · Last sync ${lastSync}` : ""}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.canvas,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: 140,
    gap: Spacing.lg,
  },
  heroCard: {
    backgroundColor: Neutral.white,
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Brand.line,
    ...Shadow.sm,
  },
  heroEyebrow: {
    fontFamily: Font.semiBold,
    fontSize: 11,
    color: Neutral[500],
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  heroTitle: {
    fontFamily: Font.display,
    fontSize: 26,
    lineHeight: 32,
    color: Neutral[900],
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  heroSub: {
    fontFamily: Font.medium,
    fontSize: 14,
    lineHeight: 21,
    color: Neutral[500],
  },
  liveRow: {
    marginTop: Spacing.md,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.sm,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Brand.surfaceTint,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: Brand.line,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Brand.success,
  },
  liveBadgeText: {
    fontFamily: Font.semiBold,
    fontSize: 11,
    color: Brand.primaryDark,
    letterSpacing: 0.3,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Brand.primary,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...Shadow.xs,
  },
  refreshButtonText: {
    fontFamily: Font.semiBold,
    fontSize: 11,
    color: Neutral.white,
    letterSpacing: 0.2,
  },
  mapCard: {
    height: 320,
    backgroundColor: "#D7EDEE",
    borderRadius: Radius.xxl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(14,94,103,0.08)",
    ...Shadow.md,
  },
  mapTexture: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  mapGlowOne: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(255,255,255,0.34)",
    top: -90,
    right: -60,
  },
  mapGlowTwo: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(14,94,103,0.10)",
    bottom: -60,
    left: -35,
  },
  mapLineH: {
    position: "absolute",
    left: 20,
    right: 20,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(14,94,103,0.10)",
  },
  mapLineV: {
    position: "absolute",
    top: 20,
    bottom: 20,
    width: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(14,94,103,0.10)",
  },
  mapRoad: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.58)",
    borderRadius: Radius.full,
  },
  scanLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 46,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  riderMarker: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    marginLeft: -12,
    marginTop: -12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Brand.primary,
    ...Shadow.sm,
  },
  currentPulseAnchor: {
    position: "absolute",
    width: 0,
    height: 0,
  },
  zoneNodeWrap: {
    position: "absolute",
  },
  heatBlob: {
    position: "absolute",
    width: 95,
    height: 95,
    borderRadius: 48,
    marginLeft: -48,
    marginTop: -48,
  },
  currentPulse: {
    position: "absolute",
    width: 52,
    height: 52,
    borderRadius: 26,
    marginLeft: -26,
    marginTop: -26,
    backgroundColor: `${Brand.primary}55`,
  },
  pin: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -16,
    marginTop: -16,
    borderColor: Neutral.white,
    ...Shadow.md,
  },
  zoneTag: {
    position: "absolute",
    marginLeft: -46,
    marginTop: 18,
    width: 92,
    alignItems: "center",
  },
  zoneTagText: {
    fontFamily: Font.semiBold,
    fontSize: 10,
    color: Neutral[800],
    backgroundColor: "rgba(255,255,255,0.80)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  legend: {
    position: "absolute",
    right: 14,
    bottom: 14,
    backgroundColor: "rgba(255,255,255,0.86)",
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    gap: 6,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontFamily: Font.semiBold,
    fontSize: 10,
    color: Neutral[700],
  },
  simButton: {
    position: "absolute",
    left: 14,
    bottom: 14,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Brand.line,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  simButtonText: {
    fontFamily: Font.semiBold,
    fontSize: 11,
    color: Brand.primaryDark,
  },
  zoneChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: -4,
  },
  zoneChip: {
    backgroundColor: Neutral.white,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  zoneChipSelected: {
    backgroundColor: Brand.primaryLight,
    borderColor: `${Brand.primary}50`,
  },
  zoneChipText: {
    fontFamily: Font.semiBold,
    fontSize: 11,
    color: Neutral[700],
  },
  zoneChipTextSelected: {
    color: Brand.primaryDark,
  },
  card: {
    backgroundColor: Neutral.white,
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Brand.line,
    ...Shadow.sm,
  },
  sectionEyebrow: {
    fontFamily: Font.semiBold,
    fontSize: 11,
    color: Neutral[500],
    letterSpacing: 1.1,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  sectionTitle: {
    fontFamily: Font.semiBold,
    fontSize: 22,
    color: Neutral[900],
    letterSpacing: -0.6,
    marginBottom: Spacing.lg,
  },
  zoneHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  zoneTitle: {
    fontFamily: Font.display,
    fontSize: 24,
    color: Neutral[900],
    letterSpacing: -0.7,
  },
  zoneDistance: {
    marginTop: 4,
    fontFamily: Font.medium,
    fontSize: 12,
    color: Neutral[500],
  },
  riskPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  riskPillText: {
    fontFamily: Font.semiBold,
    fontSize: 12,
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  statTile: {
    minWidth: "31%",
    flexGrow: 1,
    backgroundColor: Brand.surfaceAlt,
    borderRadius: Radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  statTileLabel: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: Neutral[500],
  },
  statTileValue: {
    marginTop: 2,
    fontFamily: Font.bold,
    fontSize: 17,
    color: Neutral[900],
  },
  alertList: {
    gap: 10,
  },
  alertRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: Radius.lg,
    backgroundColor: Brand.surfaceAlt,
  },
  alertIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  alertCopy: {
    flex: 1,
  },
  alertTitle: {
    fontFamily: Font.semiBold,
    fontSize: 13,
    color: Neutral[900],
  },
  alertMeta: {
    marginTop: 2,
    fontFamily: Font.medium,
    fontSize: 12,
    color: Neutral[500],
  },
  historyList: {
    gap: 10,
  },
  zoneHistoryRow: {
    padding: 12,
    borderRadius: Radius.lg,
    backgroundColor: Brand.surfaceAlt,
    borderWidth: 1,
    borderColor: "transparent",
  },
  zoneHistoryRowSelected: {
    borderColor: `${Brand.primary}35`,
    backgroundColor: Brand.primaryLight,
  },
  zoneHistoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  zoneHistoryName: {
    fontFamily: Font.semiBold,
    fontSize: 13,
    color: Neutral[900],
  },
  zoneHistoryRisk: {
    fontFamily: Font.bold,
    fontSize: 11,
    color: Brand.primaryDark,
  },
  historyMetric: {
    marginTop: 6,
  },
  historyMetricLabel: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: Neutral[600],
    marginBottom: 4,
  },
  heatTrack: {
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: Neutral[200],
    overflow: "hidden",
  },
  heatFill: {
    height: "100%",
    borderRadius: Radius.full,
  },
  suggestionList: {
    gap: 10,
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: Brand.surfaceAlt,
    borderRadius: Radius.lg,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  suggestionText: {
    flex: 1,
    fontFamily: Font.medium,
    fontSize: 13,
    lineHeight: 20,
    color: Neutral[700],
  },
  infoStrip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: Brand.surfaceTint,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  infoText: {
    flex: 1,
    fontFamily: Font.medium,
    fontSize: 12,
    lineHeight: 19,
    color: Brand.primaryDark,
  },
  emptyZoneState: {
    backgroundColor: Brand.surfaceAlt,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Brand.line,
  },
  emptyZoneText: {
    fontFamily: Font.medium,
    fontSize: 13,
    lineHeight: 20,
    color: Neutral[500],
    textAlign: "center",
  },
});
