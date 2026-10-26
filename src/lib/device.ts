import * as Device from 'expo-device';
import { Platform } from 'react-native';

export function getPlatformName(): string {
  if (Platform.OS === 'android') {
    return Device.osVersion ? `Android ${Device.osVersion}` : 'Android';
  }
  if (Platform.OS === 'ios') {
    return Device.osVersion ? `iOS ${Device.osVersion}` : 'iOS';
  }
  return getBrowserName();
}

export function getBrowserName(): string {
  if (typeof navigator === 'undefined') return 'Web';
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return 'Edge';
  if (/OPR\//.test(ua)) return 'Opera';
  if (/Chrome\//.test(ua)) return 'Chrome';
  if (/Firefox\//.test(ua)) return 'Firefox';
  if (/Safari\//.test(ua)) return 'Safari';
  return 'Web';
}

export function getOsName(): string {
  if (Platform.OS !== 'web') {
    return Platform.OS === 'android' ? 'Android' : Platform.OS === 'ios' ? 'iOS' : Platform.OS;
  }
  if (typeof navigator === 'undefined') return 'Web';
  const ua = navigator.userAgent;
  if (/Windows/.test(ua)) return 'Windows';
  if (/Mac OS X/.test(ua)) return 'macOS';
  if (/Android/.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
  if (/Linux/.test(ua)) return 'Linux';
  return 'Web';
}

export function getPlatformSummary(): string {
  if (Platform.OS === 'web') return `${getBrowserName()} · ${getOsName()}`;
  return getPlatformName();
}

export function getDeviceName(): string {
  if (Platform.OS === 'web') return getOsName();
  return Device.modelName ?? 'This device';
}

export function formatViewport(width: number, height: number): string {
  return `${Math.round(width)} × ${Math.round(height)}`;
}

export function getGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 5) return 'Still up';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function timeAgo(iso: string | null): string {
  if (!iso) return 'not yet';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 'not yet';
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 45) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  return formatDate(iso);
}

export function shortId(id: string): string {
  return id.replace(/(.{4})/g, '$1-').replace(/-$/, '').toUpperCase();
}
