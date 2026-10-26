export type UpdateFeed = {
  version: string;
  releasedAt?: string;
  notes: string[];
  apkUrl?: string;
  webUrl?: string;
  releasesUrl?: string;
  mandatory?: boolean;
};

export type UpdateCheckStatus = 'idle' | 'checking' | 'up-to-date' | 'available' | 'error';
