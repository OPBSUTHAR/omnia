export type UpdateFeed = {
  version: string;
  releasedAt?: string;
  notes: string[];
  apkUrl?: string;
  windowsUrl?: string;
  linuxUrl?: string;
  webUrl?: string;
  docsUrl?: string;
  releasesUrl?: string;
  mandatory?: boolean;
};

export type UpdateCheckStatus = 'idle' | 'checking' | 'up-to-date' | 'available' | 'error';
