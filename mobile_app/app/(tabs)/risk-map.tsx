import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
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
  type LiveWeatherData,
} from "@ai";

type RiskLevel = "HIGH" | "MEDIUM" | "LOW";

const RUPEE = "\u20B9";

const riskColor = (risk: RiskLevel) =>
  ({ HIGH: Brand.danger, MEDIUM: Brand.warning, LOW: Brand.success })[risk];

const riskBg = (risk: RiskLevel) =>
  ({
    HIGH: Brand.dangerLight,
    MEDIUM: Brand.warningLight,
    LOW: Brand.successLight,
  })[risk];

function getWeatherIcon(data: LiveWeatherData | null): string {
  if (!data) return "cloud-outline";
  if (data.rain_mm >= 20) return "thunderstorm-outline";
  if (data.rain_mm >= 5) return "rainy-outline";
  if (data.aqi >= 300) return "warning-outline";
  if (data.temperature >= 38) return "sunny-outline";
  if (data.temperature <= 10) return "snow-outline";
  if (data.wind_kph >= 50) return "flag-outline";
  return "partly-sunny-outline";
}

function getWeatherSummary(data: LiveWeatherData | null): string {
  if (!data) return "Weather data unavailable";
  const parts: string[] = [];

  if (data.rain_mm >= 50) parts.push("Heavy rainfall");
  else if (data.rain_mm >= 20) parts.push("Moderate rain");
  else if (data.rain_mm >= 5) parts.push("Light rain");

  if (data.aqi >= 350) parts.push("Hazardous air quality");
  else if (data.aqi >= 200) parts.push("Poor air quality");

  if (data.temperature >= 42) parts.push("Extreme heat");
  else if (data.temperature <= 5) parts.push("Extreme cold");

  if (data.wind_kph >= 60) parts.push("Strong winds");

  if (parts.length === 0) return "Conditions are normal";
  return parts.join(" · ");
}

