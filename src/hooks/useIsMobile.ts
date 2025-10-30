'use client';

import { useState, useEffect } from 'react';

export const useIsMobile = (breakpoint: number = 768): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isClient, setIsClient] = useState<boolean>(false);

  useEffect(() => {
    // Marca que estamos no cliente
    setIsClient(true);
    
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // Check on mount
    checkIsMobile();

    // Add event listener
    window.addEventListener('resize', checkIsMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkIsMobile);
  }, [breakpoint]);

  // Durante SSR ou antes da hidratação, sempre retorna false
  // Isso evita mismatch de hidratação
  if (!isClient) {
    return false;
  }

  return isMobile;
};

export default useIsMobile;