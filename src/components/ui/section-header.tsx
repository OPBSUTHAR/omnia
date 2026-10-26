import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/features/theme/theme-provider';
import { space } from '@/features/theme/tokens';
import { useResponsive } from '@/lib/use-responsive';

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  action,
  style,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useTheme();
  const { isMobile } = useResponsive();
  return (
    <View style={[styles.row, isMobile ? styles.rowMobile : null, style]}>
      <View style={styles.copy}>
        {eyebrow ? (
          <AppText variant="caption" color={theme.accent} style={styles.eyebrow}>
            {eyebrow}
          </AppText>
        ) : null}
        <AppText variant="h2">{title}</AppText>
        {subtitle ? (
          <AppText variant="body" color={theme.textMuted} style={styles.subtitle}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {action ? (
        <View style={[styles.action, isMobile ? styles.actionMobile : null]}>{action}</View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: space.lg,
    marginBottom: space.lg,
  },
  rowMobile: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: space.sm,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    marginBottom: 2,
  },
  subtitle: {
    maxWidth: 620,
  },
  action: {
    paddingBottom: 2,
  },
  actionMobile: {
    paddingBottom: 0,
  },
});
