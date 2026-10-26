import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Badge, IconTile, Segmented } from '@/components/ui/controls';
import { Card } from '@/components/ui/card';
import { TextField } from '@/components/ui/text-field';
import { useTheme } from '@/features/theme/theme-provider';
import { fonts, radius, space } from '@/features/theme/tokens';
import { tapFeedback } from '@/lib/haptics';

type Category = 'length' | 'weight' | 'temperature';

type Unit = {
  id: string;
  label: string;
  name: string;
  factor: number;
};

const unitSets: Record<Category, Unit[]> = {
  length: [
    { id: 'm', label: 'm', name: 'Metres', factor: 1 },
    { id: 'km', label: 'km', name: 'Kilometres', factor: 1000 },
    { id: 'cm', label: 'cm', name: 'Centimetres', factor: 0.01 },
    { id: 'mi', label: 'mi', name: 'Miles', factor: 1609.344 },
    { id: 'ft', label: 'ft', name: 'Feet', factor: 0.3048 },
    { id: 'in', label: 'in', name: 'Inches', factor: 0.0254 },
  ],
  weight: [
    { id: 'kg', label: 'kg', name: 'Kilograms', factor: 1 },
    { id: 'g', label: 'g', name: 'Grams', factor: 0.001 },
    { id: 'lb', label: 'lb', name: 'Pounds', factor: 0.45359237 },
    { id: 'oz', label: 'oz', name: 'Ounces', factor: 0.028349523125 },
  ],
  temperature: [
    { id: 'c', label: '°C', name: 'Celsius', factor: 1 },
    { id: 'f', label: '°F', name: 'Fahrenheit', factor: 1 },
    { id: 'k', label: 'K', name: 'Kelvin', factor: 1 },
  ],
};

const categories: { value: Category; label: string }[] = [
  { value: 'length', label: 'Length' },
  { value: 'weight', label: 'Weight' },
  { value: 'temperature', label: 'Temp' },
];

export function convertValue(
  value: number,
  category: Category,
  fromId: string,
  toId: string
): number | null {
  if (!Number.isFinite(value)) return null;
  const list = unitSets[category];
  const from = list.find((unit) => unit.id === fromId);
  const to = list.find((unit) => unit.id === toId);
  if (!from || !to) return null;

  if (category === 'temperature') {
    const celsius =
      from.id === 'c' ? value : from.id === 'f' ? (value - 32) * (5 / 9) : value - 273.15;
    return to.id === 'c' ? celsius : to.id === 'f' ? celsius * (9 / 5) + 32 : celsius + 273.15;
  }

  return (value * from.factor) / to.factor;
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  if (abs !== 0 && (abs >= 1e9 || abs < 0.000001)) {
    return value.toExponential(4).replace('e+', 'e');
  }
  const rounded = Math.round(value * 1e6) / 1e6;
  const text = rounded.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
  const [integer, decimals] = text.split('.');
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decimals ? `${grouped}.${decimals}` : grouped;
}

