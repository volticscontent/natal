'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSmartTracking } from './useSmartTracking';

interface EngagementMetrics {
  scrollDepth: number;
  timeOnPage: number;
  interactions: number;
  lastActivity: number;
}

export function useEngagementTracking() {
  const { trackEvent, trackScrollDepth } = useSmartTracking();
  const metrics = useRef<EngagementMetrics>({
    scrollDepth: 0,
    timeOnPage: 0,
    interactions: 0,
    lastActivity: Date.now()
  });
  
  const scrollThresholds = useRef(new Set<number>());
  const startTime = useRef(Date.now());
  const isVisible = useRef(true);

  // Tracking de scroll depth
  const handleScroll = useCallback(() => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = Math.round((scrollTop / documentHeight) * 100);
    
    metrics.current.scrollDepth = Math.max(metrics.current.scrollDepth, scrollPercent);
    metrics.current.lastActivity = Date.now();

    // Track marcos de scroll (25%, 50%, 75%, 100%)
    const thresholds = [25, 50, 75, 100];
    thresholds.forEach(threshold => {
      if (scrollPercent >= threshold && !scrollThresholds.current.has(threshold)) {
        scrollThresholds.current.add(threshold);
        trackScrollDepth(threshold);
      }
    });
  }, [trackScrollDepth]);

  // Tracking de visibilidade da página
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      isVisible.current = false;
      // Track tempo na página quando sai
      const timeOnPage = Date.now() - startTime.current;
      trackEvent('session_quality', 'low', {
        time_on_page: timeOnPage,
        scroll_depth: metrics.current.scrollDepth,
        interactions: metrics.current.interactions,
        page_hidden: true
      });
    } else {
      isVisible.current = true;
      startTime.current = Date.now(); // Reset timer quando volta
    }
  }, [trackEvent]);

  // Tracking de interações gerais
  const trackInteraction = useCallback((type: string, element?: string) => {
    metrics.current.interactions++;
    metrics.current.lastActivity = Date.now();
    
    trackEvent('form_interaction', 'medium', {
      interaction_type: type,
      element,
      total_interactions: metrics.current.interactions,
      time_since_start: Date.now() - startTime.current
    });
  }, [trackEvent]);

  // Tracking de exit intent (apenas desktop)
  const handleMouseLeave = useCallback((e: MouseEvent) => {
    if (e.clientY <= 0 && window.innerWidth > 768) {
      trackEvent('exit_intent', 'medium', {
        time_on_page: Date.now() - startTime.current,
        scroll_depth: metrics.current.scrollDepth,
        interactions: metrics.current.interactions
      });
    }
  }, [trackEvent]);

  // Setup dos event listeners
  useEffect(() => {
    // Capture ref values at the beginning of the effect
    const currentMetrics = metrics.current;
    
    // Throttle scroll events
    let scrollTimeout: NodeJS.Timeout;
    const throttledScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScroll, 100);
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('mouseleave', handleMouseLeave);

    // Track page view inicial (pular em páginas de personalização /pers/* para evitar duplicidade)
    const path = window.location.pathname;
    const isPersPage = path.includes('/pers/');
    if (!isPersPage) {
      trackEvent('page_view', 'medium', {
        page: path,
        referrer: document.referrer,
        timestamp: Date.now()
      });
    }

    return () => {
      document.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('mouseleave', handleMouseLeave);
      clearTimeout(scrollTimeout);
      
      // Track métricas finais ao sair da página
      if (isVisible.current) {
        const finalTimeOnPage = Date.now() - startTime.current;
        trackEvent('session_quality', 'low', {
          time_on_page: finalTimeOnPage,
          scroll_depth: currentMetrics.scrollDepth,
          interactions: currentMetrics.interactions,
          page_unload: true
        });
      }
    };
  }, [handleScroll, handleVisibilityChange, handleMouseLeave, trackEvent]);

  // Função para tracking manual de interações
  const trackClick = useCallback((elementName: string, elementType: 'button' | 'link' | 'cta' = 'button') => {
    trackInteraction('click', `${elementType}:${elementName}`);
  }, [trackInteraction]);

  const trackFormFocus = useCallback((fieldName: string) => {
    trackInteraction('form_focus', `field:${fieldName}`);
  }, [trackInteraction]);

  const trackFormChange = useCallback((fieldName: string) => {
    trackInteraction('form_change', `field:${fieldName}`);
  }, [trackInteraction]);

  // Obter métricas atuais
  const getCurrentMetrics = useCallback((): EngagementMetrics & { timeOnPage: number } => {
    return {
      ...metrics.current,
      timeOnPage: Date.now() - startTime.current
    };
  }, []);

  return {
    trackClick,
    trackFormFocus,
    trackFormChange,
    trackInteraction,
    getCurrentMetrics,
    metrics: metrics.current
  };
}