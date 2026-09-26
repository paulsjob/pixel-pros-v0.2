import { useState, useEffect } from 'react';

export type DeviceMode = 'mobile' | 'desktop';

/**
 * Hook to detect whether the user is visiting from mobile or desktop.
 * Splits the app experience:
 * - Desktop: big buttons, big helmets, bold cards, big avatars, high real-estate arcade layout.
 * - Mobile: compact, snug, properly-proportioned touch buttons (no oversized/huge buttons).
 * Supports URL parameter ?mode=desktop or ?mode=mobile, user agent, and screen resize.
 */
export function useDeviceMode(): {
  isMobile: boolean;
  isDesktop: boolean;
  deviceMode: DeviceMode;
  setManualOverride: (mode: DeviceMode | null) => void;
} {
  const [manualOverride, setManualOverride] = useState<DeviceMode | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlMode = params.get('mode');
        if (urlMode === 'mobile' || urlMode === 'desktop') return urlMode;
        const stored = localStorage.getItem('pixel_pros_device_override');
        if (stored === 'mobile' || stored === 'desktop') return stored;
      } catch {}
    }
    return null;
  });

  const [windowWidth, setWindowWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') return window.innerWidth;
    return 1024;
  });

  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return (
        /Mobi|Android|iPhone|iPod/i.test(navigator.userAgent) ||
        (navigator.maxTouchPoints > 1 && window.innerWidth < 768)
      );
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setIsTouchDevice(
        /Mobi|Android|iPhone|iPod/i.test(navigator.userAgent) ||
        (navigator.maxTouchPoints > 1 && window.innerWidth < 768)
      );
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = manualOverride
    ? manualOverride === 'mobile'
    : windowWidth < 768 || (isTouchDevice && windowWidth < 1024);
  const isDesktop = !isMobile;
  const deviceMode: DeviceMode = isMobile ? 'mobile' : 'desktop';

  const updateOverride = (mode: DeviceMode | null) => {
    setManualOverride(mode);
    if (typeof window !== 'undefined') {
      try {
        if (mode) localStorage.setItem('pixel_pros_device_override', mode);
        else localStorage.removeItem('pixel_pros_device_override');
      } catch {}
    }
  };

  return {
    isMobile,
    isDesktop,
    deviceMode,
    setManualOverride: updateOverride,
  };
}
