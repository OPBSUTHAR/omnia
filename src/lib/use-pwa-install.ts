import { useCallback } from 'react';

export type PwaInstallState = {
  canInstall: boolean;
  installed: boolean;
  install: () => Promise<boolean>;
};

export function usePwaInstall(): PwaInstallState {
  const install = useCallback(async () => false, []);
  return { canInstall: false, installed: false, install };
}
