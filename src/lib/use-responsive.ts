import { useWindowDimensions } from 'react-native';

import { layout } from '@/features/theme/tokens';

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  return {
    width,
    height,
    isMobile: width < layout.tablet,
    isTablet: width >= layout.tablet && width < layout.desktop,
    isDesktop: width >= layout.desktop,
    isLandscape: width > height,
  };
}
