import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Badge, ProgressBar } from '@/components/ui/controls';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { fonts, radius, space } from '@/features/theme/tokens';
import { successFeedback, tapFeedback } from '@/lib/haptics';

const presets = [5, 15, 25];

export function FocusTimer() {
  const { showToast } = useToast();
  const [minutes, setMinutes] = useState(25);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const endAtRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        endAtRef.current = 0;
        setRunning(false);
        successFeedback();
        showToast('Focus session complete. Take a breath.', { kind: 'success' });
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [running, showToast]);

  const selectPreset = (value: number) => {
    tapFeedback();
    setMinutes(value);
    setRemaining(value * 60);
    setRunning(false);
    endAtRef.current = 0;
  };

  const toggle = () => {
    tapFeedback();
    if (running) {
      setRunning(false);
      endAtRef.current = 0;
      return;
    }
    const base = remaining > 0 ? remaining : minutes * 60;
    if (remaining === 0) setRemaining(base);
    endAtRef.current = Date.now() + base * 1000;
    setRunning(true);
  };

  const reset = () => {
    tapFeedback();
    setRunning(false);
    endAtRef.current = 0;
    setRemaining(minutes * 60);
  };

  const total = minutes * 60;
  const progress = total > 0 ? 1 - remaining / total : 0;
  const done = remaining === 0;
  const display = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(
    remaining % 60
  ).padStart(2, '0')}`;

  return (
    <LinearGradient
      colors={['#1B1236', '#3B1D6B', '#752B85']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}>
      <View pointerEvents="none" style={styles.art}>
        <View style={styles.ring} />
      </View>

      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <AppText variant="caption" color="rgba(255,255,255,0.55)">
            Focus
          </AppText>
          <AppText style={styles.title}>Focus timer</AppText>
        </View>
        <Badge
          label={running ? 'Focusing' : done ? 'Done' : 'Ready'}
          tone="glass"
          dot
        />
      </View>

      <View style={styles.timeBlock}>
        <AppText style={styles.time}>{display}</AppText>
        <AppText style={styles.timeSub}>
          {running
            ? 'One thing at a time. Phone face down.'
            : done
              ? 'Session complete. That counts.'
              : `${minutes} minute session · haptic chime`}
        </AppText>
      </View>

      <ProgressBar progress={progress} height={5} tone="#FFD166" track="rgba(255,255,255,0.15)" />

      <View style={styles.presets}>
        {presets.map((preset) => {
          const active = preset === minutes;
          return (
            <Pressable
              key={preset}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => selectPreset(preset)}
              style={({ pressed }) => [
                styles.preset,
                {
                  backgroundColor: active ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)',
                  borderColor: active ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.12)',
                  opacity: pressed ? 0.7 : 1,
                },
              ]}>
              <AppText style={styles.presetText}>{preset}m</AppText>
            </Pressable>
          );
        })}
        <View style={styles.presetSpacer} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reset timer"
          onPress={reset}
          style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.6 : 1 }]}>
          <Ionicons name="refresh" size={16} color="rgba(255,255,255,0.72)" />
        </Pressable>
      </View>

      <View style={styles.actions}>
        <Button
          label={running ? 'Pause' : done ? 'Start again' : 'Start focus'}
          icon={running ? 'pause' : 'play'}
          variant="light"
          fullWidth
          onPress={toggle}
          style={styles.action}
        />
        <Button
          label="Reset"
          icon="refresh-outline"
          variant="glass"
          onPress={reset}
          style={styles.action}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xxl,
    padding: 22,
    gap: 16,
    overflow: 'hidden',
    flex: 1,
  },
  art: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  ring: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    top: -150,
    right: -110,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  headerCopy: {
    gap: 2,
  },
  title: {
    color: '#FFFFFF',
    fontFamily: fonts.semibold,
    fontSize: 20,
    letterSpacing: -0.3,
  },
  timeBlock: {
    gap: 3,
    marginTop: 2,
  },
  time: {
    color: '#FFFFFF',
    fontFamily: fonts.bold,
    fontSize: 58,
    lineHeight: 62,
    letterSpacing: -2.4,
    fontVariant: ['tabular-nums'],
  },
  timeSub: {
    color: 'rgba(255,255,255,0.55)',
    fontFamily: fonts.regular,
    fontSize: 12.5,
    lineHeight: 18,
  },
  presets: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  preset: {
    paddingHorizontal: 13,
    height: 32,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetText: {
    color: 'rgba(255,255,255,0.82)',
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  presetSpacer: {
    flex: 1,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  actions: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: 2,
  },
  action: {
    flex: 1,
  },
});
