import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Brand,
  Neutral,
  Shadow,
  Radius,
  Spacing,
  Font,
} from "@/constants/theme";
import { useAppStore } from "@/store/useAppStore";
import { GigzoLockup } from "./gigzo-ui";

type ModernNavBarProps = {
  title?: string;
  showLogo?: boolean;
  showNotifications?: boolean;
  showProfile?: boolean;
  backgroundColor?: string;
  transparent?: boolean;
  children?: React.ReactNode;
};

export function ModernNavBar({
  title,
  showLogo = true,
  showNotifications = true,
  showProfile = true,
  backgroundColor = Neutral.white,
  transparent = false,
  children,
}: ModernNavBarProps) {
  const router = useRouter();
  const { user } = useAppStore();

  const navBarStyle = [
    styles.navbar,
    {
      backgroundColor: transparent ? "transparent" : backgroundColor,
      borderBottomWidth: transparent ? 0 : StyleSheet.hairlineWidth,
      borderBottomColor: transparent ? "transparent" : Neutral[200],
    },
    transparent && styles.transparentNav,
  ];

  return (
    <>
      <StatusBar
        barStyle={transparent ? "light-content" : "dark-content"}
        backgroundColor={transparent ? "transparent" : backgroundColor}
        translucent={transparent}
      />
      <SafeAreaView edges={["top"]} style={navBarStyle}>
        <View style={styles.navContent}>
          {/* Left section - Logo or Title */}
          <View style={styles.leftSection}>
            {showLogo ? (
              <GigzoLockup compact style={styles.lockup} />
            ) : title ? (
              <Text
                style={[styles.pageTitle, transparent && styles.pageTitleLight]}
              >
                {title}
              </Text>
            ) : null}
            {children}
          </View>

          {/* Right section - Notifications & Profile */}
          <View style={styles.rightSection}>
            {showNotifications && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  transparent && styles.actionButtonTransparent,
                ]}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="notifications-outline"
                  size={20}
                  color={transparent ? Neutral.white : Neutral[700]}
                />
                <View style={styles.notificationDot} />
              </TouchableOpacity>
            )}

            {showProfile && (
              <TouchableOpacity
                style={[
                  styles.profileButton,
                  transparent && styles.profileButtonTransparent,
                ]}
                onPress={() => router.push("/(tabs)/profile")}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.profileAvatar,
                    transparent && styles.profileAvatarTransparent,
                  ]}
                >
                  <Text
                    style={[
                      styles.avatarText,
                      transparent && styles.avatarTextTransparent,
                    ]}
                  >
                    {user?.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2) || "U"}
                  </Text>
                </View>
                {user?.isProtected && (
                  <View style={styles.protectedIndicator} />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  navbar: {
    backgroundColor: Neutral.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Neutral[200],
    ...Platform.select({
      ios: {
        ...Shadow.sm,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  transparentNav: {
    backgroundColor: "rgba(255,255,255,0.92)",
    backdropFilter: "blur(16px)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.3)",
    ...Platform.select({
      ios: {
        ...Shadow.md,
      },
      android: {
        elevation: 8,
      },
    }),
  },

  navContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 60,
  },

  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },

  lockup: {
    flex: 1,
  },

  pageTitle: {
    fontFamily: Font.bold,
    fontSize: 22,
    color: Neutral[900],
    letterSpacing: -0.4,
  },

  pageTitleLight: {
    color: Neutral.white,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  actionButton: {
    position: "relative",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Neutral[50],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Neutral[200],
    ...Shadow.xs,
  },

  actionButtonTransparent: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderColor: "rgba(255,255,255,0.25)",
    backdropFilter: "blur(12px)",
    ...Shadow.sm,
  },

  notificationDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Brand.danger,
    borderWidth: 1.5,
    borderColor: Neutral.white,
    ...Shadow.xs,
  },

  profileButton: {
    position: "relative",
    borderRadius: 26,
    padding: 2,
  },

  profileButtonTransparent: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 28,
    padding: 3,
  },

  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Brand.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Neutral.white,
    ...Shadow.md,
  },

  profileAvatarTransparent: {
    backgroundColor: "rgba(255,255,255,0.3)",
    borderColor: "rgba(255,255,255,0.4)",
    backdropFilter: "blur(12px)",
  },

  avatarText: {
    fontFamily: Font.bold,
    fontSize: 17,
    color: Neutral.white,
    letterSpacing: 0.5,
  },

  avatarTextTransparent: {
    color: Neutral.white,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  protectedIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Brand.success,
    borderWidth: 2,
    borderColor: Neutral.white,
    ...Shadow.sm,
  },
});
