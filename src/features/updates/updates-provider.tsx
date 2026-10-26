import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Linking from 'expo-linking';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { AppState, Platform } from 'react-native';

import { useSession } from '@/features/session/session-provider';
import { useSettings } from '@/features/settings/settings-provider';
import { getFeedUrl, compareVersions, isValidVersion } from '@/features/updates/feed';
import type { UpdateCheckStatus, UpdateFeed } from '@/features/updates/types';
import { useToast } from '@/components/ui/toast';
import {
  LATEST_APK_URL,
  LATEST_LINUX_URL,
  LATEST_WINDOWS_URL,
  WEB_URL,
} from '@/lib/links';
import { getDesktopPlatform, isElectron } from '@/lib/device';

const CURRENT_VERSION = Constants.expoConfig?.version ?? '1.0.0';
const DISMISSED_KEY = 'omnia.updates.dismissed.v1';
const LAST_CHECKED_KEY = 'omnia.updates.last-checked.v1';
const CACHED_FEED_KEY = 'omnia.updates.feed.v1';

type UpdatesContextValue = {
  currentVersion: string;
  feed: UpdateFeed | null;
  status: UpdateCheckStatus;
  hasUpdate: boolean;
  isChecking: boolean;
  isInstalling: boolean;
  installProgress: number | null;
  lastChecked: string | null;
  error: string | null;
  modalVisible: boolean;
  checkForUpdates: (manual?: boolean) => Promise<void>;
  dismissUpdate: () => void;
  showUpdate: () => void;
  installUpdate: () => Promise<void>;
};

const UpdatesContext = createContext<UpdatesContextValue | null>(null);

function normalizeFeed(value: unknown): UpdateFeed | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<UpdateFeed>;
  if (!isValidVersion(raw.version)) return null;
  const notes = Array.isArray(raw.notes)
    ? raw.notes.filter((note): note is string => typeof note === 'string').slice(0, 8)
    : [];
  return {
    version: raw.version.trim().replace(/^v/i, ''),
    releasedAt: typeof raw.releasedAt === 'string' ? raw.releasedAt : undefined,
    notes,
    apkUrl: typeof raw.apkUrl === 'string' ? raw.apkUrl : undefined,
    windowsUrl: typeof raw.windowsUrl === 'string' ? raw.windowsUrl : undefined,
    linuxUrl: typeof raw.linuxUrl === 'string' ? raw.linuxUrl : undefined,
    webUrl: typeof raw.webUrl === 'string' ? raw.webUrl : undefined,
    docsUrl: typeof raw.docsUrl === 'string' ? raw.docsUrl : undefined,
    releasesUrl: typeof raw.releasesUrl === 'string' ? raw.releasesUrl : undefined,
    mandatory: raw.mandatory === true,
  };
}

