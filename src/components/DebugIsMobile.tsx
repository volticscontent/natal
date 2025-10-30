'use client';

import { useIsMobile } from '../hooks/useIsMobile';
import { useEffect, useState } from 'react';

export default function DebugIsMobile() {
  const isMobile = useIsMobile();
  const [windowWidth, setWindowWidth] = useState<number>(0);

  useEffect(() => {
    const updateWidth = () => {
      setWindowWidth(window.innerWidth);
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[9999] bg-black text-white p-4 rounded-lg shadow-lg text-sm font-mono">
      <div>isMobile: {isMobile ? 'TRUE' : 'FALSE'}</div>
      <div>Window Width: {windowWidth}px</div>
      <div>Breakpoint: 1024px</div>
      <div>Should be mobile: {windowWidth < 1024 ? 'YES' : 'NO'}</div>
    </div>
  );
}