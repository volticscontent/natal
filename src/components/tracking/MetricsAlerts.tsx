'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWebVitals } from './CoreWebVitals';
import { useAdvancedTracking } from '@/hooks/useAdvancedTracking';

// Tipos para alertas
interface Alert {
  id: string;
  type: 'performance' | 'conversion' | 'engagement' | 'error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: number;
  metric?: string;
  value?: number;
  threshold?: number;
  dismissed?: boolean;
}

interface AlertThresholds {
  performance: {
    LCP: number; // ms
    FID: number; // ms
    CLS: number; // score
    FCP: number; // ms
    TTFB: number; // ms
    overallScore: number; // 0-100
  };
  engagement: {
    bounceRate: number; // %
    sessionDuration: number; // seconds
    scrollDepth: number; // %
  };
  conversion: {
    abandonmentRate: number; // %
    conversionRate: number; // %
    errorRate: number; // %
  };
}

// Thresholds padrão baseados nas melhores práticas
const DEFAULT_THRESHOLDS: AlertThresholds = {
  performance: {
    LCP: 4000, // Poor threshold
    FID: 300,  // Poor threshold
    CLS: 0.25, // Poor threshold
    FCP: 4000, // Poor threshold
    TTFB: 1800, // Poor threshold
    overallScore: 50 // Below average
  },
  engagement: {
    bounceRate: 70, // High bounce rate
    sessionDuration: 30, // Less than 30 seconds
    scrollDepth: 25 // Less than 25% scroll
  },
  conversion: {
    abandonmentRate: 80, // High abandonment
    conversionRate: 2, // Low conversion
    errorRate: 5 // High error rate
  }
};

interface MetricsAlertsProps {
  thresholds?: Partial<AlertThresholds>;
  enableNotifications?: boolean;
  maxAlerts?: number;
  autoHideDelay?: number; // ms
}

