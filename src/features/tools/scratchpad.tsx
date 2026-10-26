import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Badge, IconTile } from '@/components/ui/controls';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TextField } from '@/components/ui/text-field';
import { useToast } from '@/components/ui/toast';
import { useTheme } from '@/features/theme/theme-provider';
import { fonts, space } from '@/features/theme/tokens';
import { confirmAction } from '@/lib/dialog';

const STORAGE_KEY = 'omnia.scratchpad.v1';

export function Scratchpad() {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const [text, setText] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const textRef = useRef('');

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (!active || !value) return;
        setText(value);
        textRef.current = value;
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    textRef.current = text;
    setSaving(true);
    const timeout = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, text)
        .then(() => {
          setSaving(false);
          setSavedAt(new Date().toISOString());
        })
        .catch(() => {
          setSaving(false);
          showToast('Could not save your note on this device.', { kind: 'error' });
        });
    }, 550);
    return () => clearTimeout(timeout);
  }, [text, loaded, showToast]);

  useEffect(() => {
    if (!loaded) return;
    return () => {
      AsyncStorage.setItem(STORAGE_KEY, textRef.current).catch(() => undefined);
    };
  }, [loaded]);

  const clear = () => {
    confirmAction({
      title: 'Clear the scratchpad?',
      message: 'This removes the note stored on this device. It cannot be undone.',
      confirmLabel: 'Clear note',
      destructive: true,
      onConfirm: async () => {
        setText('');
        textRef.current = '';
        await AsyncStorage.removeItem(STORAGE_KEY).catch(() => undefined);
        setSavedAt(null);
        showToast('Scratchpad cleared.', { kind: 'success' });
      },
    });
  };

  const status = saving ? 'Saving' : text.trim() ? 'Saved' : 'Empty';
  const tone = saving ? 'amber' : text.trim() ? 'mint' : 'neutral';

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <IconTile name="create-outline" tone="mint" size={40} iconSize={19} />
          <View style={styles.headerText}>
            <AppText variant="h3">Scratchpad</AppText>
            <AppText variant="small" color={theme.textMuted}>
              A quiet place for whatever is next
            </AppText>
          </View>
        </View>
        <Badge label={status} tone={tone} dot={saving || !!text.trim()} />
      </View>

      <TextField
        value={text}
        onChangeText={setText}
        placeholder="Drop a thought, a link or today’s list…"
        multiline
        maxLength={5000}
        style={styles.input}
        hint="Autosaves locally as you type. Never uploaded."
      />

      <View style={styles.footer}>
        <AppText variant="small" color={theme.textFaint} style={styles.meta}>
          {text.length.toLocaleString()} / 5,000 characters
          {savedAt && !saving && text.trim() ? ' · saved just now' : ''}
        </AppText>
        <Button
          label="Clear"
          variant="ghost"
          size="sm"
          icon="trash-outline"
          disabled={!text}
          onPress={clear}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    width: '100%',
    gap: 16,
    padding: 22,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  headerCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    flex: 1,
  },
  headerText: {
    gap: 1,
    flex: 1,
  },
  input: {
    minHeight: 190,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    flexWrap: 'wrap',
  },
  meta: {
    fontFamily: fonts.medium,
    flexShrink: 1,
  },
});
