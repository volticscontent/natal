'use client';

import { useEffect } from 'react';

export default function PixelScripts() {
  useEffect(() => {
    window.__pixelScriptsMounted = true;

    const fbId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
    const ttId = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;

    if (fbId) {
      const fbScript = document.createElement('script');
      fbScript.async = true;
      fbScript.src = 'https://connect.facebook.net/en_US/fbevents.js';
      fbScript.onload = () => {
        window.fbq?.('init', fbId);
        window.fbq?.('track', 'PageView');
      };
      document.head.appendChild(fbScript);
    }

    if (ttId) {
      const ttScript = document.createElement('script');
      ttScript.async = true;
      ttScript.src = `https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${ttId}&lib=ttq`;
      ttScript.onload = () => {
        window.ttq?.page();
      };
      document.head.appendChild(ttScript);
    }
  }, []);

  return null;
}
