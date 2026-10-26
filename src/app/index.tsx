import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge, IconTile } from '@/components/ui/controls';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { useSession } from '@/features/session/session-provider';
import { useTheme } from '@/features/theme/theme-provider';
import { fonts, radius } from '@/features/theme/tokens';
import { useUpdates } from '@/features/updates/updates-provider';
import {
  formatViewport,
  getDeviceName,
  getGreeting,
  getPlatformName,
  timeAgo,
} from '@/lib/device';
import { useMounted } from '@/lib/use-mounted';
import { useResponsive } from '@/lib/use-responsive';

const tools = [
  {
    icon: 'timer-outline' as const,
    tone: 'accent' as const,
    title: 'Focus timer',
    description: 'A 5, 15 or 25 minute sprint with a calm progress bar and haptic chime.',
    meta: 'Pomodoro · offline',
  },
  {
    icon: 'swap-horizontal-outline' as const,
    tone: 'coral' as const,
    title: 'Unit converter',
    description: 'Length, weight and temperature, converted instantly as you type.',
    meta: '6 units · instant',
  },
  {
    icon: 'create-outline' as const,
    tone: 'mint' as const,
    title: 'Scratchpad',
    description: 'A quiet place for a thought, a link or today’s list. Saved locally.',
    meta: 'Autosaves · private',
  },
];

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
  const today = mounted ? new Date().toDateString().toUpperCase() : 'OMNIA';
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
            <Badge label="Omnia · Live" tone="glass" dot />
            <AppText style={styles.heroDate}>{today}</AppText>
          </View>

          <View style={styles.heroCopy}>
            <AppText
              style={[
                styles.heroTitle,
                isMobile ? styles.heroTitleMobile : null,
              ]}>
              {greeting},{'\n'}
              {firstName}.
            </AppText>
            <AppText style={styles.heroSubtitle}>
              One app for every screen you own. Your session, toolkit and update alerts live
              right here — no app store required.
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
              <Button
                label={updates.hasUpdate ? `Update to ${updates.feed?.version}` : 'Check for updates'}
                variant="light"
                size="sm"
                icon={updates.hasUpdate ? 'cloud-download-outline' : 'refresh'}
                loading={updates.isChecking}
                onPress={checkNow}
              />
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

        <View style={[styles.statsRow, isMobile ? styles.statsRowMobile : null]}>
          <StatTile
            label="Session"
            value={`${session?.emoji ?? '🙂'} ${session?.name ?? 'Friend'}`}
            sub="Local to this device"
            compact={isMobile}
          />
          <StatTile
            label="Device"
            value={deviceName}
            sub={`${platformName} · ${viewport}`}
            compact={isMobile}
          />
          <StatTile
            label="Build"
            value={`v${updates.currentVersion}`}
            sub={updates.hasUpdate ? `v${updates.feed?.version} ready` : 'Up to date'}
            tone={updates.hasUpdate ? theme.coral : theme.mint}
            compact={isMobile}
          />
        </View>

        <View>
          <SectionHeader
            eyebrow="Stay current"
            title="Live updates, built in"
            subtitle="Omnia checks its release feed when it opens, when you come back, and every four minutes. The dialog appears the moment a new build is published."
            action={
              <Button
                label="Check now"
                variant="ghost"
                size="sm"
                icon="refresh"
                loading={updates.isChecking}
                onPress={() => void updates.checkForUpdates(true)}
              />
            }
          />
          <Card padded={false} elevated>
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
                        ? `Omnia ${updates.feed?.version} is ready`
                        : `You're on the latest build`}
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
                      : `Last checked ${timeAgo(updates.lastChecked)} · auto-check every 4 minutes`}
                  </AppText>
                  <AppText
                    variant="mono"
                    color={theme.textFaint}
                    numberOfLines={1}
                    selectable
                    style={styles.feedUrl}>
                    raw.githubusercontent.com/OPBSUTHAR/omnia/main/public/updates/latest.json
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
                    onPress={() => void updates.checkForUpdates(true)}
                    fullWidth={isMobile}
                  />
                )}
              </View>
            </View>
            <View
              style={[
                styles.updateFootnote,
                { borderTopColor: theme.border, backgroundColor: theme.surfaceAlt },
              ]}>
              <Ionicons name="git-branch-outline" size={13} color={theme.textFaint} />
              <AppText variant="small" color={theme.textFaint} style={styles.footnoteText}>
                Release flow: bump the version → push a tag → GitHub Actions builds the APK,
                Windows installer and Linux AppImage → this dialog appears in the app.
              </AppText>
            </View>
          </Card>
        </View>

        <View>
          <SectionHeader
            eyebrow="The toolkit"
            title="Small tools. One home."
            subtitle="The first three utilities are live. This is the seed of the everything-app."
            action={
              <Button
                label="Open tools"
                variant="ghost"
                size="sm"
                iconAfter="arrow-forward"
                onPress={() => router.navigate('/tools')}
              />
            }
          />
          <View style={styles.toolGrid}>
            {tools.map((tool) => (
              <ToolCard
                key={tool.title}
                {...tool}
                onPress={() => router.navigate('/tools')}
              />
            ))}
          </View>
        </View>
      </View>
    </Screen>
  );
}

