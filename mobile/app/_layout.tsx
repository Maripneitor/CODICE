import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { getToken } from '@/services/secure-storage/secure-store.service';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [authChecked, setAuthChecked] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  
  const segments = useSegments();
  const router = useRouter();

  // Check auth token
  useEffect(() => {
    async function checkAuth() {
      try {
        const token = await getToken();
        setHasToken(!!token);
      } catch (e) {
        console.error('Error checking auth token in layout:', e);
        setHasToken(false);
      } finally {
        setAuthChecked(true);
      }
    }
    checkAuth();
  }, []);

  // Handle navigation based on auth status
  useEffect(() => {
    if (!authChecked) return;

    SplashScreen.hideAsync();

    const inAuthGroup = segments[0] === '(auth)';

    if (!hasToken && !inAuthGroup) {
      // Redirect to login if not authenticated and trying to access app screens
      router.replace('/(auth)/login');
    } else if (hasToken && inAuthGroup) {
      // Redirect to home (tabs) if already authenticated and trying to access auth screens
      router.replace('/(tabs)');
    }
  }, [authChecked, hasToken, segments]);

  if (!authChecked) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/register" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
