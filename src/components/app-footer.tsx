import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Wordmark } from '@/components/logo';
import { AppText } from '@/components/ui/app-text';
import { Badge } from '@/components/ui/controls';
import { useTheme } from '@/features/theme/theme-provider';
import { fonts, radius, space } from '@/features/theme/tokens';
import { useUpdates } from '@/features/updates/updates-provider';
import { getDesktopPlatform, isElectron } from '@/lib/device';
import { openExternal } from '@/lib/open-external';
import {
  APP_WEB_URL,
  DOCS_URL,
  ISSUES_URL,
  LATEST_APK_URL,
  LATEST_LINUX_URL,
  LATEST_WINDOWS_URL,
  RELEASES_URL,
  REPO_URL,
} from '@/lib/links';
import { useResponsive } from '@/lib/use-responsive';

type FooterLink = {
  label: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
  url: string;
  accent?: boolean;
};

/**
 * The only download surface in the product: a compact, global footer with
 * real installers. No marketing "download" section in the middle of the app.
 */
export function AppFooter() {
  const { theme } = useTheme();
  const { currentVersion } = useUpdates();
  const { isMobile } = useResponsive();
  const desktop = getDesktopPlatform();
  const onWeb = Platform.OS === 'web';

  const links: FooterLink[] = [
    {
      label: 'Android APK',
      hint: 'Signed install',
      icon: 'logo-android',
      url: LATEST_APK_URL,
      accent: Platform.OS === 'android',
    },
    {
      label: 'Windows',
      hint: 'Installer .exe',
      icon: 'desktop-outline',
      url: LATEST_WINDOWS_URL,
      accent: desktop === 'windows',
    },
    {
      label: 'Linux',
      hint: 'AppImage',
      icon: 'terminal-outline',
      url: LATEST_LINUX_URL,
      accent: desktop === 'linux',
    },
  ];

  if (!onWeb || isElectron()) {
    links.push({
      label: 'Web app',
      hint: 'Open in a browser',
      icon: 'globe-outline',
      url: APP_WEB_URL,
    });
  }

  links.push({
    label: 'Install guide',
    hint: 'Steps for every device',
    icon: 'book-outline',
    url: DOCS_URL,
  });

  return (
    <View style={[styles.footer, { borderTopColor: theme.border }]}>
      <View style={[styles.top, isMobile ? styles.topMobile : null]}>
        <View style={styles.brand}>
          <Wordmark size={28} color={theme.text} subtitle="One app. Every device." />
          <AppText variant="small" color={theme.textMuted} style={styles.blurb}>
            A local-first workspace for every screen you own. Download the build for this
            device, or open the web app anywhere.
          </AppText>
        </View>
        <View style={styles.badges}>
          <Badge label={`v${currentVersion}`} tone="neutral" />
          <Badge label="Local-first" tone="mint" dot />
        </View>
      </View>

      <View style={styles.downloads}>
        {links.map((link) => (
          <FooterDownload key={link.label} {...link} />
        ))}
      </View>

      <View style={[styles.bottom, isMobile ? styles.bottomMobile : null]}>
        <AppText variant="caption" color={theme.textFaint}>
          MIT © 2026 Omprakash Suthar (@OPBSUTHAR)
        </AppText>
        <View style={styles.legalLinks}>
          <TextLink label="GitHub" url={REPO_URL} />
          <TextLink label="Releases" url={RELEASES_URL} />
          <TextLink label="Report a bug" url={ISSUES_URL} />
        </View>
      </View>
    </View>
  );
}

function FooterDownload({ label, hint, icon, url, accent = false }: FooterLink) {
  const { theme } = useTheme();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${label} — ${hint}`}
      onPress={() => void openExternal(url)}
      style={({ pressed }) => [
        styles.download,
        {
          backgroundColor: accent ? theme.accentSoft : theme.surfaceAlt,
          borderColor: accent ? theme.accent : theme.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}>
      <View
        style={[
          styles.downloadIcon,
          { backgroundColor: accent ? theme.accent : theme.surface },
        ]}>
        <Ionicons name={icon} size={15} color={accent ? '#FFFFFF' : theme.textMuted} />
      </View>
      <View style={styles.downloadCopy}>
        <AppText variant="small" color={accent ? theme.accent : theme.text} style={styles.downloadLabel}>
          {label}
        </AppText>
        <AppText variant="caption" color={theme.textFaint} style={styles.downloadHint}>
          {hint}
        </AppText>
      </View>
      <Ionicons name="download-outline" size={14} color={theme.textFaint} />
    </Pressable>
  );
}

function TextLink({ label, url }: { label: string; url: string }) {
  const { theme } = useTheme();
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => void openExternal(url)}
      style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}>
      <AppText variant="caption" color={theme.textMuted}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 34,
    paddingTop: 22,
    gap: 18,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 20,
  },
  topMobile: {
    flexDirection: 'column',
    gap: 14,
  },
  brand: {
    gap: 10,
    maxWidth: 520,
  },
  blurb: {
    lineHeight: 18,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  downloads: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  download: {
    flexGrow: 1,
    flexBasis: 158,
    minWidth: 150,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  downloadIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadCopy: {
    flex: 1,
    gap: 1,
  },
  downloadLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  downloadHint: {
    fontSize: 9,
    letterSpacing: 0.5,
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
    paddingBottom: 4,
  },
  bottomMobile: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
  },
  legalLinks: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
});
