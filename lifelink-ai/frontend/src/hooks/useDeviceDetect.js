import { useState, useEffect } from 'react';

export function useDeviceDetect() {
  const detectIsMobile = () => {
    if (typeof window === 'undefined') return false;
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isMobileUA = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isNarrowScreen = window.innerWidth < 768;
    return isMobileUA || isNarrowScreen;
  };

  const [isMobileDevice, setIsMobileDevice] = useState(detectIsMobile);
  const [viewMode, setViewMode] = useState(() => (detectIsMobile() ? 'mobile' : 'laptop'));

  useEffect(() => {
    const handleResize = () => {
      const mobile = detectIsMobile();
      setIsMobileDevice(mobile);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    isMobile: isMobileDevice,
    viewMode,
    setViewMode,
  };
}
