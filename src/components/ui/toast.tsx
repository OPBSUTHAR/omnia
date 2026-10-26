import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState, type PropsWithChildren } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/features/theme/theme-provider';
import { fonts, radius, space, type } from '@/features/theme/tokens';
import { useResponsive } from '@/lib/use-responsive';

export type ToastKind = 'info' | 'success' | 'error';

type ToastOptions = {
  kind?: ToastKind;
  duration?: number;
};

type Toast = {
  id: number;
  message: string;
  kind: ToastKind;
};

type ToastContextValue = {
  showToast: (message: string, options?: ToastOptions) => void;
};

import { createContext, useCallback, useContext, useMemo } from 'react';

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: PropsWithChildren) {
  const [toast, setToast] = useState<Toast | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const animateOut = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: false }),
      Animated.timing(translateY, { toValue: 10, duration: 160, useNativeDriver: false }),
    ]).start(() => setToast(null));
  }, [opacity, translateY]);

  const showToast = useCallback(
    (message: string, options?: ToastOptions) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setToast({ id: Date.now(), message, kind: options?.kind ?? 'info' });
      opacity.setValue(0);
      translateY.setValue(16);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: false }),
        Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: false }),
      ]).start();
      timeoutRef.current = setTimeout(animateOut, options?.duration ?? 3200);
    },
    [animateOut, opacity, translateY]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? <ToastHost toast={toast} opacity={opacity} translateY={translateY} /> : null}
    </ToastContext.Provider>
  );
}

function ToastHost({
  toast,
  opacity,
  translateY,
}: {
  toast: Toast;
  opacity: Animated.Value;
  translateY: Animated.Value;
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { isMobile } = useResponsive();

  const palette =
    toast.kind === 'success'
      ? { icon: 'checkmark-circle' as const, tint: theme.mint }
      : toast.kind === 'error'
        ? { icon: 'alert-circle' as const, tint: theme.danger }
        : { icon: 'information-circle' as const, tint: theme.accent };

  return (
    <View
      pointerEvents="none"
      style={[
        styles.host,
        {
          bottom: isMobile ? insets.bottom + 92 : 30,
        },
      ]}>
      <Animated.View
        style={[
          styles.toast,
          {
            opacity,
            transform: [{ translateY }],
            backgroundColor: theme.isDark ? theme.surfaceRaised : '#1B1728',
            borderColor: theme.isDark ? theme.borderStrong : 'rgba(255,255,255,0.12)',
            boxShadow:
              Platform.OS === 'web'
                ? '0 16px 40px rgba(0,0,0,0.28)'
                : undefined,
          },
        ]}>
        <Ionicons name={palette.icon} size={18} color={palette.tint} />
        <Text style={styles.text}>{toast.message}</Text>
      </Animated.View>
    </View>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 2000,
  },
  toast: {
    maxWidth: 460,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 13,
    paddingHorizontal: 16,
    ...(Platform.OS !== 'web'
      ? { elevation: 12, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } }
      : {}),
  },
  text: {
    flex: 1,
    ...type.small,
    fontFamily: fonts.medium,
    color: '#FFFFFF',
  },
});