export function MetricsAlerts({
  thresholds = {},
  enableNotifications = true,
  maxAlerts = 5,
  autoHideDelay = 10000
}: MetricsAlertsProps) {
  const webVitals = useWebVitals();
  const { getSessionData } = useAdvancedTracking();
  
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  
  // Merge thresholds with defaults
  const finalThresholds: AlertThresholds = {
    performance: { ...DEFAULT_THRESHOLDS.performance, ...thresholds.performance },
    engagement: { ...DEFAULT_THRESHOLDS.engagement, ...thresholds.engagement },
    conversion: { ...DEFAULT_THRESHOLDS.conversion, ...thresholds.conversion }
  };

  // Função para criar um alerta
  const createAlert = useCallback((
    type: Alert['type'],
    severity: Alert['severity'],
    title: string,
    message: string,
    metric?: string,
    value?: number,
    threshold?: number
  ): Alert => ({
    id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    severity,
    title,
    message,
    timestamp: Date.now(),
    metric,
    value,
    threshold,
    dismissed: false
  }), []);

  // Função para adicionar alerta
  const addAlert = useCallback((alert: Alert) => {
    setAlerts(prev => {
      // Evitar alertas duplicados
      const exists = prev.some(a => 
        a.type === alert.type && 
        a.metric === alert.metric && 
        !a.dismissed &&
        (Date.now() - a.timestamp) < 60000 // 1 minuto
      );
      
      if (exists) return prev;
      
      const newAlerts = [alert, ...prev].slice(0, maxAlerts);
      
      // Mostrar notificação do browser se habilitado
      if (enableNotifications && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(`${alert.title}`, {
          body: alert.message,
          icon: '/favicon.ico',
          tag: alert.id
        });
      }
      
      // Auto-hide após delay
      if (autoHideDelay > 0) {
        setTimeout(() => {
          setAlerts(current => 
            current.map(a => a.id === alert.id ? { ...a, dismissed: true } : a)
          );
        }, autoHideDelay);
      }
      
      return newAlerts;
    });
    
    setIsVisible(true);
  }, [enableNotifications, maxAlerts, autoHideDelay]);

  // Verificar Core Web Vitals
  useEffect(() => {
    const checkPerformanceMetrics = () => {
      const { LCP, FID, CLS, score } = webVitals;
      
      // Verificar LCP
      if (LCP && LCP > finalThresholds.performance.LCP) {
        addAlert(createAlert(
          'performance',
          LCP > 6000 ? 'critical' : 'high',
          'LCP Crítico',
          `Largest Contentful Paint está em ${LCP.toFixed(0)}ms (limite: ${finalThresholds.performance.LCP}ms)`,
          'LCP',
          LCP,
          finalThresholds.performance.LCP
        ));
      }
      
      // Verificar FID
      if (FID && FID > finalThresholds.performance.FID) {
        addAlert(createAlert(
          'performance',
          FID > 500 ? 'critical' : 'high',
          'FID Elevado',
          `First Input Delay está em ${FID.toFixed(0)}ms (limite: ${finalThresholds.performance.FID}ms)`,
          'FID',
          FID,
          finalThresholds.performance.FID
        ));
      }
      
      // Verificar CLS
      if (CLS && CLS > finalThresholds.performance.CLS) {
        addAlert(createAlert(
          'performance',
          CLS > 0.5 ? 'critical' : 'high',
          'CLS Problemático',
          `Cumulative Layout Shift está em ${CLS.toFixed(3)} (limite: ${finalThresholds.performance.CLS})`,
          'CLS',
          CLS,
          finalThresholds.performance.CLS
        ));
      }
      
      // Verificar score geral
      if (score < finalThresholds.performance.overallScore) {
        addAlert(createAlert(
          'performance',
          score < 25 ? 'critical' : 'medium',
          'Performance Baixa',
          `Score de performance está em ${score}/100 (mínimo: ${finalThresholds.performance.overallScore})`,
          'score',
          score,
          finalThresholds.performance.overallScore
        ));
      }
    };

    if (webVitals.score > 0) {
      checkPerformanceMetrics();
    }
  }, [webVitals, finalThresholds.performance, addAlert, createAlert]);

  // Verificar métricas de engagement
  useEffect(() => {
    const checkEngagementMetrics = () => {
      const sessionData = getSessionData();
      const sessionDuration = sessionData.session_duration / 1000; // Convert to seconds
      const maxScrollDepth = Math.max(...Array.from(sessionData.scroll_depths), 0);
      
      // Verificar duração da sessão (apenas após 1 minuto)
      if (sessionDuration > 60 && sessionDuration < finalThresholds.engagement.sessionDuration) {
        addAlert(createAlert(
          'engagement',
          'medium',
          'Sessão Curta',
          `Usuário está há apenas ${Math.round(sessionDuration)}s no site (mínimo esperado: ${finalThresholds.engagement.sessionDuration}s)`,
          'sessionDuration',
          sessionDuration,
          finalThresholds.engagement.sessionDuration
        ));
      }
      
      // Verificar scroll depth (apenas após 30 segundos)
      if (sessionDuration > 30 && maxScrollDepth < finalThresholds.engagement.scrollDepth) {
        addAlert(createAlert(
          'engagement',
          'low',
          'Baixo Engajamento',
          `Usuário scrollou apenas ${maxScrollDepth}% da página (mínimo: ${finalThresholds.engagement.scrollDepth}%)`,
          'scrollDepth',
          maxScrollDepth,
          finalThresholds.engagement.scrollDepth
        ));
      }
    };

    // Verificar métricas de engagement periodicamente com otimização
    const checkWithIdleCallback = () => {
      if (window.requestIdleCallback) {
        window.requestIdleCallback(checkEngagementMetrics, { timeout: 5000 });
      } else {
        setTimeout(checkEngagementMetrics, 0);
      }
    };
    
    const interval = setInterval(checkWithIdleCallback, 60000); // Aumentado para 60 segundos
    return () => clearInterval(interval);
  }, [getSessionData, finalThresholds.engagement, addAlert, createAlert]);

  // Solicitar permissão para notificações
  useEffect(() => {
    if (enableNotifications && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [enableNotifications]);

  // Função para dispensar alerta
  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, dismissed: true } : alert
    ));
  };

  // Função para limpar todos os alertas
  const clearAllAlerts = () => {
    setAlerts([]);
    setIsVisible(false);
  };

  // Filtrar alertas não dispensados
  const activeAlerts = alerts.filter(alert => !alert.dismissed);

  // Função para obter cor do alerta
  const getAlertColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'low': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'high': return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'critical': return 'bg-red-50 border-red-200 text-red-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  // Função para obter ícone do alerta
  const getAlertIcon = (type: Alert['type'], severity: Alert['severity']) => {
    if (severity === 'critical') return '🚨';
    
    switch (type) {
      case 'performance': return '⚡';
      case 'conversion': return '💰';
      case 'engagement': return '👥';
      case 'error': return '❌';
      default: return '⚠️';
    }
  };

  if (activeAlerts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-80">
      {/* Header */}
      <div className="bg-white border border-gray-300 rounded-t-lg p-3 flex justify-between items-center shadow-lg">
        <div className="flex items-center space-x-2">
          <span className="text-lg">🔔</span>
          <h3 className="font-semibold text-gray-800">
            Alertas ({activeAlerts.length})
          </h3>
        </div>
        <div className="flex space-x-1">
          <button
            onClick={() => setIsVisible(!isVisible)}
            className="text-gray-500 hover:text-gray-700 p-1"
            title={isVisible ? 'Minimizar' : 'Expandir'}
          >
            {isVisible ? '−' : '+'}
          </button>
          <button
            onClick={clearAllAlerts}
            className="text-gray-500 hover:text-gray-700 p-1"
            title="Limpar todos"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Alerts List */}
      {isVisible && (
        <div className="bg-white border-l border-r border-b border-gray-300 rounded-b-lg shadow-lg max-h-96 overflow-y-auto">
          {activeAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 border-b border-gray-100 last:border-b-0 ${getAlertColor(alert.severity)}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-2 flex-1">
                  <span className="text-lg">
                    {getAlertIcon(alert.type, alert.severity)}
                  </span>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{alert.title}</h4>
                    <p className="text-xs mt-1 opacity-90">{alert.message}</p>
                    <div className="text-xs mt-2 opacity-75">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="text-gray-400 hover:text-gray-600 ml-2"
                  title="Dispensar"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MetricsAlerts;