function StatTile({
  label,
  value,
  sub,
  tone,
  compact = false,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: string;
  compact?: boolean;
}) {
  const { theme } = useTheme();
  return (
    <Card padded={false} style={[styles.statCard, compact ? styles.statCardCompact : null]}>
      <View style={[styles.statInner, compact ? styles.statInnerCompact : null]}>
        <AppText
          variant="caption"
          color={theme.textFaint}
          style={[styles.statLabel, compact ? styles.statLabelCompact : null]}>
          {label}
        </AppText>
        <View style={[styles.statBody, compact ? styles.statBodyCompact : null]}>
          <AppText variant="h3" numberOfLines={1} style={styles.statValue}>
            {value}
          </AppText>
          <View style={styles.statSubRow}>
            {tone ? <View style={[styles.statDot, { backgroundColor: tone }]} /> : null}
            <AppText
              variant="small"
              color={theme.textMuted}
              numberOfLines={1}
              style={styles.statSub}>
              {sub}
            </AppText>
          </View>
        </View>
      </View>
    </Card>
  );
}

function ToolCard({
  icon,
  tone,
  title,
  description,
  meta,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tone: 'accent' | 'coral' | 'mint';
  title: string;
  description: string;
  meta: string;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [
        styles.toolCard,
        { opacity: pressed ? 0.82 : 1 },
        Platform.OS === 'web' ? styles.web : null,
      ]}>
      <Card elevated={hovered} style={styles.toolCardInner}>
        <IconTile name={icon} tone={tone} size={42} iconSize={20} />
        <AppText variant="h3" style={styles.toolTitle}>
          {title}
        </AppText>
        <AppText variant="body" color={theme.textMuted} style={styles.toolDescription}>
          {description}
        </AppText>
        <View style={styles.toolFooter}>
          <AppText variant="caption" color={theme.textFaint}>
            {meta}
          </AppText>
          <Ionicons name="arrow-forward" size={14} color={theme.textFaint} />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 30,
  },
  hero: {
    borderRadius: radius.xxl,
    overflow: 'hidden',
    minHeight: 300,
    justifyContent: 'space-between',
    gap: 26,
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
    gap: 12,
    flex: 1,
    justifyContent: 'center',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontFamily: fonts.bold,
    fontSize: 54,
    lineHeight: 57,
    letterSpacing: -2.2,
  },
  heroTitleMobile: {
    fontSize: 37,
    lineHeight: 41,
    letterSpacing: -1.4,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.62)',
    fontFamily: fonts.regular,
    fontSize: 14.5,
    lineHeight: 23,
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
    borderRadius: radius.pill,
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
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  heroGhostButton: {
    borderColor: 'rgba(255,255,255,0.22)',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  statsRowMobile: {
    flexDirection: 'column',
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: 100,
  },
  statCardCompact: {
    flex: 0,
    flexBasis: 'auto',
    minWidth: 0,
  },
  statInner: {
    padding: 14,
    gap: 4,
  },
  statInnerCompact: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
  },
  statLabel: {
    fontSize: 8.5,
    letterSpacing: 1.2,
  },
  statLabelCompact: {
    width: 64,
    fontSize: 9,
    paddingTop: 4,
  },
  statBody: {
    gap: 3,
  },
  statBodyCompact: {
    flex: 1,
  },
  statValue: {
    fontSize: 14.5,
    lineHeight: 19,
  },
  statSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  statSub: {
    fontSize: 10.5,
    lineHeight: 14,
    flexShrink: 1,
  },
  updateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
    padding: 22,
  },
  updateCardMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 16,
  },
  updateMain: {
    flexDirection: 'row',
    gap: 14,
    flex: 1,
    alignItems: 'flex-start',
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
  feedUrl: {
    marginTop: 4,
    opacity: 0.72,
  },
  updateActions: {
    minWidth: 150,
    alignItems: 'flex-end',
  },
  updateActionsMobile: {
    alignItems: 'stretch',
    minWidth: 0,
  },
  updateFootnote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footnoteText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
  },
  toolGrid: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  toolCard: {
    flexGrow: 1,
    flexBasis: 240,
    minWidth: 220,
  },
  toolCardInner: {
    padding: 20,
    gap: 10,
    height: '100%',
  },
  toolTitle: {
    marginTop: 2,
  },
  toolDescription: {
    fontSize: 13.5,
    lineHeight: 21,
    flex: 1,
  },
  toolFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    gap: 8,
  },
  web: {
    cursor: 'pointer',
  } as ViewStyle,
});
