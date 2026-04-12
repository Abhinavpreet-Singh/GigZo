import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  ActivityIndicator,
  Linking,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
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
  fetchLiveWeatherByCoords,
  computeRiskLevel,
  type LiveWeatherData,
} from "@ai";

const RUPEE = "\u20B9";

const ACTIONS = [
  {
    label: "Insurance",
    sub: "Protection",
    icon: "shield-checkmark-outline",
    route: "/(tabs)/plans",
  },
  {
    label: "Risk Map",
    sub: "Zone exposure",
    icon: "map-outline",
    route: "/(tabs)/risk-map",
  },
  {
    label: "Claims",
    sub: "Track payout",
    icon: "flash-outline",
    route: "/(tabs)/claims",
  },
] as const;

const RAIN_DROPS = [
  { left: "6%", duration: 1960, scale: 0.88 },
  { left: "16%", duration: 1780, scale: 0.76 },
  { left: "28%", duration: 1880, scale: 0.96 },
  { left: "40%", duration: 2080, scale: 0.82 },
  { left: "52%", duration: 1840, scale: 0.92 },
  { left: "64%", duration: 1980, scale: 0.8 },
  { left: "76%", duration: 1760, scale: 0.98 },
  { left: "88%", duration: 2060, scale: 0.74 },
] as const;

