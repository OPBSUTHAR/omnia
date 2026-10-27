import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Wordmark } from '@/components/logo';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useTheme } from '@/features/theme/theme-provider';
import { fonts, radius, space } from '@/features/theme/tokens';
import {
  sessionEmojis,
  useSession,
} from '@/features/session/session-provider';
import { useResponsive } from '@/lib/use-responsive';

const highlights = [
  { icon: 'person-circle-outline' as const, text: 'A private session on every device' },
  { icon: 'cloud-download-outline' as const, text: 'Live in-app update alerts' },
  { icon: 'grid-outline' as const, text: 'One home for a growing toolkit' },
];

export function SessionGate() {
  const { theme } = useTheme();
  const { isDesktop } = useResponsive();
  const insets = useSafeAreaInsets();
  const { status, createSession } = useSession();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(sessionEmojis[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status !== 'empty') return null;

  const trimmed = name.trim();

  const start = async (guest = false) => {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      await createSession({
        name: guest ? 'Guest' : trimmed,
        emoji: guest ? sessionEmojis[Math.floor(Math.random() * sessionEmojis.length)] : emoji,
      });
    } catch {
      setError('Could not save your session on this device. Please try again.');
      setBusy(false);
    }
  };

  return (
    <View style={styles.overlay}>
      <LinearGradient
        colors={['#08060E', '#160D2D', '#341850']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.glow, styles.glowOne]} />
      <View style={[styles.glow, styles.glowTwo]} />

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 22,
          paddingBottom: insets.bottom + 28,
          paddingHorizontal: isDesktop ? 48 : 22,
          justifyContent: 'center',
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.shell}>
          <View style={styles.brandRow}>
            <Wordmark size={38} subtitle="One app. Every device." />
            <View style={styles.localTag}>
              <View style={styles.localDot} />
              <AppText style={styles.localText}>Local-first</AppText>
            </View>
          </View>

          <View style={[styles.main, isDesktop ? styles.mainDesktop : null]}>
            <View style={styles.pitch}>
              <AppText style={styles.eyebrow}>Welcome to OrbisNova</AppText>
              <AppText style={[styles.display, isDesktop ? null : styles.displayMobile]}>
                Everything you need.{'\n'}On every screen.
              </AppText>
              <AppText style={styles.lede}>
                A calm, fast home for the tools you reach for daily — starting with a focus
                timer, a converter and a scratchpad. New builds announce themselves inside the
                app.
              </AppText>

              <View style={styles.highlights}>
                {highlights.map((item) => (
                  <View key={item.text} style={styles.highlightRow}>
                    <View style={styles.highlightIcon}>
                      <Ionicons name={item.icon} size={15} color="#D8CCFF" />
                    </View>
                    <AppText style={styles.highlightText}>{item.text}</AppText>
                  </View>
                ))}
              </View>
            </View>

            <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <AppText variant="h2">Create your session</AppText>
              <AppText variant="body" color={theme.textMuted} style={styles.formLede}>
                No account, no email. Your name and notes stay on this device.
              </AppText>

              <TextField
                label="What should we call you?"
                placeholder="Your name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                maxLength={32}
                returnKeyType="done"
                onSubmitEditing={() => void start(false)}
                containerStyle={styles.field}
              />

              <AppText variant="small" color={theme.textMuted} style={styles.emojiLabel}>
                Pick a badge
              </AppText>
              <View style={styles.emojiRow}>
                {sessionEmojis.map((option) => {
                  const selected = option === emoji;
                  return (
                    <Pressable
                      key={option}
                      accessibilityRole="button"
                      accessibilityLabel={`Choose ${option}`}
                      accessibilityState={{ selected }}
                      onPress={() => setEmoji(option)}
                      style={({ pressed }) => [
                        styles.emojiButton,
                        {
                          backgroundColor: selected ? theme.accentSoft : theme.surfaceAlt,
                          borderColor: selected ? theme.accent : theme.border,
                          opacity: pressed ? 0.75 : 1,
                        },
                      ]}>
                      <AppText style={styles.emoji}>{option}</AppText>
                    </Pressable>
                  );
                })}
              </View>

              {error ? (
                <AppText variant="small" color={theme.danger} style={styles.error}>
                  {error}
                </AppText>
              ) : null}

              <Button
                label="Start my session"
                iconAfter="arrow-forward"
                size="lg"
                fullWidth
                loading={busy}
                disabled={trimmed.length < 2}
                onPress={() => void start(false)}
                accessibilityHint="Creates a local session on this device"
              />

              <Pressable
                onPress={() => void start(true)}
                disabled={busy}
                style={({ pressed }) => [styles.guest, { opacity: pressed ? 0.6 : 1 }]}>
                <AppText variant="small" color={theme.textFaint}>
                  Just looking? Continue as guest
                </AppText>
              </Pressable>

              <View style={[styles.privacy, { borderTopColor: theme.border }]}>
                <Ionicons name="lock-closed-outline" size={12} color={theme.textFaint} />
                <AppText variant="small" color={theme.textFaint} style={styles.privacyText}>
                  Sessions are stored locally. Cloud sync is on the roadmap.
                </AppText>
              </View>
            </View>
          </View>

          <AppText style={styles.footer}>
            Built by Omprakash Suthar (@OPBSUTHAR)
          </AppText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    borderRadius: 999,
  },
  glowOne: {
    width: 520,
    height: 520,
    backgroundColor: 'rgba(109, 74, 255, 0.28)',
    top: -180,
    right: -160,
  },
  glowTwo: {
    width: 420,
    height: 420,
    backgroundColor: 'rgba(255, 122, 89, 0.14)',
    bottom: -180,
    left: -140,
  },
  shell: {
    width: '100%',
    maxWidth: 1080,
    alignSelf: 'center',
    gap: 30,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.lg,
  },
  localTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  localDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#35D6A4',
  },
  localText: {
    color: 'rgba(255,255,255,0.72)',
    fontFamily: fonts.medium,
    fontSize: 10.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  main: {
    gap: 28,
  },
  mainDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 56,
  },
  pitch: {
    flex: 1.15,
    gap: 16,
    paddingBottom: 8,
  },
  eyebrow: {
    color: '#B9A6FF',
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  display: {
    color: '#FFFFFF',
    fontFamily: fonts.bold,
    fontSize: 54,
    lineHeight: 58,
    letterSpacing: -2,
  },
  displayMobile: {
    fontSize: 38,
    lineHeight: 42,
    letterSpacing: -1.4,
  },
  lede: {
    color: 'rgba(255,255,255,0.62)',
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 24,
    maxWidth: 520,
  },
  highlights: {
    gap: 10,
    marginTop: 8,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  highlightIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  highlightText: {
    color: 'rgba(255,255,255,0.72)',
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  formCard: {
    flex: 0.85,
    width: '100%',
    maxWidth: 430,
    borderRadius: radius.xxl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 26,
    gap: 12,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 36px 90px rgba(0,0,0,0.45)' }
      : { elevation: 16, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 40, shadowOffset: { width: 0, height: 20 } }),
  },
  formLede: {
    marginTop: -4,
    marginBottom: 4,
  },
  field: {
    marginTop: 4,
  },
  emojiLabel: {
    marginTop: 4,
  },
  emojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  emojiButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  emoji: {
    fontSize: 19,
    lineHeight: 24,
  },
  error: {
    marginTop: -2,
  },
  guest: {
    alignSelf: 'center',
    paddingVertical: 6,
    marginTop: 2,
  },
  privacy: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 13,
    marginTop: 6,
  },
  privacyText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
  },
  footer: {
    color: 'rgba(255,255,255,0.34)',
    fontFamily: fonts.medium,
    fontSize: 11,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});
