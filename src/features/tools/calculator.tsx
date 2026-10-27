import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Badge, IconTile, Segmented } from '@/components/ui/controls';
import { Card } from '@/components/ui/card';
import { useTheme } from '@/features/theme/theme-provider';
import { fonts, radius, space } from '@/features/theme/tokens';
import { tapFeedback } from '@/lib/haptics';

import {
  evaluateAndFormat,
  evaluateExpression,
  formatCalculatorResult,
  type AngleMode,
  type CalculatorHistoryEntry,
} from './calculator-engine';

type Mode = 'basic' | 'scientific';

const modeOptions: { value: Mode; label: string }[] = [
  { value: 'basic', label: 'Basic' },
  { value: 'scientific', label: 'Scientific' },
];

const scientificKeys = [
  { label: 'sin', value: 'sin(' },
  { label: 'cos', value: 'cos(' },
  { label: 'tan', value: 'tan(' },
  { label: 'ln', value: 'ln(' },
  { label: 'log', value: 'log(' },
  { label: '√', value: 'sqrt(' },
  { label: 'xʸ', value: '^' },
  { label: 'π', value: 'π' },
  { label: 'e', value: 'e' },
  { label: '!', value: '!' },
  { label: '(', value: '(' },
  { label: ')', value: ')' },
];

