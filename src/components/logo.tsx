import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { fonts } from '@/features/theme/tokens';

export function Logo({ size = 36 }: { size?: number }) {
  const ring = Math.round(size * 0.46);
  return (
    <LinearGradient
      colors={['#6D4AFF', '#A855F7', '#FF7A59']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.3),
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <View
        style={{
          width: ring,
          height: ring,
          borderRadius: ring,
          borderWidth: Math.max(2, Math.round(size * 0.075)),
          borderColor: '#FFFFFF',
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: Math.round(size * 0.19),
          right: Math.round(size * 0.2),
          width: Math.max(4, Math.round(size * 0.11)),
          height: Math.max(4, Math.round(size * 0.11)),
          borderRadius: size,
          backgroundColor: '#FFD166',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.65)',
        }}
      />
    </LinearGradient>
  );
}

export function Wordmark({
  size = 36,
  color = '#FFFFFF',
  subtitle,
}: {
  size?: number;
  color?: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.row}>
      <Logo size={size} />
      <View style={styles.copy}>
        <AppText
          style={{
            color,
            fontFamily: fonts.bold,
            fontSize: size * 0.52,
            lineHeight: size * 0.58,
            letterSpacing: -0.8,
          }}>
          Omnia
        </AppText>
        {subtitle ? (
          <AppText
            style={{
              color,
              opacity: 0.55,
              fontFamily: fonts.medium,
              fontSize: 9.5,
              letterSpacing: 1.6,
              textTransform: 'uppercase',
              marginTop: 2,
            }}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  copy: {
    justifyContent: 'center',
  },
});
