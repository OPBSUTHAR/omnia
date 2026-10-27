import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { useTheme } from '@/features/theme/theme-provider';
import { fonts } from '@/features/theme/tokens';

export default function NotFoundScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  return (
    <Screen maxWidth={620}>
      <Card style={styles.card}>
        <View style={[styles.icon, { backgroundColor: theme.accentSoft }]}>
          <Ionicons name="compass-outline" size={26} color={theme.accent} />
        </View>
        <AppText variant="displaySmall">404</AppText>
        <AppText variant="h3">This room isn&apos;t built yet.</AppText>
        <AppText variant="body" color={theme.textMuted}>
          The page you followed doesn&apos;t exist in this build of OrbisNova. Head back home — the
          rest of the app is waiting.
        </AppText>
        <Button label="Back to home" icon="arrow-back" onPress={() => router.replace('/')} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 40,
    padding: 28,
    gap: 12,
    alignItems: 'flex-start',
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
});