const basicRows = [
  ['AC', '⌫', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['(', ')', '0', '.'],
];

const OPERATORS = new Set(['+', '−', '×', '÷', '^', '%', '!']);

function toExpressionKey(key: string): string {
  if (key === '÷') return '/';
  if (key === '×') return '*';
  if (key === '−') return '-';
  return key;
}

export function Calculator() {
  const { theme } = useTheme();
  const [mode, setMode] = useState<Mode>('basic');
  const [angleMode, setAngleMode] = useState<AngleMode>('deg');
  const [expression, setExpression] = useState('');
  const [resultOverride, setResultOverride] = useState<string | null>(null);
  const [justEvaluated, setJustEvaluated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<CalculatorHistoryEntry[]>([]);

  const preview = useMemo(
    () => (expression.trim() ? evaluateAndFormat(expression, angleMode) : null),
    [expression, angleMode]
  );

  const display = error ? 'Error' : resultOverride ?? preview ?? (expression ? '…' : '0');

  const resetTransient = () => {
    setError(null);
    setResultOverride(null);
  };

  const push = (raw: string) => {
    tapFeedback();
    const key = toExpressionKey(raw);
    const isOperator = OPERATORS.has(raw) || key === '/' || key === '*' || key === '-';
    const isFunction = key.endsWith('(');

    if (justEvaluated) {
      setJustEvaluated(false);
      resetTransient();
      if (raw === '⌫' || raw === 'AC') {
        setExpression('');
        return;
      }
      if (key === ')') {
        return;
      }
      if (isOperator) {
        const base = resultOverride ?? preview ?? '0';
        setExpression(`${base}${key}`);
      } else {
        setExpression(key);
      }
      return;
    }

    resetTransient();
    if (raw === 'AC') {
      setExpression('');
      return;
    }
    if (raw === '⌫') {
      setExpression((current) => {
        const suffixes = ['asin(', 'acos(', 'atan(', 'sqrt(', 'sin(', 'cos(', 'tan(', 'log(', 'ln(', 'abs('];
        const suffix = suffixes.find((item) => current.endsWith(item));
        if (suffix) return current.slice(0, -suffix.length);
        return current.slice(0, -1);
      });
      return;
    }

    setExpression((current) => {
      if (current === '0' && /^[0-9.]$/.test(key)) return key;
      if (isFunction && current && /[0-9πe)]$/.test(current)) return `${current}*${key}`;
      return `${current}${key}`;
    });
  };

  const equals = () => {
    tapFeedback();
    if (!expression.trim()) return;
    try {
      const value = evaluateExpression(expression, angleMode);
      const formatted = formatCalculatorResult(value);
      setError(null);
      setResultOverride(formatted);
      setJustEvaluated(true);
      setHistory((current) =>
        [{ expression, result: formatted }, ...current.filter((item) => item.expression !== expression)].slice(
          0,
          5
        )
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Check the expression');
      setResultOverride(null);
      setJustEvaluated(false);
    }
  };

  const clear = () => {
    tapFeedback();
    setExpression('');
    setResultOverride(null);
    setError(null);
    setJustEvaluated(false);
  };

  const recall = (entry: CalculatorHistoryEntry) => {
    tapFeedback();
    setExpression(entry.expression);
    setResultOverride(entry.result);
    setError(null);
    setJustEvaluated(true);
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <IconTile name="calculator-outline" tone="accent" size={40} iconSize={19} />
          <View style={styles.headerText}>
            <AppText variant="h3">Calculator</AppText>
            <AppText variant="small" color={theme.textMuted}>
              Universal · basic + scientific
            </AppText>
          </View>
        </View>
        <Badge label="Instant" tone="accent" dot />
      </View>

      <Segmented options={modeOptions} value={mode} onChange={(next) => setMode(next as Mode)} />

      <View
        style={[
          styles.display,
          { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
        ]}>
        <AppText
          variant="mono"
          color={error ? theme.coral : theme.textFaint}
          numberOfLines={2}
          style={styles.expression}>
          {expression || '0'}
        </AppText>
        <AppText
          style={[
            styles.result,
            { color: error ? theme.coral : theme.text },
            display.length > 12 ? styles.resultSmall : null,
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.55}>
          {display}
        </AppText>
        <View style={styles.displayFooter}>
          <AppText variant="small" color={error ? theme.coral : theme.textMuted} numberOfLines={2}>
            {error ?? (justEvaluated ? 'Result ready · edit or start a new calculation' : 'Live preview updates as you type')}
          </AppText>
          {mode === 'scientific' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Angle mode ${angleMode === 'deg' ? 'degrees' : 'radians'}`}
              onPress={() => {
                tapFeedback();
                setAngleMode((current) => (current === 'deg' ? 'rad' : 'deg'));
                setResultOverride(null);
                setError(null);
              }}
              style={({ pressed }) => [
                styles.angleChip,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.surface,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}>
              <AppText variant="caption" color={theme.accent}>
                {angleMode === 'deg' ? 'DEG' : 'RAD'}
              </AppText>
            </Pressable>
          ) : null}
        </View>
      </View>

      {mode === 'scientific' ? (
        <View style={styles.scienceKeys}>
          {scientificKeys.map((key) => (
            <Pressable
              key={key.label}
              accessibilityRole="button"
              accessibilityLabel={key.label}
              onPress={() => push(key.value)}
              style={({ pressed }) => [
                styles.scienceKey,
                {
                  backgroundColor: theme.surfaceAlt,
                  borderColor: theme.border,
                  opacity: pressed ? 0.65 : 1,
                },
              ]}>
              <AppText variant="small" color={theme.textMuted} style={styles.scienceKeyText}>
                {key.label}
              </AppText>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.keypad}>
        {basicRows.map((row) => (
          <View key={row.join('')} style={styles.keyRow}>
            {row.map((key) => {
              const isOperator = OPERATORS.has(key);
              const isAccent = key === 'AC' || key === '⌫';
              const backgroundColor = key === 'AC'
                ? theme.dangerSoft
                : isAccent
                  ? theme.surfaceAlt
                  : isOperator
                    ? theme.accentSoft
                    : theme.surfaceAlt;
              const color = key === 'AC'
                ? theme.danger
                : isOperator
                  ? theme.accent
                  : theme.text;
              return (
                <Pressable
                  key={key}
                  accessibilityRole="button"
                  accessibilityLabel={key === '⌫' ? 'Backspace' : key}
                  onPress={() => push(key)}
                  style={({ pressed }) => [
                    styles.key,
                    {
                      backgroundColor,
                      borderColor: theme.border,
                      opacity: pressed ? 0.62 : 1,
                    },
                  ]}>
                  {key === '⌫' ? (
                    <Ionicons name="backspace-outline" size={18} color={color} />
                  ) : (
                    <AppText style={[styles.keyText, { color }]}>{key}</AppText>
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear calculator"
          onPress={clear}
          style={({ pressed }) => [
            styles.secondaryAction,
            { borderColor: theme.border, opacity: pressed ? 0.65 : 1 },
          ]}>
          <AppText variant="small" color={theme.textMuted}>
            Clear
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Calculate result"
          onPress={equals}
          style={({ pressed }) => [
            styles.equals,
            { backgroundColor: theme.accent, opacity: pressed ? 0.75 : 1 },
          ]}>
          <AppText style={[styles.equalsText, { color: theme.accentContrast }]}>=</AppText>
        </Pressable>
      </View>

      {history.length > 0 ? (
        <View style={styles.history}>
          <View style={styles.historyHeader}>
            <AppText variant="caption" color={theme.textFaint}>
              Recent
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear calculator history"
              onPress={() => setHistory([])}
              style={({ pressed }) => [pressed ? styles.pressed : null]}>
              <AppText variant="small" color={theme.textFaint}>
                Clear
              </AppText>
            </Pressable>
          </View>
          {history.map((entry) => (
            <Pressable
              key={`${entry.expression}-${entry.result}`}
              accessibilityRole="button"
              accessibilityLabel={`Use ${entry.expression} equals ${entry.result}`}
              onPress={() => recall(entry)}
              style={({ pressed }) => [
                styles.historyRow,
                { borderTopColor: theme.border, opacity: pressed ? 0.65 : 1 },
              ]}>
              <AppText variant="small" color={theme.textMuted} numberOfLines={1} style={styles.historyExpression}>
                {entry.expression}
              </AppText>
              <AppText variant="small" style={styles.historyResult} numberOfLines={1}>
                = {entry.result}
              </AppText>
            </Pressable>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    width: '100%',
    gap: 14,
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
  display: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 2,
  },
  expression: {
    textAlign: 'right',
    minHeight: 18,
  },
  result: {
    fontFamily: fonts.bold,
    fontSize: 38,
    lineHeight: 44,
    letterSpacing: -1.2,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  resultSmall: {
    fontSize: 30,
    lineHeight: 36,
  },
  displayFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 2,
  },
  angleChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  scienceKeys: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  scienceKey: {
    minWidth: 44,
    height: 34,
    paddingHorizontal: 9,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scienceKeyText: {
    fontFamily: fonts.semibold,
  },
  keypad: {
    gap: 7,
  },
  keyRow: {
    flexDirection: 'row',
    gap: 7,
  },
  key: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontFamily: fonts.semibold,
    fontSize: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryAction: {
    width: 84,
    height: 48,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  equals: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  equalsText: {
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 28,
  },
  history: {
    gap: 0,
    marginTop: 2,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 6,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  historyExpression: {
    flex: 1,
    fontFamily: fonts.mono,
  },
  historyResult: {
    fontFamily: fonts.semibold,
    flexShrink: 0,
    maxWidth: '52%',
  },
  pressed: {
    opacity: 0.6,
  },
});
