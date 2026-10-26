import { Platform, type TextStyle, type ViewStyle } from 'react-native';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedScheme = 'light' | 'dark';

export type Theme = {
  scheme: ResolvedScheme;
  isDark: boolean;
  bg: string;
  surface: string;
  surfaceAlt: string;
  surfaceRaised: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textFaint: string;
  accent: string;
  accentSoft: string;
  accentContrast: string;
  coral: string;
  coralSoft: string;
  mint: string;
  mintSoft: string;
  amber: string;
  danger: string;
  dangerSoft: string;
  overlay: string;
  hero: readonly [string, string, string];
  glass: string;
  glassBorder: string;
};

const brand = {
  accent: '#6D4AFF',
  coral: '#FF7A59',
  mint: '#2ED3A3',
  amber: '#FFC857',
  danger: '#F05252',
};

export const lightTheme: Theme = {
  scheme: 'light',
  isDark: false,
  bg: '#F6F3ED',
  surface: '#FFFFFF',
  surfaceAlt: '#EFEAE1',
  surfaceRaised: '#FFFFFF',
  border: '#E4DED2',
  borderStrong: '#D4CCBC',
  text: '#17151E',
  textMuted: '#6B6776',
  textFaint: '#9A94A3',
  accent: brand.accent,
  accentSoft: '#EDE9FF',
  accentContrast: '#FFFFFF',
  coral: brand.coral,
  coralSoft: '#FFE9E2',
  mint: '#14A67C',
  mintSoft: '#DDF7EE',
  amber: '#C98A00',
  danger: brand.danger,
  dangerSoft: '#FDE7E7',
  overlay: 'rgba(15, 12, 25, 0.55)',
  hero: ['#171029', '#3A206F', '#7A2E86'],
  glass: 'rgba(255, 255, 255, 0.12)',
  glassBorder: 'rgba(255, 255, 255, 0.18)',
};

export const darkTheme: Theme = {
  scheme: 'dark',
  isDark: true,
  bg: '#08080C',
  surface: '#111118',
  surfaceAlt: '#181722',
  surfaceRaised: '#1E1C2A',
  border: '#272532',
  borderStrong: '#38354A',
  text: '#F7F5FB',
  textMuted: '#A7A2B6',
  textFaint: '#6F6A7F',
  accent: '#8B7BFF',
  accentSoft: '#1B1733',
  accentContrast: '#0B0915',
  coral: brand.coral,
  coralSoft: '#2A1814',
  mint: '#3BE0AE',
  mintSoft: '#0F2A22',
  amber: brand.amber,
  danger: '#FF6B6B',
  dangerSoft: '#2A1414',
  overlay: 'rgba(0, 0, 0, 0.68)',
  hero: ['#120C21', '#2E1A5C', '#5C236C'],
  glass: 'rgba(255, 255, 255, 0.09)',
  glassBorder: 'rgba(255, 255, 255, 0.14)',
};

export const fonts = {
  regular: 'SpaceGrotesk_400Regular',
  medium: 'SpaceGrotesk_500Medium',
  semibold: 'SpaceGrotesk_600SemiBold',
  bold: 'SpaceGrotesk_700Bold',
  mono: Platform.select({ ios: 'ui-monospace', android: 'monospace', default: 'monospace' }) as string,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  xxl: 32,
  pill: 999,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const layout = {
  maxWidth: 1120,
  readingWidth: 780,
  sidebar: 264,
  tablet: 720,
  desktop: 1024,
} as const;

export const type = {
  display: {
    fontFamily: fonts.bold,
    fontSize: 46,
    lineHeight: 50,
    letterSpacing: -1.6,
  } as TextStyle,
  displaySmall: {
    fontFamily: fonts.bold,
    fontSize: 34,
    lineHeight: 39,
    letterSpacing: -0.9,
  } as TextStyle,
  h1: {
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.6,
  } as TextStyle,
  h2: {
    fontFamily: fonts.semibold,
    fontSize: 21,
    lineHeight: 27,
    letterSpacing: -0.3,
  } as TextStyle,
  h3: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: -0.1,
  } as TextStyle,
  body: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 23,
    letterSpacing: 0,
  } as TextStyle,
  bodyStrong: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 23,
  } as TextStyle,
  small: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 19,
  } as TextStyle,
  caption: {
    fontFamily: fonts.semibold,
    fontSize: 10.5,
    lineHeight: 14,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  } as TextStyle,
  mono: {
    fontFamily: fonts.mono,
    fontSize: 11.5,
    lineHeight: 17,
  } as TextStyle,
};

export function cardShadow(isDark: boolean): ViewStyle {
  if (Platform.OS === 'web') {
    return {
      boxShadow: isDark
        ? '0 24px 70px rgba(0, 0, 0, 0.5)'
        : '0 24px 60px rgba(45, 32, 90, 0.09)',
    };
  }
  return {
    shadowColor: '#000000',
    shadowOpacity: isDark ? 0.45 : 0.1,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: isDark ? 8 : 3,
  };
}

export const webOnly = Platform.select({
  web: { cursor: 'pointer' } as ViewStyle,
  default: {},
}) as ViewStyle;
