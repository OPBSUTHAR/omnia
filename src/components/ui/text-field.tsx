import { useState } from 'react';
import {
  Platform,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/features/theme/theme-provider';
import { fonts, radius, space } from '@/features/theme/tokens';

type TextFieldProps = TextInputProps & {
  label?: string;
  hint?: string;
  error?: string | null;
  containerStyle?: StyleProp<ViewStyle>;
};

export function TextField({
  label,
  hint,
  error,
  multiline,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...inputProps
}: TextFieldProps) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <AppText variant="small" color={theme.textMuted} style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <TextInput
        {...inputProps}
        multiline={multiline}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        placeholderTextColor={theme.textFaint}
        selectionColor={theme.accent}
        style={[
          styles.input,
          {
            color: theme.text,
            backgroundColor: theme.surfaceAlt,
            borderColor: error ? theme.danger : focused ? theme.accent : theme.border,
            minHeight: multiline ? 148 : 48,
          },
          multiline ? styles.multiline : null,
          Platform.OS === 'web' ? (styles.webInput as unknown as ViewStyle) : null,
          style,
        ]}
      />
      {error ? (
        <AppText variant="small" color={theme.danger}>
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="small" color={theme.textFaint}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 7,
    width: '100%',
  },
  label: {
    marginLeft: 2,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  multiline: {
    paddingTop: 13,
    textAlignVertical: 'top',
  },
  webInput: {
    outlineWidth: 0,
  },
});
