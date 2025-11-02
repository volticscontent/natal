'use client';

import { useEffect, useState, useCallback } from 'react';
import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';
import type { Metric } from 'web-vitals';

// Tipos para Core Web Vitals
interface WebVitalsData {
  CLS: number | null;
  FID: number | null;
  INP: number | null;
  FCP: number | null;
  LCP: number | null;
  TTFB: number | null;
  timestamp: number;
  score: number;
}

interface WebVitalsThresholds {
  CLS: { good: number; poor: number };
  FID: { good: number; poor: number };
  INP: { good: number; poor: number };
  FCP: { good: number; poor: number };
  LCP: { good: number; poor: number };
  TTFB: { good: number; poor: number };
  score: { good: number; poor: number };
}

// Thresholds oficiais do Google
const THRESHOLDS: WebVitalsThresholds = {
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100, poor: 300 },
  INP: { good: 200, poor: 500 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
  score: { good: 75, poor: 50 }
};

// Declarações globais estão centralizadas em src/types/global.d.ts

interface CoreWebVitalsProps {
  enableRealTimeTracking?: boolean;
  enableConsoleLogging?: boolean;
  enableGA4Tracking?: boolean;
  onMetricUpdate?: (metric: Metric) => void;
}

export function CoreWebVitals({ 
  enableRealTimeTracking = true,
  enableConsoleLogging = false,
  enableGA4Tracking = true,
  onMetricUpdate
}: CoreWebVitalsProps) {
  const [vitalsData, setVitalsData] = useState<WebVitalsData>({
    CLS: null,
    FID: null,
    INP: null,
    FCP: null,
    LCP: null,
    TTFB: null,
    timestamp: Date.now(),
    score: 0
  });

  const [performanceScore, setPerformanceScore] = useState<number>(0);
  const [isClient, setIsClient] = useState(false);

  // Controle de hidratação para evitar mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Função para determinar a qualidade da métrica
  const getMetricQuality = (name: keyof WebVitalsThresholds, value: number): 'good' | 'needs-improvement' | 'poor' => {
    const threshold = THRESHOLDS[name];
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  };

  // Função para calcular score de performance (0-100)
  const calculatePerformanceScore = useCallback((data: WebVitalsData): number => {
    const metrics = Object.entries(data).filter(([key, value]) => 
      key !== 'timestamp' && value !== null
    ) as [keyof WebVitalsThresholds, number][];

    if (metrics.length === 0) return 0;

    const scores = metrics.map(([name, value]) => {
      const quality = getMetricQuality(name, value);
      switch (quality) {
        case 'good': return 100;
        case 'needs-improvement': return 50;
        case 'poor': return 0;
        default: return 0;
      }
    });

    return Math.round(scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length);
  }, []);

  // Função para enviar métricas para GA4
  const sendToGA4 = useCallback((metric: Metric) => {
    if (!enableGA4Tracking || !window.gtag) return;

    const quality = getMetricQuality(metric.name as keyof WebVitalsThresholds, metric.value);
    
    window.gtag('event', 'web_vitals', {
      event_category: 'Web Vitals',
      event_label: metric.name,
      value: Math.round(metric.value),
      custom_parameter_1: quality,
      custom_parameter_2: metric.id,
      custom_parameter_3: metric.navigationType || 'navigate',
      non_interaction: true
    });

    // Enviar para DataLayer também
    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'core_web_vitals',
        metric_name: metric.name,
        metric_value: metric.value,
        metric_quality: quality,
        metric_id: metric.id,
        navigation_type: metric.navigationType || 'navigate',
        timestamp: Date.now()
      });
    }
  }, [enableGA4Tracking]);

  // Função para processar métricas
  const handleMetric = useCallback((metric: Metric) => {
    const metricName = metric.name as keyof Omit<WebVitalsData, 'timestamp'>;
    
    setVitalsData(prev => {
      const newData = {
        ...prev,
        [metricName]: metric.value,
        timestamp: Date.now()
      };
      
      // Calcular novo score de performance
      const newScore = calculatePerformanceScore(newData);
      setPerformanceScore(newScore);
      
      return newData;
    });

    // Logging opcional
    if (enableConsoleLogging) {
      const quality = getMetricQuality(metricName, metric.value);
      console.log(`🔍 Core Web Vitals - ${metric.name}:`, {
        value: metric.value,
        quality,
        id: metric.id,
        navigationType: metric.navigationType
      });
    }

    // Enviar para GA4
    sendToGA4(metric);

    // Callback personalizado
    if (onMetricUpdate) {
      onMetricUpdate(metric);
    }

    // Alertas para métricas críticas
    const quality = getMetricQuality(metricName, metric.value);
    if (quality === 'poor') {
      console.warn(`⚠️ Core Web Vitals Alert: ${metric.name} is in POOR range (${metric.value})`);
      
      // Enviar alerta para GA4
      if (window.gtag) {
        window.gtag('event', 'performance_alert', {
          event_category: 'Performance',
          event_label: `Poor ${metric.name}`,
          value: Math.round(metric.value),
          non_interaction: true
        });
      }
    }
  }, [enableConsoleLogging, onMetricUpdate, calculatePerformanceScore, sendToGA4]);

  // Configurar Core Web Vitals
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Configurar listeners para Core Web Vitals
    onCLS(handleMetric);
    onINP(handleMetric);
    onFCP(handleMetric);
    onLCP(handleMetric);
    onTTFB(handleMetric);

    // Enviar evento de inicialização
    if (window.gtag) {
      window.gtag('event', 'core_web_vitals_init', {
        event_category: 'Performance',
        event_label: 'Monitoring Started',
        non_interaction: true
      });
    }

    // Cleanup não é necessário para web-vitals
  }, [handleMetric]);

  // Emitir evento personalizado quando vitalsData for atualizado
  useEffect(() => {
    // Emitir evento personalizado para outros componentes
    const event = new CustomEvent('web-vitals-update', {
      detail: vitalsData
    });
    window.dispatchEvent(event);
  }, [vitalsData]);

  // Enviar resumo final quando o usuário sair da página
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!window.gtag) return;

      window.gtag('event', 'core_web_vitals_summary', {
        event_category: 'Performance',
        event_label: 'Session Summary',
        value: performanceScore,
        custom_parameter_1: vitalsData.CLS,
        custom_parameter_2: vitalsData.FID,
        custom_parameter_3: vitalsData.FCP,
        custom_parameter_4: vitalsData.LCP,
        custom_parameter_5: vitalsData.TTFB,
        non_interaction: true
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [vitalsData, performanceScore]);

  // Não renderizar nada em produção (componente de tracking)
  if (process.env.NODE_ENV === 'production' && !enableRealTimeTracking) {
    return null;
  }

  // Componente de debug/desenvolvimento
  if (enableRealTimeTracking && process.env.NODE_ENV === 'development') {
    return (
      <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-xs font-mono z-50 max-w-xs">
        <div className="font-bold mb-2 text-center">
          Core Web Vitals
          <div className={`text-lg ${
            performanceScore >= 80 ? 'text-green-700' : 
            performanceScore >= 50 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {performanceScore}/100
          </div>
        </div>
        
        {Object.entries(vitalsData).map(([key, value]) => {
          if (key === 'timestamp' || value === null) return null;
          
          const quality = getMetricQuality(key as keyof WebVitalsThresholds, value);
          const colorClass = quality === 'good' ? 'text-green-700' : 
                           quality === 'needs-improvement' ? 'text-yellow-600' : 'text-red-600';
          
          return (
            <div key={key} className="flex justify-between items-center py-1">
              <span className="font-medium">{key}:</span>
              <span className={colorClass}>
                {key === 'CLS' ? value.toFixed(3) : Math.round(value)}
                {key !== 'CLS' && 'ms'}
              </span>
            </div>
          );
        })}
        
        {isClient && (
          <div className="text-xs text-gray-500 mt-2 text-center">
            Updated: {new Date(vitalsData.timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>
    );
  }

  return null;
}

// Hook personalizado para usar os Core Web Vitals
export function useWebVitals() {
  const [vitals, setVitals] = useState<WebVitalsData>({
    CLS: null,
    FID: null,
    INP: null,
    FCP: null,
    LCP: null,
    TTFB: null,
    timestamp: Date.now(),
    score: 0
  });

  useEffect(() => {
    const handleVitalsUpdate = (event: CustomEvent<WebVitalsData>) => {
      setVitals(event.detail);
    };

    window.addEventListener('web-vitals-update', handleVitalsUpdate as EventListener);
    
    return () => {
      window.removeEventListener('web-vitals-update', handleVitalsUpdate as EventListener);
    };
  }, []);

  return vitals;
}

export default CoreWebVitals;