'use client';

import { useEffect } from 'react';





export default function AsyncTrackingScripts() {
  useEffect(() => {
    let scriptsLoaded = false;

    const loadTrackingScripts = () => {
      if (scriptsLoaded) return;
      scriptsLoaded = true;

      // Carrega apenas Google Analytics para reduzir overhead
      if (process.env.NEXT_PUBLIC_GTM_ID) {
        const gtmScript = document.createElement('script');
        gtmScript.async = true;
        gtmScript.src = `https://www.googletagmanager.com/gtm.js?id=${process.env.NEXT_PUBLIC_GTM_ID}`;
        document.head.appendChild(gtmScript);
        
        // DataLayer
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          'gtm.start': new Date().getTime(),
          event: 'gtm.js'
        });
      }
    };

    // Carrega scripts apenas após interação do usuário com throttling
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    let isLoaded = false;
    
    const handleInteraction = () => {
      if (isLoaded) return;
      
      // Usar requestIdleCallback para não bloquear UI
      if (window.requestIdleCallback) {
        window.requestIdleCallback(() => {
          if (!isLoaded) {
            loadTrackingScripts();
            isLoaded = true;
            events.forEach(event => {
              document.removeEventListener(event, handleInteraction, true);
            });
          }
        }, { timeout: 1000 });
      } else {
        setTimeout(() => {
          if (!isLoaded) {
            loadTrackingScripts();
            isLoaded = true;
            events.forEach(event => {
              document.removeEventListener(event, handleInteraction, true);
            });
          }
        }, 0);
      }
    };

    // Usar passive listeners para melhor performance
    events.forEach(event => {
      document.addEventListener(event, handleInteraction, { passive: true, once: true });
    });

    // Fallback: carrega após 5 segundos se não houver interação
    const fallbackTimer = setTimeout(loadTrackingScripts, 5000);

    return () => {
      clearTimeout(fallbackTimer);
      events.forEach(event => {
        document.removeEventListener(event, handleInteraction, true);
      });
    };
  }, []);

  return null;
}