import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Badge, IconTile, ProgressBar } from '@/components/ui/controls';
import { Button } from '@/components/ui/button';
import { ModalSheet, SheetGrabber } from '@/components/ui/modal-sheet';
import { useTheme } from '@/features/theme/theme-provider';
import { fonts, radius, space } from '@/features/theme/tokens';
import { useUpdates } from '@/features/updates/updates-provider';
import { formatDate } from '@/lib/device';
import { RELEASES_URL } from '@/lib/links';
import { useResponsive } from '@/lib/use-responsive';

export function UpdateModal() {
  const { theme } = useTheme();
  const { isMobile } = useResponsive();
  const {
    feed,
    modalVisible,
    currentVersion,
    dismissUpdate,
    installUpdate,
    isInstalling,
    installProgress,
  } = useUpdates();

  if (!feed) return null;
  const mandatory = feed.mandatory === true;
  const percent = installProgress === null ? 0 : Math.round(installProgress * 100);

  return (
    <ModalSheet
      visible={modalVisible}
      onClose={isInstalling ? () => undefined : dismissUpdate}
      closeOnBackdrop={!mandatory && !isInstalling}>
      {isMobile ? <SheetGrabber /> : null}
      <View style={styles.headerRow}>
        <IconTile name="sparkles" tone="accent" size={44} iconSize={20} />
        <View style={styles.headerCopy}>
          <AppText variant="caption" color={theme.accent}>
            Update available
          </AppText>
          <AppText variant="h2" style={styles.title}>
            Omnia {feed.version}
          </AppText>
        </View>
        {mandatory ? (
          <Badge label="Required" tone="coral" dot />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close update dialog"
            disabled={isInstalling}
            onPress={dismissUpdate}
            hitSlop={10}
            style={({ pressed }) => [
              styles.closeButton,
              {
                backgroundColor: theme.surfaceAlt,
                opacity: isInstalling ? 0.35 : pressed ? 0.7 : 1,
              },
            ]}>
            <Ionicons name="close" size={18} color={theme.textMuted} />
          </Pressable>
        )}
      </View>

      <View style={styles.versionRow}>
        <Badge label={`v${currentVersion} installed`} tone="neutral" />
        <Ionicons name="arrow-forward" size={13} color={theme.textFaint} />
        <Badge label={`v${feed.version} ready`} tone="accent" />
        {feed.releasedAt ? (
          <AppText variant="small" color={theme.textFaint} style={styles.releaseDate}>
            {formatDate(feed.releasedAt)}
          </AppText>
        ) : null}
      </View>

      <View
        style={[
          styles.notes,
          { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
        ]}>
        <AppText variant="caption" color={theme.textMuted} style={styles.notesTitle}>
          What&apos;s new
        </AppText>
        {(feed.notes.length > 0 ? feed.notes : ['A fresh build of Omnia is ready.']).map(
          (note) => (
            <View key={note} style={styles.noteRow}>
              <View style={[styles.noteDot, { backgroundColor: theme.accent }]} />
              <AppText variant="small" style={styles.noteText}>
                {note}
              </AppText>
            </View>
          )
        )}
      </View>

      <View style={[styles.callout, { backgroundColor: theme.accentSoft }]}>
        <Ionicons name="information-circle" size={17} color={theme.accent} />
        <AppText variant="small" color={theme.textMuted} style={styles.calloutText}>
          {mandatory
            ? 'This build is required to keep using Omnia. Install it to continue.'
            : 'Omnia downloads the APK inside the app, then opens the Android installer. Your session, notes and settings stay intact.'}
        </AppText>
      </View>

      {isInstalling ? (
        <View style={[styles.progressBlock, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <View style={styles.progressHeader}>
            <AppText variant="small" style={styles.progressLabel}>
              {percent >= 100 ? 'Opening the Android installer…' : 'Downloading the update…'}
            </AppText>
            <AppText variant="caption" color={theme.accent}>
              {percent}%
            </AppText>
          </View>
          <ProgressBar progress={installProgress ?? 0} height={6} />
          <AppText variant="small" color={theme.textMuted} style={styles.progressHint}>
            Keep Omnia open. The system installer will open automatically; if Android asks,
            allow installs from Omnia.
          </AppText>
        </View>
      ) : null}

      <View style={styles.actions}>
        {!mandatory ? (
          <Button
            label="Later"
            variant="ghost"
            fullWidth
            disabled={isInstalling}
            style={styles.actionButton}
            onPress={dismissUpdate}
          />
        ) : null}
        <Button
          label={
            isInstalling
              ? percent >= 100
                ? 'Opening installer…'
                : `Downloading ${percent}%`
              : 'Update now'
          }
          icon="download-outline"
          fullWidth
          loading={isInstalling}
          disabled={isInstalling}
          style={styles.actionButton}
          onPress={() => void installUpdate()}
        />
      </View>

      <Pressable
        onPress={() => void Linking.openURL(feed.releasesUrl ?? RELEASES_URL)}
        style={({ pressed }) => [styles.footerLink, { opacity: pressed ? 0.6 : 1 }]}>
        <AppText variant="small" color={theme.textFaint}>
          Release notes on GitHub
        </AppText>
        <Ionicons name="open-outline" size={13} color={theme.textFaint} />
      </Pressable>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginBottom: space.lg,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  title: {
    marginTop: -1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: space.lg,
  },
  releaseDate: {
    marginLeft: 'auto',
  },
  notes: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: 16,
    gap: 10,
    marginBottom: space.md,
  },
  notesTitle: {
    marginBottom: 1,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  noteDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6.5,
  },
  noteText: {
    flex: 1,
    fontFamily: fonts.regular,
  },
  callout: {
    flexDirection: 'row',
    gap: 9,
    padding: 13,
    borderRadius: radius.md,
    alignItems: 'flex-start',
    marginBottom: space.xl,
  },
  calloutText: {
    flex: 1,
    fontFamily: fonts.regular,
  },
  progressBlock: {
    gap: 9,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: 13,
    marginBottom: space.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  progressLabel: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 12.5,
  },
  progressHint: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: space.sm,
  },
  actionButton: {
    flex: 1,
  },
  footerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: space.lg,
  },
});
