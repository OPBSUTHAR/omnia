import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Badge, IconTile } from '@/components/ui/controls';
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
  } = useUpdates();

  if (!feed) return null;
  const mandatory = feed.mandatory === true;

  return (
    <ModalSheet visible={modalVisible} onClose={dismissUpdate} closeOnBackdrop={!mandatory}>
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
            onPress={dismissUpdate}
            hitSlop={10}
            style={({ pressed }) => [
              styles.closeButton,
              { backgroundColor: theme.surfaceAlt, opacity: pressed ? 0.7 : 1 },
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
            : 'Installing over your current version keeps your session, notes and settings intact.'}
        </AppText>
      </View>

      <View style={styles.actions}>
        {!mandatory ? (
          <Button
            label="Later"
            variant="ghost"
            fullWidth
            style={styles.actionButton}
            onPress={dismissUpdate}
          />
        ) : null}
        <Button
          label="Update now"
          icon="download-outline"
          fullWidth
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
