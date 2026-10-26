import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
  useFonts,
} from '@expo-google-fonts/space-grotesk';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, type PropsWithChildren } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppShell } from '@/components/app-shell';
import { Logo } from '@/components/logo';
import { SessionGate } from '@/components/session-gate';
import { ToastProvider } from '@/components/ui/toast';
import { UpdateModal } from '@/components/update-modal';
import { SessionProvider, useSession } from '@/features/session/session-provider';
import { SettingsProvider, useSettings } from '@/features/settings/settings-provider';
import { ThemeProvider, useTheme } from '@/features/theme/theme-provider';
import { UpdatesProvider } from '@/features/updates/updates-provider';
import { fonts } from '@/features/theme/tokens';

if (Platform.OS !== 'web') {
  void SplashScreen.preventAutoHideAsync().catch(() => undefined);
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <ThemeProvider>
          <SessionProvider>
            <ToastProvider>
              <UpdatesProvider>
                <AppFrame fontsReady={fontsLoaded || !!fontError} />
              </UpdatesProvider>
            </ToastProvider>
          </SessionProvider>
        </ThemeProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

function AppFrame({ fontsReady }: { fontsReady: boolean }) {
  const { theme } = useTheme();
  const { hydrated } = useSettings();
  const { status } = useSession();
  const ready = fontsReady && hydrated && status !== 'loading';

  useEffect(() => {
    if (!ready) return;
    void SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      {ready ? <AppShell /> : <LoadingScreen />}
      {ready ? <SessionGate /> : null}
      <UpdateModal />
    </View>
  );
}

function LoadingScreen() {
  const { theme } = useTheme();
  return (
    <View style={[styles.loading, { backgroundColor: theme.bg }]}>
      <Logo size={54} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loading: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
