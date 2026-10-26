import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Badge, IconTile, Segmented } from '@/components/ui/controls';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { TextField } from '@/components/ui/text-field';
import { useToast } from '@/components/ui/toast';
import { useSession, sessionEmojis } from '@/features/session/session-provider';
import { useSettings } from '@/features/settings/settings-provider';
import { useTheme } from '@/features/theme/theme-provider';
import { fonts, radius, space } from '@/features/theme/tokens';
import { useUpdates } from '@/features/updates/updates-provider';
import type { ThemeMode } from '@/features/theme/tokens';
import {
  formatDate,
  formatViewport,
  getPlatformSummary,
  shortId,
  timeAgo,
} from '@/lib/device';
import { confirmAction } from '@/lib/dialog';
import { ISSUES_URL, RELEASES_URL, REPO_URL } from '@/lib/links';
import { openExternal } from '@/lib/open-external';
import { useResponsive } from '@/lib/use-responsive';

const themeOptions: { value: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'system', label: 'System', icon: 'phone-portrait-outline' },
  { value: 'light', label: 'Light', icon: 'sunny-outline' },
  { value: 'dark', label: 'Dark', icon: 'moon-outline' },
];

export default function SettingsScreen() {
  const { theme, resolved, setMode } = useTheme();
  const { settings, setAutoCheckUpdates, resetSettings } = useSettings();
  const { session, updateSession, endSession } = useSession();
  const updates = useUpdates();
  const { showToast } = useToast();
  const { width, height, isMobile } = useResponsive();

  const [name, setName] = useState(session?.name ?? '');
  const [emoji, setEmoji] = useState(session?.emoji ?? sessionEmojis[0]);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    setName(session?.name ?? '');
    setEmoji(session?.emoji ?? sessionEmojis[0]);
  }, [session?.name, session?.emoji]);

  const changed = !!session && (name.trim() !== session.name || emoji !== session.emoji);
  const canSave = changed && name.trim().length >= 2;

  const saveProfile = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await updateSession({ name: name.trim(), emoji });
      showToast('Session updated on this device.', { kind: 'success' });
    } catch {
      showToast('Could not update your session.', { kind: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const signOut = () => {
    confirmAction({
      title: 'End this session?',
      message: 'Your session stays on this device until you start a new one. Notes are kept.',
      confirmLabel: 'End session',
      destructive: true,
      onConfirm: async () => {
        await endSession();
      },
    });
  };

  const resetDevice = () => {
    confirmAction({
      title: 'Reset Omnia on this device?',
      message:
        'This clears your session, scratchpad, theme and update history. The app stays installed and you can start fresh.',
      confirmLabel: 'Reset everything',
      destructive: true,
      onConfirm: async () => {
        setResetting(true);
        try {
          await AsyncStorage.multiRemove([
            'omnia.scratchpad.v1',
            'omnia.settings.v1',
            'omnia.updates.dismissed.v1',
            'omnia.updates.feed.v1',
            'omnia.updates.last-checked.v1',
          ]);
          resetSettings();
          await endSession();
        } finally {
          setResetting(false);
        }
      },
    });
  };

  const buildNumber =
    Constants.expoConfig?.android?.versionCode ??
    Constants.expoConfig?.ios?.buildNumber ??
    1;
  const sdkVersion = Constants.expoConfig?.sdkVersion ?? '58';

  return (
    <Screen maxWidth={1040}>
      <View style={styles.stack}>
        <View style={styles.header}>
          <AppText variant="caption" color={theme.accent}>
            Settings
          </AppText>
          <AppText variant="displaySmall">Make Omnia yours.</AppText>
          <AppText variant="body" color={theme.textMuted} style={styles.lede}>
            Everything here is local to this device. No account, no server, no tracking.
          </AppText>
        </View>

        <View style={styles.grid}>
          <Card style={[styles.profileCard, isMobile ? styles.cardMobile : null]}>
            <View style={styles.profileHeader}>
              <View style={[styles.avatar, { backgroundColor: theme.accentSoft }]}>
                <AppText style={styles.avatarEmoji}>{session?.emoji ?? '🙂'}</AppText>
              </View>
              <View style={styles.profileCopy}>
                <AppText variant="h3">{session?.name ?? 'Your session'}</AppText>
                <AppText variant="small" color={theme.textMuted}>
                  {session ? `Since ${formatDate(session.createdAt)}` : 'Not started'}
                </AppText>
              </View>
              <Badge label="Local" tone="mint" dot />
            </View>

            <TextField
              label="Display name"
              value={name}
              onChangeText={setName}
              maxLength={32}
              autoCapitalize="words"
              placeholder="Your name"
            />

            <View style={styles.emojiSection}>
              <AppText variant="caption" color={theme.textFaint}>
                Badge
              </AppText>
              <View style={styles.emojiRow}>
                {sessionEmojis.map((option) => {
                  const selected = option === emoji;
                  return (
                    <Pressable
                      key={option}
                      accessibilityRole="button"
                      accessibilityLabel={`Choose ${option}`}
                      accessibilityState={{ selected }}
                      onPress={() => setEmoji(option)}
                      style={({ pressed }) => [
                        styles.emojiButton,
                        {
                          backgroundColor: selected ? theme.accentSoft : theme.surfaceAlt,
                          borderColor: selected ? theme.accent : theme.border,
                          opacity: pressed ? 0.7 : 1,
                        },
                      ]}>
                      <AppText style={styles.emojiText}>{option}</AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.profileActions}>
              <Button
                label="Save changes"
                icon="checkmark"
                size="sm"
                disabled={!canSave}
                loading={saving}
                onPress={() => void saveProfile()}
              />
              <Button
                label="End session"
                icon="log-out-outline"
                variant="ghost"
                size="sm"
                onPress={signOut}
              />
            </View>

            <View style={[styles.metaBox, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              <MetaRow label="Session id" value={session ? shortId(session.id).slice(0, 17) : '—'} />
              <MetaRow label="Device id" value={session ? shortId(session.deviceId).slice(0, 17) : '—'} />
            </View>
          </Card>

          <Card style={[styles.appearanceCard, isMobile ? styles.cardMobile : null]}>
            <View style={styles.cardHeader}>
              <IconTile name="color-palette-outline" tone="accent" size={40} iconSize={19} />
              <View style={styles.cardHeaderText}>
                <AppText variant="h3">Appearance</AppText>
                <AppText variant="small" color={theme.textMuted}>
                  Currently {resolved}
                </AppText>
              </View>
            </View>
            <Segmented options={themeOptions} value={settings.themeMode} onChange={setMode} />
            <AppText variant="small" color={theme.textMuted}>
              System follows your phone or browser. Light and dark are applied instantly across
              every screen.
            </AppText>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.toggleRow}>
              <View style={styles.toggleCopy}>
                <AppText variant="bodyStrong">Automatic updates</AppText>
                <AppText variant="small" color={theme.textMuted}>
                  Check the release feed on launch and every four minutes.
                </AppText>
              </View>
              <Switch
                value={settings.autoCheckUpdates}
                onValueChange={setAutoCheckUpdates}
                trackColor={{ false: theme.borderStrong, true: theme.accent }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={theme.borderStrong}
              />
            </View>
          </Card>
        </View>

        <View>
          <SectionHeader
            eyebrow="Delivery"
            title="Updates"
            subtitle="Omnia is distributed directly through GitHub — no store review, no waiting."
            action={
              <Button
                label={updates.hasUpdate ? 'View update' : 'Check now'}
                variant={updates.hasUpdate ? 'primary' : 'ghost'}
                size="sm"
                icon={updates.hasUpdate ? 'cloud-download-outline' : 'refresh'}
                loading={updates.isChecking}
                onPress={() =>
                  updates.hasUpdate ? updates.showUpdate() : void updates.checkForUpdates(true)
                }
              />
            }
          />
          <Card style={styles.updatesCard}>
            {updates.hasUpdate ? (
              <View
                style={[
                  styles.updateBanner,
                  { backgroundColor: theme.coralSoft, borderColor: theme.isDark ? '#4A2A24' : '#F7D3C8' },
                ]}>
                <Ionicons name="sparkles" size={16} color={theme.coral} />
                <AppText variant="small" color={theme.coral} style={styles.bannerText}>
                  Omnia {updates.feed?.version} is published. Install it over this build — your
                  session stays intact.
                </AppText>
                <Button
                  label="Update"
                  size="sm"
                  onPress={() => void updates.installUpdate()}
                />
              </View>
            ) : null}

            <View style={styles.updateStats}>
              <UpdateStat label="Installed" value={`v${updates.currentVersion}`} />
              <UpdateStat label="Latest" value={updates.feed ? `v${updates.feed.version}` : '—'} />
              <UpdateStat label="Last checked" value={timeAgo(updates.lastChecked)} />
              <UpdateStat label="Channel" value="Stable" />
            </View>

            {updates.status === 'error' ? (
              <View style={[styles.errorBox, { backgroundColor: theme.dangerSoft }]}>
                <Ionicons name="cloud-offline-outline" size={15} color={theme.danger} />
                <AppText variant="small" color={theme.danger} style={styles.bannerText}>
                  {updates.error ?? 'The update feed could not be reached.'}
                </AppText>
              </View>
            ) : null}

            <View style={styles.feedRow}>
              <AppText variant="caption" color={theme.textFaint}>
                Feed
              </AppText>
              <AppText variant="mono" color={theme.textFaint} numberOfLines={1} selectable style={styles.feedValue}>
                raw.githubusercontent.com/OPBSUTHAR/omnia/main/public/updates/latest.json
              </AppText>
            </View>

            <View style={styles.linkRow}>
              <Button
                label="All releases"
                variant="secondary"
                size="sm"
                icon="logo-github"
                onPress={() => void openExternal(RELEASES_URL)}
              />
              <Button
                label="Download APK"
                variant="subtle"
                size="sm"
                icon="download-outline"
                onPress={() => void updates.installUpdate()}
              />
            </View>
          </Card>
        </View>

        <View style={styles.grid}>
          <Card style={[styles.aboutCard, isMobile ? styles.cardMobile : null]}>
            <View style={styles.cardHeader}>
              <IconTile name="information-circle-outline" tone="coral" size={40} iconSize={19} />
              <View style={styles.cardHeaderText}>
                <AppText variant="h3">About Omnia</AppText>
                <AppText variant="small" color={theme.textMuted}>
                  One app. Every device.
                </AppText>
              </View>
            </View>

            <View style={styles.aboutRows}>
              <MetaRow label="Version" value={`${updates.currentVersion} (${buildNumber})`} />
              <MetaRow label="Runtime" value={`Expo SDK ${sdkVersion}`} />
              <MetaRow label="Platform" value={getPlatformSummary()} />
              <MetaRow label="Viewport" value={formatViewport(width, height)} />
              <MetaRow label="License" value="MIT" />
            </View>

            <View style={styles.aboutLinks}>
              <TextLink label="Repository" url={REPO_URL} />
              <TextLink label="Releases" url={RELEASES_URL} />
              <TextLink label="Report an issue" url={ISSUES_URL} />
            </View>

            <AppText variant="small" color={theme.textFaint}>
              Designed and built by Omprakash Suthar (@OPBSUTHAR). Local-first by default.
            </AppText>
          </Card>

          <Card style={[styles.dataCard, isMobile ? styles.cardMobile : null]}>
            <View style={styles.cardHeader}>
              <IconTile name="shield-checkmark-outline" tone="mint" size={40} iconSize={19} />
              <View style={styles.cardHeaderText}>
                <AppText variant="h3">Your data</AppText>
                <AppText variant="small" color={theme.textMuted}>
                  Yours, on this device
                </AppText>
              </View>
            </View>
            <AppText variant="small" color={theme.textMuted}>
              Your session, scratchpad and preferences are stored with the platform’s local
              storage. Omnia never uploads them. Clearing this device’s storage removes them.
            </AppText>
            <View style={[styles.dataBox, { backgroundColor: theme.dangerSoft }]}>
              <AppText variant="small" color={theme.danger} style={styles.bannerText}>
                Start over if you want to try onboarding again or wipe the local scratchpad.
              </AppText>
              <Button
                label="Reset local data"
                variant="danger"
                size="sm"
                icon="trash-outline"
                loading={resetting}
                onPress={resetDevice}
              />
            </View>
          </Card>
        </View>

        <AppText variant="small" color={theme.textFaint} align="center">
          Omnia v{updates.currentVersion} · {isMobile ? 'phone' : 'desktop'} layout · Built with
          Expo + React Native
        </AppText>
      </View>
    </Screen>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  return (
    <View style={styles.metaRow}>
      <AppText variant="small" color={theme.textFaint}>
        {label}
      </AppText>
      <AppText variant="small" color={theme.textMuted} numberOfLines={1} style={styles.metaValue}>
        {value}
      </AppText>
    </View>
  );
}

function UpdateStat({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.updateStat, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
      <AppText variant="caption" color={theme.textFaint}>
        {label}
      </AppText>
      <AppText variant="h3" numberOfLines={1} style={styles.updateStatValue}>
        {value}
      </AppText>
    </View>
  );
}

function TextLink({ label, url }: { label: string; url: string }) {
  const { theme } = useTheme();
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => void openExternal(url)}
      style={({ pressed }) => [styles.textLink, { opacity: pressed ? 0.6 : 1 }]}>
      <AppText variant="small" color={theme.accent}>
        {label}
      </AppText>
      <Ionicons name="open-outline" size={12} color={theme.accent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 28,
  },
  header: {
    gap: 8,
    alignItems: 'flex-start',
  },
  lede: {
    maxWidth: 600,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'stretch',
  },
  cardMobile: {
    flexBasis: 'auto',
    flexGrow: 0,
    width: '100%',
  },
  profileCard: {
    flexGrow: 1.15,
    flexBasis: 400,
    minWidth: 280,
    gap: 16,
    padding: 22,
  },
  appearanceCard: {
    flexGrow: 1,
    flexBasis: 300,
    minWidth: 270,
    gap: 16,
    padding: 22,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 26,
    lineHeight: 32,
  },
  profileCopy: {
    flex: 1,
    gap: 1,
  },
  emojiSection: {
    gap: 7,
  },
  emojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  emojiButton: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 17,
    lineHeight: 22,
  },
  profileActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  metaBox: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: 12,
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  metaValue: {
    fontFamily: fonts.medium,
    flexShrink: 1,
    textAlign: 'right',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  cardHeaderText: {
    flex: 1,
    gap: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  toggleCopy: {
    flex: 1,
    gap: 2,
  },
  updatesCard: {
    gap: 16,
    padding: 22,
  },
  updateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexWrap: 'wrap',
  },
  bannerText: {
    flex: 1,
    minWidth: 160,
  },
  updateStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  updateStat: {
    flexGrow: 1,
    flexBasis: 140,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: 12,
    gap: 4,
  },
  updateStatValue: {
    fontSize: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    padding: 12,
    borderRadius: radius.md,
  },
  feedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  feedValue: {
    flex: 1,
    fontSize: 10.5,
  },
  linkRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  aboutCard: {
    flexGrow: 1,
    flexBasis: 400,
    minWidth: 280,
    gap: 16,
    padding: 22,
  },
  aboutRows: {
    gap: 7,
  },
  aboutLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  dataCard: {
    flexGrow: 1,
    flexBasis: 300,
    minWidth: 270,
    gap: 14,
    padding: 22,
  },
  dataBox: {
    borderRadius: radius.md,
    padding: 13,
    gap: 10,
    marginTop: 'auto',
  },
  textLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
});
