import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/features/theme/theme-provider';
import { fonts, radius } from '@/features/theme/tokens';

export type BadgeTone = 'neutral' | 'accent' | 'mint' | 'coral' | 'amber' | 'danger' | 'glass';

export function Badge({
  label,
  tone = 'neutral',
  dot = false,
  icon,
  style,
}: {
  label: string;
  tone?: BadgeTone;
  dot?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useTheme();
  const palette: Record<BadgeTone, { bg: string; fg: string }> = {
    neutral: { bg: theme.surfaceAlt, fg: theme.textMuted },
    accent: { bg: theme.accentSoft, fg: theme.accent },
    mint: { bg: theme.mintSoft, fg: theme.mint },
    coral: { bg: theme.coralSoft, fg: theme.coral },
    amber: { bg: theme.isDark ? '#2A2213' : '#FFF4D6', fg: theme.amber },
    danger: { bg: theme.dangerSoft, fg: theme.danger },
    glass: { bg: theme.glass, fg: '#FFFFFF' },
  };
  const { bg, fg } = palette[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      {dot ? <View style={[styles.dot, { backgroundColor: fg }]} /> : null}
      {icon ? <Ionicons name={icon} size={12} color={fg} /> : null}
      <Text
        numberOfLines={1}
        style={{
          color: fg,
          fontFamily: fonts.semibold,
          fontSize: 11,
          letterSpacing: 0.4,
          textTransform: 'uppercase',
        }}>
        {label}
      </Text>
    </View>
  );
}

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.segmented,
        { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
        style,
      ]}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.value)}
            style={[
              styles.segment,
              active ? { backgroundColor: theme.surfaceRaised } : null,
              Platform.OS === 'web' ? styles.web : null,
            ]}>
            {option.icon ? (
              <Ionicons
                name={option.icon}
                size={13}
                color={active ? theme.text : theme.textMuted}
              />
            ) : null}
            <Text
              style={{
                color: active ? theme.text : theme.textMuted,
                fontFamily: active ? fonts.semibold : fonts.medium,
                fontSize: 12.5,
              }}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ProgressBar({
  progress,
  height = 8,
  tone,
  track,
}: {
  progress: number;
  height?: number;
  tone?: string;
  track?: string;
}) {
  const { theme } = useTheme();
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <View
      style={{
        height,
        borderRadius: radius.pill,
        backgroundColor:
          track ?? (theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(20,15,40,0.09)'),
        overflow: 'hidden',
      }}>
      <View
        style={{
          width: `${clamped * 100}%`,
          height: '100%',
          borderRadius: radius.pill,
          backgroundColor: tone ?? theme.accent,
        }}
      />
    </View>
  );
}

export function IconTile({
  name,
  tone = 'accent',
  size = 44,
  iconSize = 21,
}: {
  name: keyof typeof Ionicons.glyphMap;
  tone?: 'accent' | 'coral' | 'mint' | 'amber' | 'neutral';
  size?: number;
  iconSize?: number;
}) {
  const { theme } = useTheme();
  const gradients: Record<string, readonly [string, string]> = {
    accent: ['#6D4AFF', '#A56BFF'],
    coral: ['#FF7A59', '#FFB199'],
    mint: ['#14A67C', '#4ADFB8'],
    amber: ['#E09B00', '#FFD166'],
    neutral: theme.isDark ? ['#2A2738', '#3A3550'] : ['#EFEAE1', '#E2DACC'],
  };
  const foreground = tone === 'neutral' ? theme.text : '#FFFFFF';
  return (
    <LinearGradient
      colors={gradients[tone]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: size * 0.32, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={name} size={iconSize} color={foreground} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  segmented: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: 'flex-start',
  },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 32,
    paddingHorizontal: 14,
    borderRadius: radius.sm,
  },
  web: {
    cursor: 'pointer',
    userSelect: 'none',
  } as ViewStyle,
});
