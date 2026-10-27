import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge, IconTile } from '@/components/ui/controls';
import { Screen } from '@/components/ui/screen';
import { useSession } from '@/features/session/session-provider';
import { useTheme } from '@/features/theme/theme-provider';
import { fonts, radius } from '@/features/theme/tokens';
import { useUpdates } from '@/features/updates/updates-provider';
import { getDeviceName, getGreeting, getPlatformName, formatViewport } from '@/lib/device';
import { useMounted } from '@/lib/use-mounted';
import { useResponsive } from '@/lib/use-responsive';

export default function HomeScreen() {
  const { theme } = useTheme();
  const { isMobile, width, height } = useResponsive();
  const router = useRouter();
  const { session } = useSession();
  const updates = useUpdates();
  const mounted = useMounted();

  const firstName = session?.name.split(' ')[0] ?? 'there';
  const greeting = mounted ? getGreeting() : 'Welcome';
  const viewport = mounted ? formatViewport(width, height) : 'responsive';
  const today = mounted ? new Date().toDateString().toUpperCase() : 'ORBISNOVA';
  const platformName = getPlatformName();
  const deviceName = getDeviceName();

  const checkNow = () => {
    if (updates.hasUpdate) {
      updates.showUpdate();
      return;
    }
    void updates.checkForUpdates(true);
  };

  return (
    <Screen>
      <View style={styles.stack}>
        <LinearGradient
          colors={theme.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { padding: isMobile ? 24 : 40 }]}>
          <View pointerEvents="none" style={styles.heroArt}>
            <View style={[styles.heroRing, styles.ringLarge]} />
            <View style={[styles.heroRing, styles.ringSmall]} />
            <View style={styles.heroOrb} />
          </View>

          <View style={styles.heroTopRow}>
            <Badge label="OrbisNova · Live" tone="glass" dot />
            <AppText style={styles.heroDate}>{today}</AppText>
          </View>

          <View style={styles.heroCopy}>
            <AppText style={[styles.heroTitle, isMobile ? styles.heroTitleMobile : null]}>
              {greeting},{'\n'}
              {firstName}.
            </AppText>
            <AppText style={styles.heroSubtitle}>
              One fresh page for whatever this screen is today. Your workspace, tools and updates are
              waiting, and nothing is tied to an account.
            </AppText>
          </View>

          <View style={styles.heroBottom}>
            <View style={styles.deviceChip}>
              <View style={styles.liveDot} />
              <AppText style={styles.deviceChipText}>
                {platformName} · {viewport}
              </AppText>
            </View>
            <View style={styles.heroActions}>
              {updates.hasUpdate ? (
                <Button
                  label={`Update to ${updates.feed?.version}`}
                  variant="light"
                  size="sm"
                  icon="cloud-download-outline"
                  onPress={checkNow}
                />
              ) : null}
              <Button
                label="Open toolkit"
                variant="ghost"
                size="sm"
                iconAfter="arrow-forward"
                onPress={() => router.navigate('/tools')}
                style={styles.heroGhostButton}
              />
            </View>
          </View>
        </LinearGradient>

        <Card elevated>
          <View style={[styles.updateCard, isMobile ? styles.updateCardMobile : null]}>
            <View style={styles.updateMain}>
              <IconTile
                name={updates.hasUpdate ? 'cloud-download-outline' : 'checkmark-done'}
                tone={updates.hasUpdate ? 'coral' : 'mint'}
                size={46}
              />
              <View style={styles.updateCopy}>
                <View style={styles.updateTitleRow}>
                  <AppText variant="h3">
                    {updates.hasUpdate
                      ? `OrbisNova ${updates.feed?.version} is ready`
                      : 'You are on the latest build'}
                  </AppText>
                  <Badge
                    label={
                      updates.status === 'error'
                        ? 'Offline'
                        : updates.hasUpdate
                          ? 'New'
                          : 'Stable'
                    }
                    tone={
                      updates.status === 'error'
                        ? 'danger'
                        : updates.hasUpdate
                          ? 'coral'
                          : 'mint'
                    }
                    dot
                  />
                </View>
                <AppText variant="small" color={theme.textMuted}>
                  {updates.status === 'error'
                    ? `The feed could not be reached — ${updates.error ?? 'check your connection'}.`
                    : `Last checked ${updates.lastChecked ? timeAgoSafe(updates.lastChecked) : `never`} · auto-check every 4 minutes` }
                </AppText>
              </View>
            </View>
            <View style={[styles.updateActions, isMobile ? styles.updateActionsMobile : null]}>
              {updates.hasUpdate ? (
                <Button
                  label="View update"
                  icon="arrow-forward"
                  onPress={updates.showUpdate}
                  fullWidth={isMobile}
                />
              ) : (
                <Button
                  label={updates.isChecking ? 'Checking…' : 'Check for updates'}
                  variant="secondary"
                  icon="refresh"
                  loading={updates.isChecking}
                  onPress={() => void checkNow()}
                  fullWidth={isMobile}
                />
              )}
            </View>
          </View>
        </Card>

        <Card tone="transparent" elevated={false}>
          <View style={styles.welcome}>
            <View style={styles.welcomeCopy}>
              <AppText variant="h2">A clean page for whatever this screen is today.</AppText>
              <AppText variant="body" color={theme.textMuted} style={styles.welcomeBody}>
                OrbisNova is a small set of tools that stays yours and on this device. The toolkit lives
                on the Tools tab, your session and update details live in Settings, and this page stays
                uncluttered.
              </AppText>
            </View>
            <View style={styles.inspiration}>
              <AppText variant="small" color={theme.textFaint}>
                {deviceName} · {platformName} · {viewport}
              </AppText>
              <AppText variant="small" color={theme.textMuted}>
                Everything legal and credits are in Settings. New builds arrive here when they ship.
              </AppText>
            </View>
          </View>
        </Card>
      </View>
    </Screen>
  );
}

