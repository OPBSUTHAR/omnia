import { Ionicons } from '@expo/vector-icons';
import { Slot, usePathname, useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';
import {
  BackHandler,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Wordmark } from '@/components/logo';
import { AppText } from '@/components/ui/app-text';
import { useSession } from '@/features/session/session-provider';
import { useTheme } from '@/features/theme/theme-provider';
import { fonts, radius, space } from '@/features/theme/tokens';
import { useUpdates } from '@/features/updates/updates-provider';
import { shortId } from '@/lib/device';
import { REPO_URL } from '@/lib/links';
import { useResponsive } from '@/lib/use-responsive';
import * as Linking from 'expo-linking';

type NavItem = {
  href: Href;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
};

export const navItems: NavItem[] = [
  { href: '/', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { href: '/tools', label: 'Tools', icon: 'grid-outline', activeIcon: 'grid' },
  { href: '/settings', label: 'Settings', icon: 'settings-outline', activeIcon: 'settings' },
];

function isActive(pathname: string, href: Href): boolean {
  const path = String(href);
  if (path === '/') return pathname === '/';
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function AppShell() {
  const { theme } = useTheme();
  const { isDesktop } = useResponsive();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (pathname !== '/') {
        router.navigate('/');
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [pathname, router]);

  return (
    <View
      style={[
        styles.root,
        isDesktop ? styles.rootDesktop : null,
        { backgroundColor: theme.bg },
      ]}>
      {isDesktop ? <Sidebar pathname={pathname} /> : <MobileHeader pathname={pathname} />}
      <View style={styles.content}>
        <Slot />
      </View>
      {isDesktop ? null : <BottomNav pathname={pathname} />}
    </View>
  );
}

function Sidebar({ pathname }: { pathname: string }) {
  const { theme } = useTheme();
  const router = useRouter();
  const { session } = useSession();
  const { hasUpdate, showUpdate, currentVersion, feed } = useUpdates();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.sidebar,
        {
          backgroundColor: theme.isDark ? theme.bg : theme.surface,
          borderRightColor: theme.border,
          paddingTop: insets.top + 24,
          paddingBottom: Math.max(insets.bottom, 20),
        },
      ]}>
      <View style={styles.sidebarBrand}>
        <Wordmark size={34} color={theme.text} subtitle="One app. Every device." />
      </View>

      <AppText variant="caption" color={theme.textFaint} style={styles.navLabel}>
        Workspace
      </AppText>

      <View style={styles.navList}>
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Pressable
              key={String(item.href)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => router.navigate(item.href)}
              style={({ pressed }) => [
                styles.sidebarNavItem,
                active ? { backgroundColor: theme.accentSoft } : null,
                { opacity: pressed ? 0.72 : 1 },
                Platform.OS === 'web' ? styles.web : null,
              ]}>
              <Ionicons
                name={active ? item.activeIcon : item.icon}
                size={18}
                color={active ? theme.accent : theme.textMuted}
              />
              <AppText
                variant="small"
                color={active ? theme.accent : theme.textMuted}
                style={styles.sidebarNavText}>
                {item.label}
              </AppText>
              {active ? (
                <View style={[styles.activeDot, { backgroundColor: theme.accent }]} />
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.sidebarSpacer} />

      {hasUpdate ? (
        <Pressable
          onPress={showUpdate}
          style={({ pressed }) => [
            styles.updatePill,
            {
              backgroundColor: theme.coralSoft,
              borderColor: theme.isDark ? '#4A2A24' : '#F7D3C8',
              opacity: pressed ? 0.75 : 1,
            },
          ]}>
          <View style={[styles.updateDot, { backgroundColor: theme.coral }]} />
          <View style={styles.updatePillCopy}>
            <AppText variant="small" color={theme.coral} style={styles.updatePillTitle}>
              Update ready
            </AppText>
            <AppText variant="caption" color={theme.textMuted} style={styles.updatePillVersion}>
              v{feed?.version} available
            </AppText>
          </View>
          <Ionicons name="arrow-forward" size={14} color={theme.coral} />
        </Pressable>
      ) : null}

      <Pressable
        onPress={() => router.navigate('/settings')}
        style={({ pressed }) => [
          styles.sessionCard,
          {
            backgroundColor: theme.surfaceAlt,
            borderColor: theme.border,
            opacity: pressed ? 0.75 : 1,
          },
        ]}>
        <View style={[styles.sessionAvatar, { backgroundColor: theme.surface }]}>
          <AppText style={styles.sessionEmoji}>{session?.emoji ?? '🙂'}</AppText>
        </View>
        <View style={styles.sessionCopy}>
          <AppText variant="small" style={styles.sessionName} numberOfLines={1}>
            {session?.name ?? 'Your session'}
          </AppText>
          <AppText variant="caption" color={theme.textFaint} style={styles.sessionMeta}>
            {session ? shortId(session.deviceId).slice(0, 14) : 'local'}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={14} color={theme.textFaint} />
      </Pressable>

      <View style={styles.sidebarFooter}>
        <View style={styles.footerRow}>
          <View style={[styles.liveDot, { backgroundColor: theme.mint }]} />
          <AppText variant="caption" color={theme.textFaint}>
            Omnia v{currentVersion}
          </AppText>
        </View>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Open Omnia on GitHub"
          onPress={() => void Linking.openURL(REPO_URL)}
          style={({ pressed }) => [styles.githubButton, { opacity: pressed ? 0.6 : 1 }]}>
          <Ionicons name="logo-github" size={16} color={theme.textFaint} />
          <AppText variant="caption" color={theme.textFaint}>
            @OPBSUTHAR
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

function MobileHeader({ pathname }: { pathname: string }) {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useSession();
  const { hasUpdate, showUpdate } = useUpdates();
  void pathname;

  return (
    <View
      style={[
        styles.mobileHeader,
        {
          paddingTop: insets.top + 8,
          backgroundColor: theme.bg,
          borderBottomColor: theme.border,
        },
      ]}>
      <Wordmark size={31} color={theme.text} />
      <View style={styles.mobileActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={hasUpdate ? 'Update available' : 'Notifications'}
          onPress={() => {
            if (hasUpdate) showUpdate();
            else router.navigate('/settings');
          }}
          style={({ pressed }) => [
            styles.iconButton,
            { backgroundColor: theme.surfaceAlt, opacity: pressed ? 0.7 : 1 },
          ]}>
          <Ionicons
            name={hasUpdate ? 'cloud-download' : 'notifications-outline'}
            size={18}
            color={hasUpdate ? theme.coral : theme.textMuted}
          />
          {hasUpdate ? (
            <View style={[styles.bellDot, { backgroundColor: theme.coral, borderColor: theme.bg }]} />
          ) : null}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open settings"
          onPress={() => router.navigate('/settings')}
          style={({ pressed }) => [
            styles.avatarButton,
            { backgroundColor: theme.surfaceAlt, borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
          ]}>
          <AppText style={styles.avatarEmoji}>{session?.emoji ?? '🙂'}</AppText>
        </Pressable>
      </View>
    </View>
  );
}

function BottomNav({ pathname }: { pathname: string }) {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bottomNavHost,
        { paddingBottom: Math.max(insets.bottom, 10) },
      ]}
      pointerEvents="box-none">
      <View
        style={[
          styles.bottomNav,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            ...(Platform.OS === 'web'
              ? { boxShadow: '0 18px 50px rgba(15, 10, 35, 0.18)' }
              : { elevation: 14, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 10 } }),
          },
        ]}>
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Pressable
              key={String(item.href)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => router.navigate(item.href)}
              style={({ pressed }) => [
                styles.bottomNavItem,
                active ? { backgroundColor: theme.accentSoft } : null,
                { opacity: pressed ? 0.7 : 1 },
              ]}>
              <Ionicons
                name={active ? item.activeIcon : item.icon}
                size={19}
                color={active ? theme.accent : theme.textMuted}
              />
              <AppText
                variant="caption"
                color={active ? theme.accent : theme.textFaint}
                style={styles.bottomNavLabel}>
                {item.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    minWidth: 0,
  },
  root: {
    flex: 1,
  },
  rootDesktop: {
    flexDirection: 'row',
  },
  sidebar: {
    width: 264,
    borderRightWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 18,
  },
  sidebarBrand: {
    paddingHorizontal: 8,
    marginBottom: 34,
  },
  navLabel: {
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  navList: {
    gap: 4,
  },
  sidebarNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: radius.md,
  },
  sidebarNavText: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    flex: 1,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  sidebarSpacer: {
    flex: 1,
    minHeight: 24,
  },
  updatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    padding: 11,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  updateDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  updatePillCopy: {
    flex: 1,
    gap: 1,
  },
  updatePillTitle: {
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  updatePillVersion: {
    fontSize: 9,
    letterSpacing: 0.8,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sessionAvatar: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionEmoji: {
    fontSize: 17,
    lineHeight: 22,
  },
  sessionCopy: {
    flex: 1,
    gap: 1,
  },
  sessionName: {
    fontFamily: fonts.semibold,
    fontSize: 12.5,
  },
  sessionMeta: {
    fontSize: 8.5,
    letterSpacing: 1,
  },
  sidebarFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 4,
    paddingTop: 16,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  githubButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  mobileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 18,
    lineHeight: 22,
  },
  bottomNavHost: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingTop: 6,
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 62,
    borderRadius: radius.lg + 4,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 6,
    gap: 2,
  },
  bottomNavItem: {
    flex: 1,
    height: 50,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  bottomNavLabel: {
    fontSize: 8.5,
    letterSpacing: 0.9,
  },
  web: {
    cursor: 'pointer',
    userSelect: 'none',
  },
});
