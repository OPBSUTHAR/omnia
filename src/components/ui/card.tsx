import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { useTheme } from '@/features/theme/theme-provider';
import { cardShadow, radius } from '@/features/theme/tokens';

export type CardTone = 'surface' | 'alt' | 'transparent';

type CardProps = ViewProps & {
  tone?: CardTone;
  padded?: boolean;
  elevated?: boolean;
  radiusSize?: number;
  style?: StyleProp<ViewStyle>;
};

export function Card({
  tone = 'surface',
  padded = true,
  elevated = false,
  radiusSize = radius.xl,
  style,
  children,
  ...rest
}: PropsWithChildren<CardProps>) {
  const { theme } = useTheme();
  const background =
    tone === 'surface' ? theme.surface : tone === 'alt' ? theme.surfaceAlt : 'transparent';

  return (
    <View
      {...rest}
      style={[
        styles.base,
        {
          backgroundColor: background,
          borderColor: tone === 'transparent' ? 'transparent' : theme.border,
          borderRadius: radiusSize,
          padding: padded ? 24 : 0,
        },
        elevated ? cardShadow(theme.isDark) : null,
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
});