function MapView({
  zones,
  selectedZone,
  onSelect,
}: {
  zones: { id: string; name: string; risk: RiskLevel }[];
  selectedZone: string | null;
  onSelect: (id: string) => void;
}) {
  const positions = [
    { x: 0.24, y: 0.42 },
    { x: 0.54, y: 0.2 },
    { x: 0.68, y: 0.36 },
    { x: 0.4, y: 0.72 },
    { x: 0.8, y: 0.54 },
  ];

  return (
    <View style={styles.mapCard}>
      <View style={styles.mapGlowOne} />
      <View style={styles.mapGlowTwo} />

      {[0, 1, 2, 3, 4].map((line) => (
        <View key={`h-${line}`} style={[styles.mapLineH, { top: 32 + line * 42 }]} />
      ))}
      {[0, 1, 2, 3].map((line) => (
        <View key={`v-${line}`} style={[styles.mapLineV, { left: 44 + line * 72 }]} />
      ))}

      <View style={[styles.mapRoad, { top: 84, left: 18, right: 24, height: 2 }]} />
      <View style={[styles.mapRoad, { top: 46, bottom: 28, left: "45%", width: 2 }]} />

      {zones.map((zone, index) => {
        const pos = positions[index % positions.length];
        const selected = selectedZone === zone.id;

        return (
          <TouchableOpacity
            key={zone.id}
            activeOpacity={0.9}
            onPress={() => onSelect(zone.id)}
            style={[
              styles.pin,
              {
                left: `${pos.x * 100}%`,
                top: `${pos.y * 100}%`,
                backgroundColor: riskColor(zone.risk),
                transform: [{ scale: selected ? 1.2 : 1 }],
                borderWidth: selected ? 4 : 0,
              },
            ]}
          >
            <Text style={styles.pinText}>{zone.risk[0]}</Text>
          </TouchableOpacity>
        );
      })}

      <View style={styles.legend}>
        {(["HIGH", "MEDIUM", "LOW"] as RiskLevel[]).map((risk) => (
          <View key={risk} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: riskColor(risk) }]} />
            <Text style={styles.legendText}>{risk}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function RiskMapScreen() {
  const { user, conditions, earnings, setConditions } = useAppStore();
  const [weatherData, setWeatherData] = useState<LiveWeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const riskZones = useMemo(
    () =>
      user.zone
        ? [
            {
              id: "current-zone",
              name: user.zone,
              risk: conditions.overallRisk,
            },
          ]
        : [],
    [conditions.overallRisk, user.zone],
  );
  const [selected, setSelected] = useState<string | null>(riskZones[0]?.id || null);

  const fetchWeather = useCallback(async () => {
    const city = user.city;
    if (!city) {
      setError("Set your city in profile to enable live weather.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchLiveWeather(city);

      if (data) {
        setWeatherData(data);
        setLastUpdated(new Date());

        const risk = computeRiskLevel(data);

        // Update global conditions store
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
          status: `Live conditions for ${city} updated at ${new Date().toLocaleTimeString()}.`,
          isLive: true,
        });
      } else {
        setError("Could not fetch weather data. Will retry automatically.");
      }
    } catch (err) {
      setError("Weather service temporarily unavailable.");
      console.error("Weather fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [user.city, setConditions]);

  // Fetch weather on mount and when city changes
  useEffect(() => {
    fetchWeather();

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchWeather, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  useEffect(() => {
    if (!riskZones.length) {
      setSelected(null);
      return;
    }

    if (!selected || !riskZones.some((entry) => entry.id === selected)) {
      setSelected(riskZones[0].id);
    }
  }, [riskZones, selected]);

  const zone = riskZones.find((entry) => entry.id === selected);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ModernNavBar title="Risk Map" showLogo={false} backgroundColor={Brand.canvasStrong} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Zone intelligence</Text>
          <Text style={styles.heroTitle}>Live weather conditions & risk signals.</Text>
          <Text style={styles.heroSub}>
            Real-time weather data for your zone, powered by the GigZo AI engine.
          </Text>
        </View>

        <MapView zones={riskZones} selectedZone={selected} onSelect={setSelected} />

        {/* ── Live Weather Summary Card ── */}
        {user.city ? (
          <View style={styles.weatherCard}>
            <View style={styles.weatherCardHeader}>
              <View style={styles.weatherIconBox}>
                <Ionicons
                  name={getWeatherIcon(weatherData) as any}
                  size={28}
                  color={Neutral.white}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.weatherCityText}>{user.city}</Text>
                <Text style={styles.weatherSummaryText}>
                  {loading ? "Fetching conditions..." : getWeatherSummary(weatherData)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={fetchWeather}
                disabled={loading}
                style={styles.refreshBtn}
                activeOpacity={0.7}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={Neutral.white} />
                ) : (
                  <Ionicons name="refresh-outline" size={20} color={Neutral.white} />
                )}
              </TouchableOpacity>
            </View>

            {weatherData && (
              <View style={styles.weatherMetricsRow}>
                <View style={styles.weatherMetric}>
                  <Ionicons name="thermometer-outline" size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.weatherMetricValue}>
                    {weatherData.temperature.toFixed(1)}°C
                  </Text>
                  <Text style={styles.weatherMetricLabel}>Temp</Text>
                </View>
                <View style={styles.weatherMetricDivider} />
                <View style={styles.weatherMetric}>
                  <Ionicons name="rainy-outline" size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.weatherMetricValue}>
                    {weatherData.rain_mm.toFixed(1)}mm
                  </Text>
                  <Text style={styles.weatherMetricLabel}>Rain</Text>
                </View>
                <View style={styles.weatherMetricDivider} />
                <View style={styles.weatherMetric}>
                  <Ionicons name="speedometer-outline" size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.weatherMetricValue}>
                    {weatherData.wind_kph.toFixed(1)}
                  </Text>
                  <Text style={styles.weatherMetricLabel}>Wind km/h</Text>
                </View>
                <View style={styles.weatherMetricDivider} />
                <View style={styles.weatherMetric}>
                  <Ionicons name="leaf-outline" size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.weatherMetricValue}>
                    {Math.round(weatherData.aqi)}
                  </Text>
                  <Text style={styles.weatherMetricLabel}>AQI</Text>
                </View>
              </View>
            )}

            {lastUpdated && (
              <Text style={styles.weatherTimestamp}>
                Last updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
            )}
          </View>
        ) : null}

        {/* ── Error State ── */}
        {error ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={18} color={Brand.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* ── Selected Zone Detail ── */}
        {zone ? (
          <View style={styles.card}>
            <View style={styles.zoneHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>Selected zone</Text>
                <Text style={styles.zoneTitle}>{zone.name}</Text>
              </View>
              <View style={[styles.riskPill, { backgroundColor: riskBg(zone.risk) }]}>
                <Text style={[styles.riskPillText, { color: riskColor(zone.risk) }]}>
                  {zone.risk} risk
                </Text>
              </View>
            </View>

            <View style={styles.zoneStats}>
              {[
                {
                  icon: "rainy-outline",
                  title: "Rain exposure",
                  value:
                    `${conditions.rainfall.value}${conditions.rainfall.unit} current ` +
                    `(threshold ${conditions.rainfall.threshold}${conditions.rainfall.unit})`,
                  color: Brand.rain,
                  triggered: conditions.rainfall.triggered,
                },
                {
                  icon: "leaf-outline",
                  title: "Air quality",
                  value: `AQI ${conditions.aqi.value} (threshold ${conditions.aqi.threshold})`,
                  color: Brand.aqi,
                  triggered: conditions.aqi.triggered,
                },
                {
                  icon: "thermometer-outline",
                  title: "Temperature",
                  value:
                    `${conditions.temperature.value}${conditions.temperature.unit} current ` +
                    `(threshold ${conditions.temperature.threshold}${conditions.temperature.unit})`,
                  color: Brand.primaryMid,
                  triggered: conditions.temperature.triggered,
                },
                {
                  icon: "speedometer-outline",
                  title: "Wind speed",
                  value:
                    `${conditions.windSpeed.value}${conditions.windSpeed.unit} current ` +
                    `(threshold ${conditions.windSpeed.threshold}${conditions.windSpeed.unit})`,
                  color: Brand.flood,
                  triggered: conditions.windSpeed.triggered,
                },
                {
                  icon: "cash-outline",
                  title: "Protected earnings",
                  value: `${RUPEE}${earnings.totalProtected.toLocaleString()} this week`,
                  color: Brand.success,
                  triggered: false,
                },
              ].map((item) => (
                <View
                  key={item.title}
                  style={[
                    styles.statCard,
                    item.triggered && styles.statCardTriggered,
                  ]}
                >
                  <View
                    style={[
                      styles.statIcon,
                      {
                        backgroundColor: item.triggered
                          ? `${Brand.danger}20`
                          : `${item.color}16`,
                      },
                    ]}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={18}
                      color={item.triggered ? Brand.danger : item.color}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.statTitleRow}>
                      <Text style={styles.statTitle}>{item.title}</Text>
                      {item.triggered && (
                        <View style={styles.triggeredBadge}>
                          <Text style={styles.triggeredBadgeText}>TRIGGERED</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.statValue}>{item.value}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* ── All Zones List ── */}
        <View style={styles.card}>
          <Text style={styles.sectionEyebrow}>All zones</Text>
          <Text style={styles.sectionTitle}>Browse available disruption zones</Text>

          <View style={styles.zoneList}>
            {riskZones.map((riskZone) => (
              <TouchableOpacity
                key={riskZone.id}
                activeOpacity={0.85}
                onPress={() => setSelected(riskZone.id)}
                style={[
                  styles.zoneRow,
                  selected === riskZone.id && styles.zoneRowSelected,
                ]}
              >
                <View style={[styles.zoneDot, { backgroundColor: riskColor(riskZone.risk) }]} />
                <Text style={styles.zoneName}>{riskZone.name}</Text>
                <View
                  style={[
                    styles.rowRiskPill,
                    { backgroundColor: riskBg(riskZone.risk) },
                  ]}
                >
                  <Text
                    style={[
                      styles.rowRiskText,
                      { color: riskColor(riskZone.risk) },
                    ]}
                  >
                    {riskZone.risk}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            {!riskZones.length ? (
              <View style={styles.emptyZoneState}>
                <Text style={styles.emptyZoneText}>
                  Set your work zone in profile to enable live risk map insights.
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.infoStrip}>
            <Ionicons name="information-circle-outline" size={16} color={Brand.primary} />
            <Text style={styles.infoText}>{conditions.status}</Text>
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
    fontSize: 28,
    lineHeight: 34,
    color: Neutral[900],
    letterSpacing: -0.9,
    marginBottom: 8,
  },
  heroSub: {
    fontFamily: Font.medium,
    fontSize: 14,
    lineHeight: 21,
    color: Neutral[500],
  },

  /* ── Map ─────────────────────────── */
  mapCard: {
    height: 286,
    backgroundColor: "#DCEEEF",
    borderRadius: Radius.xxl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(14,94,103,0.08)",
    ...Shadow.md,
  },
  mapGlowOne: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255,255,255,0.32)",
    top: -80,
    right: -50,
  },
  mapGlowTwo: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(14,94,103,0.08)",
    bottom: -50,
    left: -30,
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
    backgroundColor: "rgba(255,255,255,0.55)",
    borderRadius: Radius.full,
  },
  pin: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -15,
    marginTop: -15,
    borderColor: Neutral.white,
    ...Shadow.md,
  },
  pinText: {
    fontFamily: Font.bold,
    fontSize: 11,
    color: Neutral.white,
  },
  legend: {
    position: "absolute",
    right: 14,
    bottom: 14,
    backgroundColor: "rgba(255,255,255,0.82)",
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

  /* ── Weather Summary Card ─────────────────────────── */
  weatherCard: {
    backgroundColor: Brand.primaryDark,
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    overflow: "hidden",
    ...Shadow.lg,
  },
  weatherCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  weatherIconBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  weatherCityText: {
    fontFamily: Font.display,
    fontSize: 20,
    color: Neutral.white,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  weatherSummaryText: {
    fontFamily: Font.medium,
    fontSize: 13,
    color: "rgba(255,255,255,0.72)",
    lineHeight: 18,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  weatherMetricsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.lg,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  weatherMetric: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  weatherMetricValue: {
    fontFamily: Font.bold,
    fontSize: 16,
    color: Neutral.white,
    letterSpacing: -0.3,
  },
  weatherMetricLabel: {
    fontFamily: Font.medium,
    fontSize: 10,
    color: "rgba(255,255,255,0.58)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  weatherMetricDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  weatherTimestamp: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: "rgba(255,255,255,0.48)",
    textAlign: "right",
    marginTop: Spacing.sm,
  },

  /* ── Error Card ─────────────────────────── */
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Brand.dangerLight,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: `${Brand.danger}20`,
  },
  errorText: {
    flex: 1,
    fontFamily: Font.medium,
    fontSize: 13,
    color: Brand.danger,
    lineHeight: 19,
  },

  /* ── Shared Cards ─────────────────────────── */
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
    fontSize: 26,
    color: Neutral[900],
    letterSpacing: -0.8,
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
  zoneStats: {
    gap: Spacing.sm,
  },
  statCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Brand.surfaceAlt,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  statCardTriggered: {
    backgroundColor: Brand.dangerLight,
    borderWidth: 1,
    borderColor: `${Brand.danger}30`,
  },
  statIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  statTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statTitle: {
    fontFamily: Font.semiBold,
    fontSize: 13,
    color: Neutral[900],
    marginBottom: 2,
  },
  statValue: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: Neutral[500],
  },
  triggeredBadge: {
    backgroundColor: Brand.danger,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  triggeredBadgeText: {
    fontFamily: Font.bold,
    fontSize: 9,
    color: Neutral.white,
    letterSpacing: 0.5,
  },

  /* ── Zone list ─────────────────────────── */
  zoneList: {
    gap: 10,
  },
  zoneRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    backgroundColor: Brand.surfaceAlt,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  zoneRowSelected: {
    backgroundColor: Brand.primaryLight,
  },
  zoneDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  zoneName: {
    flex: 1,
    minWidth: 0,
    fontFamily: Font.semiBold,
    fontSize: 14,
    color: Neutral[900],
  },
  rowRiskPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  rowRiskText: {
    fontFamily: Font.semiBold,
    fontSize: 11,
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
