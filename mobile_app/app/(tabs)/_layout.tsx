import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Brand, Neutral, Font } from '@/constants/theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface TabIconProps {
  name: IoniconsName;
  color: string;
  focused: boolean;
  label: string;
}

function TabIcon({ name, color, focused, label }: TabIconProps) {
  return (
    <View style={styles.tabItem}>
      <Ionicons name={name} size={22} color={color} />
      <Text style={[styles.tabLabel, { color, fontFamily: focused ? Font.semiBold : Font.medium }]}>
        {label}
      </Text>
    </View>
  );
}

const TAB_HEIGHT = Platform.OS === 'ios' ? 88 : 72;
const TAB_PADDING_BOTTOM = Platform.OS === 'ios' ? 28 : 12;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false, // we render our own label inside TabIcon
        tabBarActiveTintColor: Brand.primary,
        tabBarInactiveTintColor: Neutral[400],
        tabBarStyle: {
          backgroundColor: Neutral.white,
          borderTopColor: Neutral[200],
          borderTopWidth: StyleSheet.hairlineWidth,
          height: TAB_HEIGHT,
          paddingBottom: TAB_PADDING_BOTTOM,
          paddingTop: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 16,
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
            <TabIcon name={focused ? 'map' : 'map-outline'} color={color} focused={focused} label="Risk Map" />
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
        name="history"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'time' : 'time-outline'} color={color} focused={focused} label="History" />
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
    paddingTop: 2,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.1,
  },
});
