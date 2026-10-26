import * as SystemUI from 'expo-system-ui';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type PropsWithChildren,
} from 'react';
import { Platform, useColorScheme } from 'react-native';

import { useMounted } from '@/lib/use-mounted';

import { useSettings } from '@/features/settings/settings-provider';
import {
  darkTheme,
  lightTheme,
  type ResolvedScheme,
  type Theme,
  type ThemeMode,
} from '@/features/theme/tokens';

type ThemeContextValue = {
  theme: Theme;
  mode: ThemeMode;
  resolved: ResolvedScheme;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const { settings, setThemeMode } = useSettings();
  const systemScheme = useColorScheme();
  const mounted = useMounted();
  const resolved: ResolvedScheme =
    !mounted
      ? 'light'
      : settings.themeMode === 'system'
        ? systemScheme === 'dark'
          ? 'dark'
          : 'light'
        : settings.themeMode;
  const theme = resolved === 'dark' ? darkTheme : lightTheme;

  useEffect(() => {
    if (Platform.OS === 'web') return;
    SystemUI.setBackgroundColorAsync(theme.bg).catch(() => undefined);
  }, [theme.bg]);

  const value = useMemo(
    () => ({ theme, mode: settings.themeMode, resolved, setMode: setThemeMode }),
    [theme, settings.themeMode, resolved, setThemeMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}
