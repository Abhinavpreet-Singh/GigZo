import { Tabs } from "expo-router";
import React from "react";
import { Platform, View, Text, StyleSheet } from "react-native";
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
  return (
    <View style={[styles.tabItem, focused && styles.tabItemFocused]}>
      <View
        style={[styles.iconContainer, focused && styles.iconContainerFocused]}
      >
        <Ionicons name={name} size={24} color={color} />
      </View>
      <Text
        style={[
          styles.tabLabel,
          {
            color,
            fontFamily: focused ? Font.semiBold : Font.medium,
            opacity: focused ? 1 : 0.7,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
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
          backgroundColor: Neutral.white,
          borderTopColor: Neutral[100],
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.OS === "ios" ? 88 : 70,
          paddingBottom: Platform.OS === "ios" ? 28 : 10,
          paddingTop: 10,
          paddingHorizontal: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 16,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
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
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 14,
    marginHorizontal: 2,
    minWidth: 70,
  },

  tabItemFocused: {
    backgroundColor: Brand.primaryLight + "50",
  },

  iconContainer: {
    width: 44,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },

  iconContainerFocused: {
    backgroundColor: Brand.primaryLight,
  },

  tabLabel: {
    fontSize: 10.5,
    letterSpacing: 0.2,
    textAlign: "center",
    fontWeight: "500",
    marginTop: 2,
  },
});
