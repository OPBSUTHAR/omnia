import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/features/theme/theme-provider';
import { fonts, radius } from '@/features/theme/tokens';
import { pressFeedback } from '@/lib/haptics';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'subtle'
  | 'light'
  | 'glass'
  | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof Ionicons.glyphMap;
  iconAfter?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconAfter,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  accessibilityHint,
}: ButtonProps) {
  const { theme } = useTheme();
  const [hovered, setHovered] = useState(false);

  const palettes: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
    primary: { bg: theme.accent, fg: theme.accentContrast, border: theme.accent },
    secondary: { bg: theme.surfaceAlt, fg: theme.text, border: theme.border },
    ghost: { bg: 'transparent', fg: theme.textMuted, border: theme.border },
    subtle: { bg: theme.accentSoft, fg: theme.accent, border: 'transparent' },
    light: { bg: '#FFFFFF', fg: '#171029', border: '#FFFFFF' },
    glass: { bg: theme.glass, fg: '#FFFFFF', border: theme.glassBorder },
    danger: { bg: theme.dangerSoft, fg: theme.danger, border: 'transparent' },
  };
  const palette = palettes[variant];
  const sizing = {
    sm: { height: 36, paddingHorizontal: 13, fontSize: 13, gap: 6, radius: radius.md, icon: 15 },
    md: { height: 46, paddingHorizontal: 18, fontSize: 14, gap: 8, radius: radius.md, icon: 17 },
    lg: { height: 54, paddingHorizontal: 24, fontSize: 15, gap: 9, radius: radius.lg, icon: 18 },
  }[size];

  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={() => {
        if (isDisabled) return;
        pressFeedback();
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        {
          height: sizing.height,
          paddingHorizontal: sizing.paddingHorizontal,
          gap: sizing.gap,
          borderRadius: sizing.radius,
          backgroundColor: palette.bg,
          borderColor: palette.border,
        },
        fullWidth ? styles.fullWidth : null,
        Platform.OS === 'web' ? styles.web : null,
        hovered && !isDisabled ? styles.hovered : null,
        pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={palette.fg} />
      ) : icon ? (
        <Ionicons name={icon} size={sizing.icon} color={palette.fg} />
      ) : null}
      <Text
        numberOfLines={1}
        style={{
          color: palette.fg,
          fontFamily: fonts.semibold,
          fontSize: sizing.fontSize,
          letterSpacing: 0.1,
        }}>
        {label}
      </Text>
      {iconAfter && !loading ? (
        <Ionicons name={iconAfter} size={sizing.icon - 1} color={palette.fg} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: 'flex-start',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  web: {
    cursor: 'pointer',
    userSelect: 'none',
  } as ViewStyle,
  hovered: {
    opacity: 0.94,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.55,
  },
});