function Reveal({
  delay = 0,
  style,
  children,
}: {
  delay?: number;
  style?: object;
  children: React.ReactNode;
}) {
  const animated = useRef({
    opacity: new Animated.Value(0),
    translateY: new Animated.Value(18),
  }).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animated.opacity, {
        toValue: 1,
        duration: 420,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(animated.translateY, {
        toValue: 0,
        duration: 420,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [animated, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: animated.opacity,
          transform: [{ translateY: animated.translateY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

function RainLoop() {
  const drops = useRef(
    RAIN_DROPS.map(() => ({
      progress: new Animated.Value(0),
    })),
  ).current;

  useEffect(() => {
    drops.forEach((drop, index) => {
      drop.progress.setValue((index + 1) / (drops.length + 1));
    });

    const animations = drops.map((drop, index) =>
      Animated.loop(
        Animated.timing(drop.progress, {
          toValue: 1,
          duration: RAIN_DROPS[index].duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ),
    );

    animations.forEach((animation) => animation.start());

    return () => {
      animations.forEach((animation) => animation.stop());
    };
  }, [drops]);

  return (
    <View pointerEvents="none" style={styles.rainLayer}>
      {RAIN_DROPS.map((drop, index) =>
        (() => {
          const translateY = drops[index].progress.interpolate({
            inputRange: [0, 1],
            outputRange: [-54, 176],
          });
          const opacity = drops[index].progress.interpolate({
            inputRange: [0, 0.1, 0.82, 1],
            outputRange: [0, 0.26, 0.18, 0],
          });

          return (
            <Animated.View
              key={`${drop.left}-${index}`}
              style={[
                styles.rainDrop,
                {
                  left: drop.left,
                  opacity,
                  transform: [
                    { translateY },
                    { scaleY: drop.scale },
                    { rotate: "-16deg" },
                  ],
                },
              ]}
            />
          );
        })(),
      )}
    </View>
  );
}

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
  if (!data) return "Fetching conditions...";
  const parts: string[] = [];
  if (data.rain_mm >= 50) parts.push("Heavy rainfall");
  else if (data.rain_mm >= 20) parts.push("Moderate rain");
  else if (data.rain_mm >= 5) parts.push("Light rain");
  if (data.aqi >= 350) parts.push("Hazardous air");
  else if (data.aqi >= 200) parts.push("Poor air quality");
  if (data.temperature >= 42) parts.push("Extreme heat");
  else if (data.temperature <= 5) parts.push("Extreme cold");
  if (data.wind_kph >= 60) parts.push("Strong winds");
  if (parts.length === 0) return "Conditions are normal";
  return parts.join(" · ");
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, conditions, earnings, activeClaim, setConditions } =
    useAppStore();

  // ── Location & weather state
  const [weatherData, setWeatherData] = useState<LiveWeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // GPS permission + coords
  type PermStatus = "undetermined" | "granted" | "denied";
  type LocationMode = "gps" | "profile" | "manual";
  const [permStatus, setPermStatus] = useState<PermStatus>("undetermined");
  const [gpsCoords, setGpsCoords] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [locationMode, setLocationMode] = useState<LocationMode>("gps");
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [manualCity, setManualCity] = useState("");

  /** Request permission, resolve location source, then fetch weather */
  const fetchWeather = useCallback(async () => {
    setWeatherLoading(true);
    setWeatherError(null);

    try {
      let data: LiveWeatherData | null = null;
      let nextLabel = "";
      let nextCoords: { lat: number; lon: number } | null = null;
      let usedGps = false;

      if (locationMode === "gps") {
        const { status } = await Location.requestForegroundPermissionsAsync();
        const hasPermission = status === "granted";
        setPermStatus(hasPermission ? "granted" : "denied");

        if (hasPermission) {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const { latitude, longitude } = pos.coords;
          nextCoords = { lat: latitude, lon: longitude };
          usedGps = true;

          try {
            const [geo] = await Location.reverseGeocodeAsync({
              latitude,
              longitude,
            });
            nextLabel =
              geo?.district ||
              geo?.subregion ||
              geo?.city ||
              geo?.region ||
              "Current area";
          } catch {
            nextLabel = `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`;
          }

          data = await fetchLiveWeatherByCoords(latitude, longitude);
        } else {
          const fallbackCity = user.city?.trim();
          if (!fallbackCity) {
            setWeatherError(
              "Enable location or pick a city from the location switcher.",
            );
            setGpsCoords(null);
            setLocationLabel("Location needed");
            return;
          }
          nextLabel = fallbackCity;
          data = await fetchLiveWeather(fallbackCity);
        }
      } else {
        const selectedCity =
          locationMode === "manual" ? manualCity.trim() : user.city.trim();
        if (!selectedCity) {
          setWeatherError("Select a city from the location switcher.");
          return;
        }
        setPermStatus("undetermined");
        nextLabel = selectedCity;
        data = await fetchLiveWeather(selectedCity);
      }

      if (data) {
        setWeatherData(data);
        setLastUpdated(new Date());
        setGpsCoords(nextCoords);
        setLocationLabel(nextLabel);

        const risk = computeRiskLevel(data);
        const displaySource = usedGps ? "GPS" : "City";
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
          status: `Live · ${displaySource} · ${nextLabel} · updated ${updatedAt}`,
          isLive: true,
        });
      } else {
        setWeatherError("Could not fetch weather. Will retry in 5 min.");
      }
    } catch (err) {
      setWeatherError("Weather service temporarily unavailable.");
      console.warn("[home] weather fetch failed:", err);
    } finally {
      setWeatherLoading(false);
    }
  }, [locationMode, manualCity, user.city, setConditions]);

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(() => fetchWeather(), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  const applyLocationMode = (mode: LocationMode) => {
    setLocationMode(mode);
    setLocationModalOpen(false);
  };

  const locationTitle = locationLabel || user.zone || "Set location";
  const locationSubtitle =
    locationMode === "gps"
      ? "Live GPS"
      : locationMode === "manual"
        ? `${manualCity || "Custom city"} • manual`
        : `${user.city || "Profile city"} • profile`;

  const coverageRatio =
    earnings.weeklyMax > 0
      ? Math.min(earnings.totalProtected / earnings.weeklyMax, 1)
      : 0;

  const resolvedPlan = user.activePlan ?? "basic";
  const resolvedCoverage =
    user.coveragePerDay > 0
      ? user.coveragePerDay
      : resolvedPlan === "pro"
        ? 500
        : 300;

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.topBlend}>
        <View style={styles.topGlowOne} />
        <View style={styles.topGlowTwo} />
        <View style={styles.topFade} />
      </View>

      <ModernNavBar
        transparent
        locationTitle={locationTitle}
        locationSubtitle={locationSubtitle}
        onPressLocation={() => setLocationModalOpen(true)}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Reveal delay={40}>
          <View style={styles.heroBlock}>
            <RainLoop />
            <Text style={styles.heroEyebrow}>Live protection</Text>
            <Text style={styles.heroTitle}>GigZo protects every shift.</Text>
            <Text style={styles.heroSub}>
              Live protection, weather triggers, and payout status for{" "}
              {user.zone || "your zone"}
              in one cleaner home view.
            </Text>
          </View>
        </Reveal>

        <Reveal delay={120}>
          <View style={styles.heroCard}>
            <View style={styles.heroAuraOne} />
            <View style={styles.heroAuraTwo} />

            <View style={styles.heroTopRow}>
              <View style={styles.heroTopLeft}>
                <Text style={styles.heroKicker}>Active cover</Text>
                <View style={styles.heroAmountRow}>
                  <Text style={styles.heroCurrency}>{RUPEE}</Text>
                  <Text style={styles.heroAmount}>{resolvedCoverage}</Text>
                  <Text style={styles.heroAmountMeta}>/day</Text>
                </View>
                <Text style={styles.heroPlanMeta}>
                  {resolvedPlan === "pro" ? "Pro plan" : "Basic plan"} •{" "}
                  {user.daysLeft > 0
                    ? `${user.daysLeft} days remaining`
                    : "Coverage status syncing"}
                </Text>
              </View>

              <View style={styles.heroStatusCard}>
                <Ionicons
                  name="shield-checkmark"
                  size={22}
                  color={Brand.primary}
                />
                <Text style={styles.heroStatusValue}>
                  {conditions.overallRisk}
                </Text>
                <Text style={styles.heroStatusLabel}>zone risk</Text>
              </View>
            </View>
          </View>
        </Reveal>

        {activeClaim ? (
          <Reveal delay={180}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => router.push("/(tabs)/claims")}
              style={styles.claimBanner}
            >
              <View style={styles.claimBannerIcon}>
                <Ionicons name="flash" size={18} color={Neutral.white} />
              </View>
              <View style={styles.claimBannerCopy}>
                <Text style={styles.claimBannerTitle}>Claim in progress</Text>
                <Text style={styles.claimBannerSub}>
                  {activeClaim.reason} • {RUPEE}
                  {activeClaim.amount} payout pending
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={18} color={Brand.primary} />
            </TouchableOpacity>
          </Reveal>
        ) : null}

        <Reveal delay={240}>
          {permStatus === "denied" && !user.city ? (
            /* ── Permission denied + no fallback city ── */
            <View style={styles.permCard}>
              <View style={styles.permIconWrap}>
                <Ionicons
                  name="location-outline"
                  size={28}
                  color={Brand.primary}
                />
              </View>
              <Text style={styles.permTitle}>Location access needed</Text>
              <Text style={styles.permSub}>
                GigZo uses your GPS to show live weather for your exact
                location. Enable location in Settings, or set your city in
                Profile as a fallback.
              </Text>
              <View style={styles.permActions}>
                <TouchableOpacity
                  style={styles.permBtn}
                  activeOpacity={0.85}
                  onPress={() => Linking.openSettings()}
                >
                  <Ionicons
                    name="settings-outline"
                    size={16}
                    color={Neutral.white}
                  />
                  <Text style={styles.permBtnText}>Open Settings</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.permBtnOutline}
                  activeOpacity={0.85}
                  onPress={() => router.push("/(tabs)/profile") as any}
                >
                  <Text style={styles.permBtnOutlineText}>
                    Set city instead
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* ── Live weather card ── */
            <View style={styles.weatherCard}>
              {/* Source badge */}
              <View style={styles.weatherSourceRow}>
                <View
                  style={[
                    styles.weatherSourceBadge,
                    gpsCoords ? styles.badgeGps : styles.badgeCity,
                  ]}
                >
                  <Ionicons
                    name={gpsCoords ? "navigate" : "location-outline"}
                    size={11}
                    color={gpsCoords ? "#34D399" : "rgba(255,255,255,0.7)"}
                  />
                  <Text
                    style={[
                      styles.weatherSourceText,
                      gpsCoords ? styles.sourceTextGps : styles.sourceTextCity,
                    ]}
                  >
                    {gpsCoords
                      ? `GPS · ${gpsCoords.lat.toFixed(3)}°, ${gpsCoords.lon.toFixed(3)}°`
                      : `City · ${locationLabel || user.city || "Not set"}`}
                  </Text>
                </View>
                {permStatus === "denied" && (
                  <TouchableOpacity
                    onPress={() => Linking.openSettings()}
                    style={styles.enableGpsBtn}
                  >
                    <Text style={styles.enableGpsBtnText}>Enable GPS</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Header row: icon + area name + refresh */}
              <View style={styles.weatherCardHeader}>
                <View style={styles.weatherIconBox}>
                  <Ionicons
                    name={getWeatherIcon(weatherData) as any}
                    size={26}
                    color={Neutral.white}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.weatherCityText}>
                    {locationLabel || user.city || "Your location"}
                  </Text>
                  <Text style={styles.weatherRiskText}>
                    Risk: {conditions.overallRisk}
                  </Text>
                  <Text style={styles.weatherSummaryText}>
                    {weatherLoading
                      ? "Fetching conditions..."
                      : getWeatherSummary(weatherData)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={fetchWeather}
                  disabled={weatherLoading}
                  style={styles.refreshBtn}
                  activeOpacity={0.7}
                >
                  {weatherLoading ? (
                    <ActivityIndicator size="small" color={Neutral.white} />
                  ) : (
                    <Ionicons
                      name="refresh-outline"
                      size={20}
                      color={Neutral.white}
                    />
                  )}
                </TouchableOpacity>
              </View>

              {/* 4-metric row */}
              <View style={styles.weatherMetricsRow}>
                <View style={styles.weatherMetric}>
                  <Ionicons
                    name="thermometer-outline"
                    size={15}
                    color="rgba(255,255,255,0.8)"
                  />
                  <Text style={styles.weatherMetricValue}>
                    {weatherData
                      ? `${weatherData.temperature.toFixed(1)}°C`
                      : "--"}
                  </Text>
                  <Text style={styles.weatherMetricLabel}>Temp</Text>
                </View>
                <View style={styles.weatherMetricDivider} />
                <View style={styles.weatherMetric}>
                  <Ionicons
                    name="rainy-outline"
                    size={15}
                    color="rgba(255,255,255,0.8)"
                  />
                  <Text style={styles.weatherMetricValue}>
                    {weatherData ? `${weatherData.rain_mm.toFixed(1)}mm` : "--"}
                  </Text>
                  <Text style={styles.weatherMetricLabel}>Rain</Text>
                </View>
                <View style={styles.weatherMetricDivider} />
                <View style={styles.weatherMetric}>
                  <Ionicons
                    name="speedometer-outline"
                    size={15}
                    color="rgba(255,255,255,0.8)"
                  />
                  <Text style={styles.weatherMetricValue}>
                    {weatherData ? weatherData.wind_kph.toFixed(0) : "--"}
                  </Text>
                  <Text style={styles.weatherMetricLabel}>km/h</Text>
                </View>
                <View style={styles.weatherMetricDivider} />
                <View style={styles.weatherMetric}>
                  <Ionicons
                    name="leaf-outline"
                    size={15}
                    color="rgba(255,255,255,0.8)"
                  />
                  <Text style={styles.weatherMetricValue}>
                    {weatherData ? Math.round(weatherData.aqi) : "--"}
                  </Text>
                  <Text style={styles.weatherMetricLabel}>AQI</Text>
                </View>
              </View>

              {/* Timestamp / error */}
              {weatherError ? (
                <View style={styles.weatherErrorRow}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={13}
                    color="rgba(255,200,180,0.9)"
                  />
                  <Text style={styles.weatherErrorText}>{weatherError}</Text>
                </View>
              ) : lastUpdated ? (
                <Text style={styles.weatherTimestamp}>
                  Updated{" "}
                  {lastUpdated.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              ) : null}
            </View>
          )}
        </Reveal>

        <Reveal delay={300}>
          <View style={styles.coverageCard}>
            <View style={styles.sectionHead}>
              <View>
                <Text style={styles.coverageEyebrow}>Coverage this week</Text>
                <Text style={styles.coverageTitle}>
                  Protected earnings balance
                </Text>
              </View>
              <Text style={styles.coverageAmount}>
                {RUPEE}
                {earnings.totalProtected.toLocaleString()}
              </Text>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.max(10, Math.round(coverageRatio * 100))}%`,
                  },
                ]}
              />
            </View>

            <View style={styles.coverageMetaRow}>
              <Text style={styles.coverageMeta}>
                Weekly limit {RUPEE}
                {earnings.weeklyMax.toLocaleString()}
              </Text>
              <Text style={styles.coverageMeta}>
                {Math.round(coverageRatio * 100)}% used
              </Text>
            </View>
          </View>
        </Reveal>

        <Reveal delay={360}>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHead}>
              <View>
                <Text style={styles.sectionEyebrow}>Quick access</Text>
                <Text style={styles.sectionTitle}>
                  Core actions, simplified
                </Text>
              </View>
            </View>

            <View style={styles.actionGrid}>
              {ACTIONS.map((action) => (
                <TouchableOpacity
                  key={action.label}
                  activeOpacity={0.88}
                  onPress={() => router.push(action.route)}
                  style={styles.actionCard}
                >
                  <View style={styles.actionIconWrap}>
                    <Ionicons
                      name={action.icon}
                      size={20}
                      color={Brand.primary}
                    />
                  </View>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                  <Text style={styles.actionSub}>{action.sub}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Reveal>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent
        visible={locationModalOpen}
        onRequestClose={() => setLocationModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.locationModalCard}>
            <View style={styles.modalHeadRow}>
              <Text style={styles.modalTitle}>Change location</Text>
              <TouchableOpacity onPress={() => setLocationModalOpen(false)}>
                <Ionicons name="close" size={20} color={Neutral[700]} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.locationModeBtn}
              onPress={() => applyLocationMode("gps")}
            >
              <Ionicons name="navigate" size={16} color={Brand.primary} />
              <Text style={styles.locationModeText}>Use live GPS location</Text>
              {locationMode === "gps" ? (
                <Ionicons name="checkmark" size={18} color={Brand.primary} />
              ) : null}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.locationModeBtn}
              onPress={() => applyLocationMode("profile")}
            >
              <Ionicons
                name="location-outline"
                size={16}
                color={Brand.primary}
              />
              <Text style={styles.locationModeText}>
                Use profile city ({user.city || "not set"})
              </Text>
              {locationMode === "profile" ? (
                <Ionicons name="checkmark" size={18} color={Brand.primary} />
              ) : null}
            </TouchableOpacity>

            <View style={styles.manualWrap}>
              <Text style={styles.manualLabel}>Manual city</Text>
              <TextInput
                style={styles.manualInput}
                placeholder="Enter city name"
                placeholderTextColor={Neutral[400]}
                value={manualCity}
                onChangeText={setManualCity}
              />
              <TouchableOpacity
                style={styles.manualApplyBtn}
                onPress={() => applyLocationMode("manual")}
                disabled={!manualCity.trim()}
              >
                <Text style={styles.manualApplyText}>Use this city</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.canvas,
  },
  weatherRiskText: {
    fontFamily: Font.semiBold,
    fontSize: 11,
    color: "rgba(255,255,255,0.86)",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  topBlend: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 430,
    backgroundColor: Brand.primaryDark,
  },
  topGlowOne: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(95,219,205,0.16)",
    top: -90,
    right: -40,
  },
  topGlowTwo: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255,255,255,0.08)",
    top: 80,
    left: -60,
  },
  topFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 76,
    backgroundColor: "rgba(243,247,247,0.38)",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: 128,
    gap: Spacing.lg,
  },
  heroBlock: {
    position: "relative",
    overflow: "hidden",
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.xxl,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  heroEyebrow: {
    fontFamily: Font.semiBold,
    fontSize: 11,
    color: "rgba(255,255,255,0.86)",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  heroTitle: {
    fontFamily: Font.display,
    fontSize: 32,
    lineHeight: 37,
    color: Neutral.white,
    letterSpacing: -1.3,
    marginBottom: 6,
    maxWidth: 300,
  },
  heroSub: {
    fontFamily: Font.medium,
    fontSize: 14,
    lineHeight: 21,
    color: "rgba(255,255,255,0.84)",
    maxWidth: 320,
  },
  rainLayer: {
    ...StyleSheet.absoluteFillObject,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  rainDrop: {
    position: "absolute",
    top: 0,
    width: 2,
    height: 24,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255,255,255,0.44)",
  },
  heroCard: {
    backgroundColor: Neutral.white,
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(2,85,93,0.08)",
    ...Shadow.lg,
  },
  heroAuraOne: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(2,85,93,0.08)",
    top: -100,
    right: -70,
  },
  heroAuraTwo: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(3,116,127,0.07)",
    bottom: -60,
    left: -30,
  },
  heroTopRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  heroTopLeft: {
    flex: 1,
    minWidth: 180,
  },
  heroKicker: {
    fontFamily: Font.semiBold,
    fontSize: 11,
    color: Neutral[500],
    textTransform: "uppercase",
    letterSpacing: 1.1,
    marginBottom: 8,
  },
  heroAmountRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 6,
  },
  heroCurrency: {
    fontFamily: Font.bold,
    fontSize: 22,
    color: Brand.primary,
    paddingBottom: 8,
    marginRight: 2,
  },
  heroAmount: {
    fontFamily: Font.display,
    fontSize: 54,
    lineHeight: 56,
    color: Neutral[900],
    letterSpacing: -2,
  },
  heroAmountMeta: {
    fontFamily: Font.medium,
    fontSize: 15,
    color: Neutral[500],
    paddingBottom: 9,
    marginLeft: 4,
  },
  heroPlanMeta: {
    fontFamily: Font.medium,
    fontSize: 13,
    color: Neutral[500],
  },
  heroStatusCard: {
    minWidth: 112,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Brand.primaryLight,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  heroStatusValue: {
    fontFamily: Font.display,
    fontSize: 20,
    color: Brand.primaryDark,
    marginTop: 8,
  },
  heroStatusLabel: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: Neutral[500],
    marginTop: 2,
  },
  heroPillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: Spacing.xl,
  },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Brand.surfaceTint,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  heroPillText: {
    fontFamily: Font.semiBold,
    fontSize: 12,
    color: Brand.primaryDark,
  },
  claimBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Neutral.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(2,85,93,0.08)",
    ...Shadow.sm,
  },
  claimBannerIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Brand.primary,
  },
  claimBannerCopy: {
    flex: 1,
    minWidth: 0,
  },
  claimBannerTitle: {
    fontFamily: Font.semiBold,
    fontSize: 15,
    color: Neutral[900],
    marginBottom: 3,
  },
  claimBannerSub: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: Neutral[500],
  },
  sectionCard: {
    backgroundColor: Neutral.white,
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Brand.line,
    ...Shadow.sm,
  },

  /* ── Live Weather Card ──────────────────── */
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
    marginBottom: Spacing.lg,
  },
  weatherIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  weatherCityText: {
    fontFamily: Font.display,
    fontSize: 18,
    color: Neutral.white,
    letterSpacing: -0.4,
    marginBottom: 2,
  },
  weatherSummaryText: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: "rgba(255,255,255,0.68)",
    lineHeight: 17,
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  weatherMetricsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  weatherMetric: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  weatherMetricValue: {
    fontFamily: Font.bold,
    fontSize: 15,
    color: Neutral.white,
    letterSpacing: -0.2,
  },
  weatherMetricLabel: {
    fontFamily: Font.medium,
    fontSize: 10,
    color: "rgba(255,255,255,0.52)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  weatherMetricDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  weatherTimestamp: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: "rgba(255,255,255,0.42)",
    textAlign: "right",
    marginTop: Spacing.sm,
  },
  weatherErrorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: Spacing.sm,
  },
  weatherErrorText: {
    flex: 1,
    fontFamily: Font.medium,
    fontSize: 11,
    color: "rgba(255,200,180,0.9)",
  },

  /* ── GPS source badge ──────────────────── */
  weatherSourceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  weatherSourceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  badgeGps: {
    backgroundColor: "rgba(52,211,153,0.18)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.3)",
  },
  badgeCity: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  weatherSourceText: {
    fontFamily: Font.semiBold,
    fontSize: 10,
    letterSpacing: 0.3,
  },
  sourceTextGps: {
    color: "#34D399",
  },
  sourceTextCity: {
    color: "rgba(255,255,255,0.65)",
  },
  enableGpsBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  enableGpsBtnText: {
    fontFamily: Font.semiBold,
    fontSize: 11,
    color: Neutral.white,
  },

  /* ── Permission denied card ─────────────── */
  permCard: {
    backgroundColor: Neutral.white,
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Brand.line,
    ...Shadow.sm,
  },
  permIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: Brand.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  permTitle: {
    fontFamily: Font.display,
    fontSize: 20,
    color: Neutral[900],
    letterSpacing: -0.5,
    marginBottom: 10,
    textAlign: "center",
  },
  permSub: {
    fontFamily: Font.medium,
    fontSize: 13,
    color: Neutral[500],
    lineHeight: 20,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  permActions: {
    width: "100%",
    gap: Spacing.sm,
  },
  permBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Brand.primary,
    borderRadius: Radius.lg,
    paddingVertical: 14,
  },
  permBtnText: {
    fontFamily: Font.semiBold,
    fontSize: 14,
    color: Neutral.white,
  },
  permBtnOutline: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.lg,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Brand.line,
  },
  permBtnOutlineText: {
    fontFamily: Font.semiBold,
    fontSize: 14,
    color: Brand.primaryDark,
  },

  coverageCard: {
    backgroundColor: Brand.primaryDark,
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    ...Shadow.lg,
  },
  coverageEyebrow: {
    fontFamily: Font.semiBold,
    fontSize: 11,
    color: "rgba(255,255,255,0.74)",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  coverageTitle: {
    fontFamily: Font.semiBold,
    fontSize: 22,
    lineHeight: 27,
    color: Neutral.white,
    letterSpacing: -0.7,
  },
  sectionHead: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
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
    lineHeight: 27,
    color: Neutral[900],
    letterSpacing: -0.7,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: Brand.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
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
  },
  metricsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  metricTile: {
    flexGrow: 1,
    minWidth: 92,
    backgroundColor: Brand.surfaceAlt,
    borderRadius: Radius.xl,
    padding: Spacing.md,
  },
  metricTileActive: {
    backgroundColor: Brand.primary,
  },
  metricIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Brand.primaryLight,
    marginBottom: 12,
  },
  metricIconActive: {
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  metricValue: {
    fontFamily: Font.display,
    fontSize: 24,
    color: Neutral[900],
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  metricValueActive: {
    color: Neutral.white,
  },
  metricLabel: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: Neutral[500],
  },
  metricLabelActive: {
    color: "rgba(255,255,255,0.72)",
  },
  infoStrip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: Spacing.lg,
    backgroundColor: Brand.surfaceTint,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  infoStripText: {
    flex: 1,
    fontFamily: Font.medium,
    fontSize: 12,
    lineHeight: 19,
    color: Brand.primaryDark,
  },
  coverageAmount: {
    fontFamily: Font.display,
    fontSize: 28,
    color: Neutral.white,
    letterSpacing: -1,
  },
  progressTrack: {
    height: 12,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
    marginBottom: 10,
  },
  progressFill: {
    height: "100%",
    borderRadius: Radius.full,
    backgroundColor: "#64D2C5",
  },
  coverageMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  coverageMeta: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: "rgba(255,255,255,0.72)",
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  actionCard: {
    flexGrow: 1,
    minWidth: 96,
    backgroundColor: Brand.surfaceAlt,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    minHeight: 132,
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Brand.primaryLight,
    marginBottom: 14,
  },
  actionLabel: {
    fontFamily: Font.semiBold,
    fontSize: 15,
    color: Neutral[900],
    marginBottom: 4,
  },
  actionSub: {
    fontFamily: Font.medium,
    fontSize: 12,
    lineHeight: 18,
    color: Neutral[500],
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(7,22,25,0.45)",
    justifyContent: "flex-end",
    padding: Spacing.md,
  },
  locationModalCard: {
    backgroundColor: Neutral.white,
    borderRadius: Radius.xxl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Brand.line,
    ...Shadow.md,
  },
  modalHeadRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontFamily: Font.display,
    fontSize: 24,
    color: Neutral[900],
    letterSpacing: -0.7,
  },
  locationModeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
  },
  locationModeText: {
    flex: 1,
    fontFamily: Font.medium,
    fontSize: 14,
    color: Neutral[800],
  },
  manualWrap: {
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    backgroundColor: Brand.surfaceAlt,
  },
  manualLabel: {
    fontFamily: Font.semiBold,
    fontSize: 12,
    color: Neutral[600],
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  manualInput: {
    borderWidth: 1,
    borderColor: Neutral[200],
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Neutral.white,
    fontFamily: Font.medium,
    color: Neutral[900],
  },
  manualApplyBtn: {
    marginTop: 10,
    borderRadius: Radius.md,
    backgroundColor: Brand.primary,
    alignItems: "center",
    paddingVertical: 10,
  },
  manualApplyText: {
    fontFamily: Font.semiBold,
    fontSize: 13,
    color: Neutral.white,
  },
});
