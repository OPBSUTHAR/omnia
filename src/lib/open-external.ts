import * as Linking from 'expo-linking';

export async function openExternal(url: string): Promise<void> {
  if (typeof window !== 'undefined' && /^https?:/i.test(url)) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
  await Linking.openURL(url);
}