export function UpdatesProvider({ children }: PropsWithChildren) {
  const { settings } = useSettings();
  const { status: sessionStatus } = useSession();
  const { showToast } = useToast();

  const [feed, setFeed] = useState<UpdateFeed | null>(null);
  const [status, setStatus] = useState<UpdateCheckStatus>('idle');
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState<number | null>(null);
  const dismissedRef = useRef<string | null>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      AsyncStorage.getItem(DISMISSED_KEY),
      AsyncStorage.getItem(LAST_CHECKED_KEY),
      AsyncStorage.getItem(CACHED_FEED_KEY),
    ])
      .then(([dismissed, checkedAt, cached]) => {
        if (!active) return;
        dismissedRef.current = dismissed;
        if (checkedAt) setLastChecked(checkedAt);
        if (cached) {
          try {
            const parsed = normalizeFeed(JSON.parse(cached));
            if (parsed) setFeed(parsed);
          } catch {
            // A corrupt cache should never block the app.
          }
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

  const checkForUpdates = useCallback(
    async (manual = false) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setStatus('checking');
      setError(null);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      try {
        const response = await fetch(`${getFeedUrl()}?t=${Date.now()}`, {
          signal: controller.signal,
          headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
        });
        if (!response.ok) throw new Error(`Update feed returned HTTP ${response.status}`);
        const parsed = normalizeFeed(await response.json());
        if (!parsed) throw new Error('The update feed format was not recognised.');

        const checkedAt = new Date().toISOString();
        setFeed(parsed);
        setLastChecked(checkedAt);
        setStatus(
          compareVersions(parsed.version, CURRENT_VERSION) > 0 ? 'available' : 'up-to-date'
        );
        AsyncStorage.setItem(LAST_CHECKED_KEY, checkedAt).catch(() => undefined);
        AsyncStorage.setItem(CACHED_FEED_KEY, JSON.stringify(parsed)).catch(() => undefined);

        const newer = compareVersions(parsed.version, CURRENT_VERSION) > 0;
        if (newer && (manual || dismissedRef.current !== parsed.version)) {
          setModalVisible(true);
        }
        if (manual) {
          showToast(
            newer
              ? `Omnia ${parsed.version} is ready — you're on v${CURRENT_VERSION}.`
              : `You're on the latest build (v${CURRENT_VERSION}).`,
            { kind: newer ? 'info' : 'success' }
          );
        }
      } catch (caught) {
        const message =
          caught instanceof Error && caught.name === 'AbortError'
            ? 'The update check timed out.'
            : caught instanceof Error
              ? caught.message
              : 'Unknown update check error.';
        setStatus('error');
        setError(message);
        if (manual) {
          showToast('Could not reach the update feed. Check your connection and retry.', {
            kind: 'error',
          });
        }
      } finally {
        clearTimeout(timeout);
        busyRef.current = false;
      }
    },
    [showToast]
  );

  useEffect(() => {
    if (!hydrated || !settings.autoCheckUpdates || sessionStatus !== 'ready') return;
    const initial = setTimeout(() => {
      void checkForUpdates(false);
    }, 2200);
    const interval = setInterval(() => {
      void checkForUpdates(false);
    }, 4 * 60 * 1000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void checkForUpdates(false);
    });
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
      subscription.remove();
    };
  }, [hydrated, settings.autoCheckUpdates, sessionStatus, checkForUpdates]);

  useEffect(() => {
    if (sessionStatus !== 'ready') setModalVisible(false);
  }, [sessionStatus]);

  const hasUpdate = feed ? compareVersions(feed.version, CURRENT_VERSION) > 0 : false;

  const dismissUpdate = useCallback(() => {
    setModalVisible(false);
    if (!feed) return;
    dismissedRef.current = feed.version;
    AsyncStorage.setItem(DISMISSED_KEY, feed.version).catch(() => undefined);
  }, [feed]);

  const showUpdate = useCallback(() => {
    if (!hasUpdate) return;
    setModalVisible(true);
  }, [hasUpdate]);

  const installUpdate = useCallback(async () => {
    if (!feed || isInstalling) return;

    // In a browser/PWA the newest build is already deployed, so a reload is
    // the update. Desktop and Android download a real installer.
    if (Platform.OS === 'web' && !isElectron()) {
      setModalVisible(false);
      if (typeof window !== 'undefined') window.location.reload();
      return;
    }

    const desktop = getDesktopPlatform();
    const target =
      Platform.OS === 'android'
        ? feed.apkUrl ?? LATEST_APK_URL
        : desktop === 'windows'
          ? feed.windowsUrl ?? LATEST_WINDOWS_URL
          : desktop === 'linux'
            ? feed.linuxUrl ?? LATEST_LINUX_URL
            : feed.webUrl ?? WEB_URL;

    if (Platform.OS === 'android') {
      setIsInstalling(true);
      setInstallProgress(0);
      try {
        if (!FileSystem.cacheDirectory) {
          throw new Error('This device has no writable cache directory.');
        }
        const destination = `${FileSystem.cacheDirectory}omnia-${feed.version}.apk`;
        await FileSystem.deleteAsync(destination, { idempotent: true }).catch(() => undefined);
        const download = FileSystem.createDownloadResumable(
          target,
          destination,
          { headers: { Accept: 'application/vnd.android.package-archive' } },
          (progress) => {
            if (progress.totalBytesExpectedToWrite > 0) {
              setInstallProgress(
                Math.min(1, progress.totalBytesWritten / progress.totalBytesExpectedToWrite)
              );
            }
          }
        );
        const result = await download.downloadAsync();
        if (!result?.uri) throw new Error('The APK download did not complete.');
        setInstallProgress(1);

        const contentUri = await FileSystem.getContentUriAsync(result.uri);
        setModalVisible(false);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          type: 'application/vnd.android.package-archive',
          flags: 1,
        });
        showToast('Download complete. Confirm the install in the system dialog.', {
          kind: 'success',
        });
      } catch (caught) {
        const message =
          caught instanceof Error ? caught.message : 'The update could not be installed.';
        if (/security|permission|unknown|not allowed/i.test(message)) {
          const packageName =
            Constants.expoConfig?.android?.package ?? 'com.opbsuthar.omnia';
          await IntentLauncher.startActivityAsync(
            'android.settings.MANAGE_UNKNOWN_APP_SOURCES',
            { data: `package:${packageName}` }
          ).catch(() => undefined);
          showToast('Allow Omnia to install apps, then tap Update again.', { kind: 'error' });
        } else {
          showToast(`Update failed: ${message}`, { kind: 'error' });
        }
      } finally {
        setIsInstalling(false);
        setInstallProgress(null);
      }
      return;
    }

    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.open(target, '_blank', 'noopener,noreferrer');
      } else {
        await Linking.openURL(target);
      }
      showToast(
        desktop
          ? 'Download started — run the installer to update Omnia.'
          : 'Opening the latest build in a new tab.',
        { kind: 'success' }
      );
      setModalVisible(false);
    } catch {
      showToast('Could not open the download link. Try the releases page.', { kind: 'error' });
    }
  }, [feed, isInstalling, showToast]);

  const value = useMemo<UpdatesContextValue>(
    () => ({
      currentVersion: CURRENT_VERSION,
      feed,
      status,
      hasUpdate,
      isChecking: status === 'checking',
      isInstalling,
      installProgress,
      lastChecked,
      error,
      modalVisible,
      checkForUpdates,
      dismissUpdate,
      showUpdate,
      installUpdate,
    }),
    [
      feed,
      status,
      hasUpdate,
      isInstalling,
      installProgress,
      lastChecked,
      error,
      modalVisible,
      checkForUpdates,
      dismissUpdate,
      showUpdate,
      installUpdate,
    ]
  );

  return <UpdatesContext.Provider value={value}>{children}</UpdatesContext.Provider>;
}

export function useUpdates() {
  const context = useContext(UpdatesContext);
  if (!context) throw new Error('useUpdates must be used inside UpdatesProvider');
  return context;
}
