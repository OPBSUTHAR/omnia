import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useResponsive } from '@/lib/use-responsive';
import { layout } from '@/features/theme/tokens';

export function Screen({
  children,
  maxWidth = layout.maxWidth,
  topPadding,
}: PropsWithChildren<{ maxWidth?: number; topPadding?: number }>) {
  const { isMobile } = useResponsive();
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={{
        paddingHorizontal: isMobile ? 18 : 36,
        paddingTop: topPadding ?? (isMobile ? 12 : 34),
        paddingBottom: isMobile ? 118 : 60,
      }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">
      <View style={[styles.content, { maxWidth }]}>
        {children}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    width: '100%',
    alignSelf: 'center',
  },
});

