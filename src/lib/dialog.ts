import { Alert, Platform } from 'react-native';

export function confirmAction(options: {
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
}) {
  const { title, message, confirmLabel = 'Confirm', destructive = false, onConfirm } = options;
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return;
    if (window.confirm(`${title}\n\n${message}`)) {
      void onConfirm();
    }
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: confirmLabel,
      style: destructive ? 'destructive' : 'default',
      onPress: () => {
        void onConfirm();
      },
    },
  ]);
}
