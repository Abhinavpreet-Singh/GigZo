import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Brand, Neutral, Font } from '@/constants/theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, color, focused, label }: {
  name: IoniconsName; color: string; focused: boolean; label: string;
}) {
  return (
    <View style={styles.tabItem}>
      <Ionicons name={name} size={22} color={color} />
      <Text
        style={[styles.tabLabel, { color, fontFamily: focused ? Font.semiBold : Font.medium }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
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
          borderTopColor: Neutral[200],
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
          paddingHorizontal: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} color={color} focused={focused} label="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="plans"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'shield-checkmark' : 'shield-checkmark-outline'} color={color} focused={focused} label="Plans" />
          ),
        }}
      />
      <Tabs.Screen
        name="risk-map"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'map' : 'map-outline'} color={color} focused={focused} label="Map" />
          ),
        }}
      />
      <Tabs.Screen
        name="claims"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'flash' : 'flash-outline'} color={color} focused={focused} label="Claims" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'person-circle' : 'person-circle-outline'} color={color} focused={focused} label="Profile" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    flex: 1,
    width: 56,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.1,
    textAlign: 'center',
  },
});
