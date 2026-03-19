import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Brand,
  Neutral,
  Shadow,
  Spacing,
  Font,
} from "@/constants/theme";
import { useAppStore } from "@/store/useAppStore";

type ModernNavBarProps = {
  title?: string;
  showLogo?: boolean;
  showNotifications?: boolean;
  showProfile?: boolean;
  backgroundColor?: string;
  transparent?: boolean;
  children?: React.ReactNode;
};

function ActionButton({
  icon,
  onPress,
  transparent,
  showDot = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  onPress?: () => void;
  transparent: boolean;
  showDot?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      style={[
        styles.actionButton,
        transparent && styles.actionButtonTransparent,
      ]}
    >
      <Ionicons
        name={icon}
        size={18}
        color={transparent ? Neutral.white : Neutral[700]}
      />
      {showDot ? <View style={styles.notificationDot} /> : null}
    </TouchableOpacity>
  );
}

export function ModernNavBar({
  title,
  showLogo = true,
  showNotifications = true,
  showProfile = true,
  backgroundColor = Brand.canvasStrong,
  transparent = false,
  children,
}: ModernNavBarProps) {
  const router = useRouter();
  const { user } = useAppStore();

  const initials =
    user?.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  const textPrimary = transparent ? Neutral.white : Neutral[900];
  const textSecondary = transparent ? "rgba(255,255,255,0.74)" : Neutral[500];

  return (
    <>
      <StatusBar
        barStyle={transparent ? "light-content" : "dark-content"}
        backgroundColor={transparent ? "transparent" : backgroundColor}
        translucent={transparent}
      />
      <SafeAreaView
        edges={["top"]}
        style={[
          styles.safeArea,
          { backgroundColor: transparent ? "transparent" : backgroundColor },
        ]}
      >
        <View style={styles.shell}>
          <View style={styles.leftBlock}>
            {showLogo ? (
              <View style={styles.locationRow}>
                <View
                  style={[
                    styles.locationIconWrap,
                    transparent && styles.locationIconWrapTransparent,
                  ]}
                >
                  <Ionicons
                    name="location"
                    size={14}
                    color={transparent ? Neutral.white : Brand.primary}
                  />
                </View>
                <View style={styles.locationCopy}>
                  <Text
                    style={[styles.locationLabel, { color: textSecondary }]}
                    numberOfLines={1}
                  >
                    Current location
                  </Text>
                  <View style={styles.locationTitleRow}>
                    <Text
                      style={[styles.locationTitle, { color: textPrimary }]}
                      numberOfLines={1}
                    >
                      {user.zone}
                    </Text>
                    <Ionicons
                      name="chevron-down"
                      size={14}
                      color={transparent ? Neutral.white : Neutral[500]}
                    />
                  </View>
                  <Text
                    style={[styles.locationMeta, { color: textSecondary }]}
                    numberOfLines={1}
                  >
                    {user.city} • {user.platform}
                  </Text>
                </View>
              </View>
            ) : title ? (
              <View style={styles.titleBlock}>
                <Text style={[styles.title, { color: textPrimary }]} numberOfLines={1}>
                  {title}
                </Text>
                <Text
                  style={[styles.titleMeta, { color: textSecondary }]}
                  numberOfLines={1}
                >
                  {user.zone}, {user.city}
                </Text>
              </View>
            ) : null}
            {children}
          </View>

          <View style={styles.actionsRow}>
            {showNotifications ? (
              <ActionButton
                icon="notifications-outline"
                transparent={transparent}
                showDot
              />
            ) : null}

            {showProfile ? (
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => router.push("/(tabs)/profile")}
                style={[
                  styles.profileButton,
                  transparent && styles.profileButtonTransparent,
                ]}
              >
                <Text
                  style={[
                    styles.profileText,
                    transparent && styles.profileTextTransparent,
                  ]}
                >
                  {initials}
                </Text>
                {user?.isProtected ? <View style={styles.profileDot} /> : null}
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    zIndex: 10,
  },
  shell: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: 4,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  leftBlock: {
    flex: 1,
    minWidth: 0,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  locationIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Neutral.white,
    borderWidth: 1,
    borderColor: "rgba(2,85,93,0.08)",
    ...Shadow.sm,
  },
  locationIconWrapTransparent: {
    backgroundColor: "rgba(255,255,255,0.16)",
    borderColor: "rgba(255,255,255,0.14)",
  },
  locationCopy: {
    flex: 1,
    minWidth: 0,
  },
  locationLabel: {
    fontFamily: Font.medium,
    fontSize: 11,
    marginBottom: 2,
  },
  locationTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationTitle: {
    flexShrink: 1,
    fontFamily: Font.display,
    fontSize: 22,
    letterSpacing: -0.8,
  },
  locationMeta: {
    fontFamily: Font.medium,
    fontSize: 12,
    marginTop: 2,
  },
  titleBlock: {
    minWidth: 0,
  },
  title: {
    fontFamily: Font.display,
    fontSize: 28,
    letterSpacing: -1,
  },
  titleMeta: {
    fontFamily: Font.medium,
    fontSize: 12,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Neutral.white,
    borderWidth: 1,
    borderColor: "rgba(2,85,93,0.08)",
    ...Shadow.sm,
  },
  actionButtonTransparent: {
    backgroundColor: "rgba(255,255,255,0.16)",
    borderColor: "rgba(255,255,255,0.14)",
  },
  notificationDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Brand.danger,
    borderWidth: 1.5,
    borderColor: Neutral.white,
  },
  profileButton: {
    width: 42,
    height: 42,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Brand.primary,
    ...Shadow.md,
  },
  profileButtonTransparent: {
    backgroundColor: "rgba(255,255,255,0.20)",
  },
  profileText: {
    fontFamily: Font.bold,
    fontSize: 14,
    color: Neutral.white,
  },
  profileTextTransparent: {
    color: Neutral.white,
  },
  profileDot: {
    position: "absolute",
    right: 4,
    bottom: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Brand.success,
    borderWidth: 1.5,
    borderColor: Neutral.white,
  },
});
