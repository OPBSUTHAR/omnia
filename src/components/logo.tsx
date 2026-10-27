import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { fonts } from '@/features/theme/tokens';

type LogoProps = {
  size?: number;
};

/**
 * OrbisNova mark: a new world of everyday tools. The globe is drawn with
 * two parallels and a meridian, orbited by a small gold nova.
 */
export function Logo({ size = 36 }: LogoProps) {
  const radius = Math.round(size * 0.28);
  const globe = size * 0.56;
  const stroke = Math.max(1.1, size * 0.032);

  return (
    <LinearGradient
      colors={['#0B1030', '#0E3A47', '#251047']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <View
        style={{
          position: 'absolute',
          width: size * 0.8,
          height: size * 0.8,
          borderRadius: size * 0.4,
          backgroundColor: 'rgba(59, 224, 174, 0.13)',
          top: -size * 0.25,
          left: -size * 0.2,
        }}
      />
      <View
        style={{
          width: globe,
          height: globe,
          borderRadius: globe / 2,
          borderWidth: stroke,
          borderColor: 'rgba(229, 250, 255, 0.92)',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}>
        <View
          style={{
            position: 'absolute',
            top: globe * 0.27,
            width: globe * 0.86,
            height: stroke * 0.8,
            backgroundColor: 'rgba(229, 250, 255, 0.68)',
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: globe * 0.69,
            width: globe * 0.86,
            height: stroke * 0.8,
            backgroundColor: 'rgba(229, 250, 255, 0.5)',
          }}
        />
        <View
          style={{
            position: 'absolute',
            width: globe * 0.48,
            height: globe,
            borderRadius: globe * 0.48,
            borderWidth: stroke * 0.85,
            borderColor: 'rgba(229, 250, 255, 0.55)',
          }}
        />
        <View
          style={{
            position: 'absolute',
            width: globe * 0.16,
            height: globe * 0.16,
            borderRadius: globe * 0.08,
            backgroundColor: 'rgba(59, 224, 174, 0.9)',
          }}
        />
      </View>
      <View
        style={{
          position: 'absolute',
          width: size * 0.13,
          height: size * 0.13,
          borderRadius: size * 0.065,
          backgroundColor: '#FFD166',
          top: size * 0.13,
          right: size * 0.13,
          shadowColor: '#FFD166',
          shadowOpacity: 0.8,
          shadowRadius: size * 0.08,
          shadowOffset: { width: 0, height: 0 },
        }}
      />
    </LinearGradient>
  );
}

export function Wordmark({
  size = 36,
  color = '#FFFFFF',
  subtitle,
}: LogoProps & { color?: string; subtitle?: string }) {
  return (
    <View style={styles.row}>
      <Logo size={size} />
      <View style={styles.copy}>
        <Text
          numberOfLines={1}
          style={[
            styles.wordmark,
            {
              color,
              fontSize: size * 0.44,
              lineHeight: size * 0.5,
            },
          ]}>
          OrbisNova
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} style={[styles.subtitle, { color }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  copy: {
    gap: 1,
    flexShrink: 1,
  },
  wordmark: {
    fontFamily: fonts.bold,
    letterSpacing: -0.7,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    opacity: 0.55,
  },
});
