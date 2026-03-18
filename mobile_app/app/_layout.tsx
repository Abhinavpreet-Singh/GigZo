import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { View } from 'react-native';
import { useAppStore } from '@/store/useAppStore';

const GigZoTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#02555d',
    background: '#f7f8fa',
    card: '#ffffff',
    text: '#111827',
    border: '#e5e7eb',
  },
};

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });
  const { isOnboarded } = useAppStore();

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: '#f7f8fa' }} />;

  return (
    <ThemeProvider value={GigZoTheme}>
      <StatusBar style="dark" backgroundColor="#ffffff" />
      {!isOnboarded && <Redirect href="/onboarding/welcome" />}
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
