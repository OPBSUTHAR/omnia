import type { PropsWithChildren } from 'react';
import { Text, type TextProps } from 'react-native';

import { useTheme } from '@/features/theme/theme-provider';
import { type as typography } from '@/features/theme/tokens';

export type TextVariant = keyof typeof typography;

type AppTextProps = TextProps & {
  variant?: TextVariant;
  color?: string;
  align?: 'left' | 'center' | 'right';
};

export function AppText({
  variant = 'body',
  color,
  align,
  style,
  children,
  ...rest
}: PropsWithChildren<AppTextProps>) {
  const { theme } = useTheme();
  return (
    <Text
      {...rest}
      style={[
        typography[variant],
        { color: color ?? theme.text },
        align ? { textAlign: align } : null,
        style,
      ]}>
      {children}
    </Text>
  );
}
