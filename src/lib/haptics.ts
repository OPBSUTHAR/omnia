import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

function safe(promise: Promise<void>) {
  if (Platform.OS === 'web') return;
  promise.catch(() => undefined);
}

export function tapFeedback() {
  safe(Haptics.selectionAsync());
}

export function pressFeedback() {
  safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

export function successFeedback() {
  safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

export function warningFeedback() {
  safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
}