function timeAgoSafe(value: number | string | null) {
  if (value === null) return 'never';
  const ms = typeof value === 'number' ? value : Date.parse(value);
  if (Number.isNaN(ms)) return 'never';
  const diff = Date.now() - ms;
  if (diff < 60_000) return 'just now';
  const minutes = Math.round(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

const styles = StyleSheet.create({
  stack: {
    gap: 22,
  },
  hero: {
    borderRadius: radius.xxl,
    overflow: 'hidden',
    minHeight: 260,
    justifyContent: 'space-between',
    gap: 24,
  },
  heroArt: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  heroRing: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  ringLarge: {
    width: 420,
    height: 420,
    top: -160,
    right: -100,
  },
  ringSmall: {
    width: 220,
    height: 220,
    top: -40,
    right: 30,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  heroOrb: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 122, 89, 0.22)',
    bottom: -80,
    left: -40,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroDate: {
    color: 'rgba(255,255,255,0.46)',
    fontFamily: fonts.semibold,
    fontSize: 9.5,
    letterSpacing: 1.8,
  },
  heroCopy: {
    gap: 10,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontFamily: fonts.bold,
    fontSize: 48,
    lineHeight: 52,
    letterSpacing: -2,
  },
  heroTitleMobile: {
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -1.4,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.62)',
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    maxWidth: 560,
  },
  heroBottom: {
    gap: 14,
  },
  deviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3BE0AE',
  },
  deviceChipText: {
    color: 'rgba(255,255,255,0.72)',
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  heroGhostButton: {
    borderColor: 'rgba(255,255,255,0.22)',
  },
  updateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 18,
    padding: 18,
  },
  updateCardMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 14,
  },
  updateMain: {
    flexDirection: 'row',
    gap: 13,
    flex: 1,
  },
  updateCopy: {
    flex: 1,
    gap: 4,
  },
  updateTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  updateActions: {
    minWidth: 140,
    alignItems: 'flex-end',
  },
  updateActionsMobile: {
    alignItems: 'stretch',
    minWidth: 0,
  },
  welcome: {
    gap: 16,
  },
  welcomeCopy: {
    gap: 8,
  },
  welcomeBody: {
    lineHeight: 23,
    maxWidth: 720,
  },
  inspiration: {
    gap: 4,
  },
  web: {
    cursor: 'pointer',
  } as ViewStyle,
});
