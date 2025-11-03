'use client';

import { useEffect, useRef } from 'react';
import { platformManager } from '@/lib/tracking/platforms';
import { useUtmify } from './useUtmify';

/**
 * Hook para inicializar e gerenciar pixels de tracking
 */
export function usePixelTracking() {
  const isInitialized = useRef(false);
  const { trackEvent: trackUtmifyEvent, isLoaded: utmifyLoaded } = useUtmify();

  console.log('🎯 usePixelTracking - Hook chamado, isInitialized:', isInitialized.current);

  useEffect(() => {
    console.log('🎯 usePixelTracking - useEffect executado, window:', typeof window, 'isInitialized:', isInitialized.current);
    
    // Inicializar pixels apenas uma vez
    if (!isInitialized.current && typeof window !== 'undefined') {
      console.log('🚀 usePixelTracking - Iniciando inicialização dos pixels...');
      isInitialized.current = true;
      
      // Inicializar todos os pixels
      platformManager.initializeAll().then(() => {
        console.log('🎉 usePixelTracking - Todos os pixels foram inicializados com sucesso');
      }).catch((error) => {
        console.error('❌ usePixelTracking - Erro ao inicializar pixels:', error);
      });
    } else {
      console.log('⏭️ usePixelTracking - Inicialização pulada:', {
        isInitialized: isInitialized.current,
        windowType: typeof window
      });
    }
  }, []);

  return {
    trackEvent: (eventName: string, parameters?: Record<string, unknown>) => {
      console.log('📊 usePixelTracking - Enviando evento:', eventName, parameters);
      platformManager.trackEventToAll(eventName, parameters);
      
      // Enviar também para UTMify se carregada
      if (utmifyLoaded && trackUtmifyEvent) {
        trackUtmifyEvent(eventName, parameters);
      }
    },
    trackConversion: (parameters?: Record<string, unknown>) => {
      console.log('💰 usePixelTracking - Enviando conversão:', parameters);
      platformManager.trackConversion(parameters);
      
      // Enviar conversão para UTMify se carregada
      if (utmifyLoaded && trackUtmifyEvent) {
        trackUtmifyEvent('purchase', parameters);
      }
    }
  };
}