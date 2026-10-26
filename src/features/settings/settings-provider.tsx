import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import type { ThemeMode } from '@/features/theme/tokens';

const STORAGE_KEY = 'omnia.settings.v1';

export type AppSettings = {
  themeMode: ThemeMode;
  autoCheckUpdates: boolean;
};

const defaultSettings: AppSettings = {
  themeMode: 'system',
  autoCheckUpdates: true,
};

type SettingsContextValue = {
  settings: AppSettings;
  hydrated: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setAutoCheckUpdates: (enabled: boolean) => void;
  resetSettings: () => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

function sanitize(value: unknown): AppSettings {
  if (!value || typeof value !== 'object') return defaultSettings;
  const raw = value as Partial<AppSettings>;
  const themeMode: ThemeMode =
    raw.themeMode === 'light' || raw.themeMode === 'dark' || raw.themeMode === 'system'
      ? raw.themeMode
      : defaultSettings.themeMode;
  return {
    themeMode,
    autoCheckUpdates:
      typeof raw.autoCheckUpdates === 'boolean'
        ? raw.autoCheckUpdates
        : defaultSettings.autoCheckUpdates,
  };
}

export function SettingsProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!active || !stored) return;
        try {
          setSettings(sanitize(JSON.parse(stored)));
        } catch {
          // Ignore malformed local settings and fall back to defaults.
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setHydrated(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings)).catch(() => undefined);
  }, [settings, hydrated]);

  const setThemeMode = useCallback((themeMode: ThemeMode) => {
    setSettings((current) => ({ ...current, themeMode }));
  }, []);

  const setAutoCheckUpdates = useCallback((autoCheckUpdates: boolean) => {
    setSettings((current) => ({ ...current, autoCheckUpdates }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  const value = useMemo(
    () => ({ settings, hydrated, setThemeMode, setAutoCheckUpdates, resetSettings }),
    [settings, hydrated, setThemeMode, setAutoCheckUpdates, resetSettings]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used inside SettingsProvider');
  return context;
}