export function UnitConverter() {
  const { theme } = useTheme();
  const [category, setCategory] = useState<Category>('length');
  const [amount, setAmount] = useState('1');
  const [from, setFrom] = useState('m');
  const [to, setTo] = useState('km');

  const list = unitSets[category];
  const fromUnit = list.find((unit) => unit.id === from) ?? list[0];
  const toUnit = list.find((unit) => unit.id === to) ?? list[1];
  const numeric = Number.parseFloat(amount.replace(',', '.'));
  const valid = amount.trim().length > 0 && Number.isFinite(numeric);
  const result = valid ? convertValue(numeric, category, fromUnit.id, toUnit.id) : null;
  const one = convertValue(1, category, fromUnit.id, toUnit.id);

  const selectCategory = (next: Category) => {
    tapFeedback();
    setCategory(next);
    setFrom(unitSets[next][0].id);
    setTo(unitSets[next][1].id);
  };

  const swap = () => {
    tapFeedback();
    setFrom(toUnit.id);
    setTo(fromUnit.id);
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <IconTile name="swap-horizontal-outline" tone="coral" size={40} iconSize={19} />
          <View style={styles.headerText}>
            <AppText variant="h3">Unit converter</AppText>
            <AppText variant="small" color={theme.textMuted}>
              Length, weight and temperature
            </AppText>
          </View>
        </View>
        <Badge label="Instant" tone="mint" dot />
      </View>

      <Segmented options={categories} value={category} onChange={selectCategory} />

      <TextField
        label="Amount"
        value={amount}
        onChangeText={(text) => setAmount(text.replace(',', '.').replace(/[^0-9.-]/g, ''))}
        keyboardType="decimal-pad"
        placeholder="0"
        selectTextOnFocus
      />

      <View style={styles.pickers}>
        <UnitPicker
          label="From"
          units={list}
          value={fromUnit.id}
          onChange={(id) => {
            tapFeedback();
            setFrom(id);
          }}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Swap units"
          onPress={swap}
          style={({ pressed }) => [
            styles.swapButton,
            {
              backgroundColor: theme.surfaceAlt,
              borderColor: theme.border,
              opacity: pressed ? 0.65 : 1,
            },
          ]}>
          <Ionicons name="swap-horizontal" size={16} color={theme.textMuted} />
        </Pressable>
        <UnitPicker
          label="To"
          units={list}
          value={toUnit.id}
          onChange={(id) => {
            tapFeedback();
            setTo(id);
          }}
        />
      </View>

      <View style={[styles.result, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
        <View style={styles.resultHeader}>
          <AppText variant="caption" color={theme.textFaint}>
            Result
          </AppText>
          <AppText variant="small" color={theme.textFaint}>
            {amount || '0'} {fromUnit.label} ={' '}
            {one === null ? '—' : formatNumber(one)} {toUnit.label}
          </AppText>
        </View>
        <View style={styles.resultValueRow}>
          <AppText style={styles.resultValue}>
            {result === null ? '—' : formatNumber(result)}
          </AppText>
          <AppText variant="h3" color={theme.textMuted} style={styles.resultUnit}>
            {toUnit.label}
          </AppText>
        </View>
        <AppText variant="small" color={theme.textMuted}>
          {toUnit.name}
        </AppText>
      </View>
    </Card>
  );
}

function UnitPicker({
  label,
  units,
  value,
  onChange,
}: {
  label: string;
  units: Unit[];
  value: string;
  onChange: (id: string) => void;
}) {
  const { theme } = useTheme();
  return (
    <View style={styles.picker}>
      <AppText variant="caption" color={theme.textFaint}>
        {label}
      </AppText>
      <View style={styles.unitWrap}>
        {units.map((unit) => {
          const active = unit.id === value;
          return (
            <Pressable
              key={unit.id}
              accessibilityRole="button"
              accessibilityLabel={unit.name}
              accessibilityState={{ selected: active }}
              onPress={() => onChange(unit.id)}
              style={({ pressed }) => [
                styles.unitChip,
                {
                  backgroundColor: active ? theme.accentSoft : theme.surface,
                  borderColor: active ? theme.accent : theme.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}>
              <AppText
                variant="small"
                color={active ? theme.accent : theme.textMuted}
                style={styles.unitChipText}>
                {unit.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
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
  pickers: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  picker: {
    flex: 1,
    gap: 7,
  },
  unitWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  unitChip: {
    paddingHorizontal: 9,
    height: 30,
    minWidth: 34,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitChipText: {
    fontSize: 11.5,
    fontFamily: fonts.semibold,
  },
  swapButton: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  result: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 2,
    marginTop: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  resultValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 7,
    marginTop: 3,
  },
  resultValue: {
    fontFamily: fonts.bold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -1,
  },
  resultUnit: {
    fontSize: 15,
  },
});
