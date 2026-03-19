import { Tabs } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Platform, View, Text, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Brand, Neutral, Font } from "@/constants/theme";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

function TabIcon({
  name,
  color,
  focused,
  label,
}: {
  name: IoniconsName;
  color: string;
  focused: boolean;
  label: string;
}) {
  const animated = useRef({
    scale: new Animated.Value(focused ? 1 : 0.96),
    tint: new Animated.Value(focused ? 1 : 0),
  }).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(animated.scale, {
        toValue: focused ? 1 : 0.96,
        useNativeDriver: false,
        speed: 18,
        bounciness: 6,
      }),
      Animated.timing(animated.tint, {
        toValue: focused ? 1 : 0,
        duration: 180,
        useNativeDriver: false,
      }),
    ]).start();
  }, [animated, focused]);

  const activeBg = animated.tint.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(2,85,93,0)", "rgba(2,85,93,0.10)"],
  });

  return (
    <Animated.View
      style={[
        styles.tabItem,
        { transform: [{ scale: animated.scale }], backgroundColor: activeBg },
      ]}
    >
      <View style={[styles.iconWrap, focused && styles.iconWrapFocused]}>
        <Ionicons name={name} size={20} color={color} />
      </View>
      <Text
        style={[
          styles.tabLabel,
          { color, fontFamily: focused ? Font.semiBold : Font.medium },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Animated.View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: Brand.primary,
        tabBarInactiveTintColor: Neutral[400],
        tabBarStyle: {
          backgroundColor: "rgba(255,255,255,0.98)",
          borderTopColor: "rgba(2,85,93,0.08)",
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.OS === "ios" ? 82 : 66,
          paddingBottom: Platform.OS === "ios" ? 20 : 8,
          paddingTop: 8,
          paddingHorizontal: 10,
          elevation: 18,
          shadowColor: "#061A1C",
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 0.08,
          shadowRadius: 18,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "home" : "home-outline"}
              color={color}
              focused={focused}
              label="Home"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="plans"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "shield-checkmark" : "shield-checkmark-outline"}
              color={color}
              focused={focused}
              label="Plans"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="risk-map"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "map" : "map-outline"}
              color={color}
              focused={focused}
              label="Map"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="claims"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "flash" : "flash-outline"}
              color={color}
              focused={focused}
              label="Claims"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    flex: 1,
    minWidth: 70,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 18,
  },
  iconWrap: {
    width: 38,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  iconWrapFocused: {
    backgroundColor: Brand.primaryLight,
  },
  tabLabel: {
    fontSize: 10.5,
    letterSpacing: 0.2,
    textAlign: "center",
  },
});
