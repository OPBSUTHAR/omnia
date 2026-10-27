import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Badge } from '@/components/ui/controls';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { useTheme } from '@/features/theme/theme-provider';
import { fonts, radius, space } from '@/features/theme/tokens';
import { FocusTimer } from '@/features/tools/focus-timer';
import { Calculator } from '@/features/tools/calculator';
import { Scratchpad } from '@/features/tools/scratchpad';
import { UnitConverter } from '@/features/tools/unit-converter';
import { useResponsive } from '@/lib/use-responsive';

const roadmap = ['Cloud session sync', 'Quick capture', 'File drop', 'AI assistant'];

export default function ToolsScreen() {
  const { theme } = useTheme();
  const { isMobile } = useResponsive();

  return (
    <Screen>
      <View style={styles.stack}>
        <View style={styles.header}>
          <Badge label="Toolkit · 4 live" tone="accent" dot />
          <AppText variant="displaySmall" style={styles.title}>
            Small tools.{'\n'}One home.
          </AppText>
          <AppText variant="body" color={theme.textMuted} style={styles.lede}>
            The first four utilities are wired up and working offline. Each one is a building
            block for the everything-app OrbisNova is becoming.
          </AppText>
        </View>

        <View style={[styles.grid, isMobile ? styles.gridMobile : null]}>
          <View style={[styles.timerWrap, isMobile ? styles.wrapMobile : null]}>
            <FocusTimer />
          </View>
          <View style={[styles.converterWrap, isMobile ? styles.wrapMobile : null]}>
            <UnitConverter />
          </View>
        </View>

        <Calculator />

        <Scratchpad />

        <Card tone="alt" style={styles.roadmap}>
          <View style={styles.roadmapHeader}>
            <View style={styles.roadmapCopy}>
              <AppText variant="caption" color={theme.accent}>
                Roadmap
              </AppText>
              <AppText variant="h3">Next in line</AppText>
            </View>
            <Ionicons name="compass-outline" size={20} color={theme.textMuted} />
          </View>
          <AppText variant="small" color={theme.textMuted} style={styles.roadmapLede}>
            The toolkit is intentionally small for the first public build. These are the next
            pieces on the bench.
          </AppText>
          <View style={styles.chips}>
            {roadmap.map((item) => (
              <Badge key={item} label={item} tone="neutral" />
            ))}
            <Badge label="Your idea?" tone="accent" icon="sparkles-outline" />
          </View>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 26,
  },
  header: {
    gap: 10,
    alignItems: 'flex-start',
  },
  title: {
    marginTop: 2,
  },
  lede: {
    maxWidth: 620,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'stretch',
  },
  gridMobile: {
    flexDirection: 'column',
    flexWrap: 'nowrap',
  },
  wrapMobile: {
    flexBasis: 'auto',
    flexGrow: 0,
    flexShrink: 1,
    minWidth: 0,
    width: '100%',
  },
  timerWrap: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 330,
    minWidth: 280,
  },
  converterWrap: {
    flexGrow: 1.15,
    flexShrink: 1,
    flexBasis: 380,
    minWidth: 280,
  },
  roadmap: {
    gap: 10,
    borderRadius: radius.xl,
    padding: 22,
  },
  roadmapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  roadmapCopy: {
    gap: 2,
  },
  roadmapLede: {
    maxWidth: 640,
    fontFamily: fonts.regular,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 4,
  },
});
