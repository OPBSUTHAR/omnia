import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { UPDATE_FEED_URL } from '@/lib/links';

export function compareVersions(a: string, b: string): number {
  const parse = (value: string) =>
    value
      .trim()
      .replace(/^v/i, '')
      .split('-')[0]
      .split('.')
      .map((part) => Number.parseInt(part, 10) || 0);
  const left = parse(a);
  const right = parse(b);
  for (let index = 0; index < 3; index += 1) {
    const l = left[index] ?? 0;
    const r = right[index] ?? 0;
    if (l > r) return 1;
    if (l < r) return -1;
  }
  return 0;
}

export function isValidVersion(value: unknown): value is string {
  return typeof value === 'string' && /^\d+(\.\d+){0,2}([-+].*)?$/.test(value.trim());
}

export function getFeedUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    if (__DEV__) {
      return `${window.location.origin}/updates/latest.json`;
    }
    const config = Constants.expoConfig as { experiments?: { baseUrl?: string } } | null;
    const base = config?.experiments?.baseUrl ?? '/omnia';
    return `${window.location.origin}${base.replace(/\/$/, '')}/updates/latest.json`;
  }
  return UPDATE_FEED_URL;
}
