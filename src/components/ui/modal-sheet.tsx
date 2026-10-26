import type { PropsWithChildren } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/features/theme/theme-provider';
import { radius, space } from '@/features/theme/tokens';
import { useResponsive } from '@/lib/use-responsive';

export function ModalSheet({
  visible,
  onClose,
  closeOnBackdrop = true,
  children,
}: PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
  closeOnBackdrop?: boolean;
}>) {
  const { theme } = useTheme();
  const { isMobile } = useResponsive();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent>
      <View
        style={[
          styles.backdrop,
          {
            backgroundColor: theme.overlay,
            justifyContent: isMobile ? 'flex-end' : 'center',
            padding: isMobile ? 0 : 24,
          },
        ]}>
        <Pressable
          accessibilityLabel="Close dialog"
          style={StyleSheet.absoluteFill}
          onPress={closeOnBackdrop ? onClose : undefined}
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              paddingBottom: isMobile ? insets.bottom + 24 : 28,
              borderTopLeftRadius: isMobile ? 28 : radius.xxl,
              borderTopRightRadius: isMobile ? 28 : radius.xxl,
              borderRadius: isMobile ? 0 : radius.xxl,
              maxWidth: isMobile ? undefined : 540,
              width: isMobile ? '100%' : '100%',
            },
            Platform.OS === 'web'
              ? ({ boxShadow: '0 30px 90px rgba(0,0,0,0.35)' } as object)
              : { elevation: 20 },
          ]}>
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  sheet: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 24,
    paddingTop: 24,
    alignSelf: 'center',
  },
});

export function SheetGrabber() {
  const { theme } = useTheme();
  return (
    <View
      style={{
        width: 38,
        height: 4,
        borderRadius: 2,
        backgroundColor: theme.borderStrong,
        alignSelf: 'center',
        marginBottom: space.lg,
      }}
    />
  );
}
