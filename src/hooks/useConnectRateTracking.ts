'use client';

import { useState, useEffect, useCallback } from 'react';
import { useGTM } from '@/components/tracking/GTMManager';

export interface ConnectRateMetrics {
  connectRate: number;
  totalAttempts: number;
  successfulConnections: number;
  failedConnections: number;
  averageResponseTime: number;
  uptime: number;
  lastUpdated: Date;
  status: 'healthy' | 'warning' | 'critical';
  circuitBreakerState: 'open' | 'closed' | 'half-open';
}

export interface ConnectRateConfig {
  threshold: number;
  warningThreshold: number;
  criticalThreshold: number;
  updateInterval: number;
  enableRealTimeTracking: boolean;
}

const DEFAULT_CONFIG: ConnectRateConfig = {
  threshold: 0.95,
  warningThreshold: 0.90,
  criticalThreshold: 0.80,
  updateInterval: 5000,
  enableRealTimeTracking: true
};

export const useConnectRateTracking = (config: Partial<ConnectRateConfig> = {}) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const { pushEvent } = useGTM();
  
  const [metrics, setMetrics] = useState<ConnectRateMetrics>({
    connectRate: 1.0,
    totalAttempts: 0,
    successfulConnections: 0,
    failedConnections: 0,
    averageResponseTime: 0,
    uptime: 100,
    lastUpdated: new Date(),
    status: 'healthy',
    circuitBreakerState: 'closed'
  });

  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simular dados de conectividade (em produção, isso viria de uma API real)
  const simulateConnectivityData = useCallback(() => {
    const baseRate = 0.95;
    const variation = (Math.random() - 0.5) * 0.1;
    const newRate = Math.max(0.7, Math.min(1.0, baseRate + variation));
    
    const totalAttempts = Math.floor(Math.random() * 100) + 50;
    const successfulConnections = Math.floor(totalAttempts * newRate);
    const failedConnections = totalAttempts - successfulConnections;
    
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (newRate < finalConfig.criticalThreshold) {
      status = 'critical';
    } else if (newRate < finalConfig.warningThreshold) {
      status = 'warning';
    }

    const circuitBreakerState: 'open' | 'closed' | 'half-open' = newRate < 0.5 ? 'open' : newRate < 0.8 ? 'half-open' : 'closed';
    
    return {
      connectRate: newRate,
      totalAttempts,
      successfulConnections,
      failedConnections,
      averageResponseTime: Math.floor(Math.random() * 200) + 50,
      uptime: Math.max(85, Math.min(100, 95 + (Math.random() - 0.5) * 10)),
      lastUpdated: new Date(),
      status,
      circuitBreakerState
    };
  }, [finalConfig]);

  // Função para atualizar métricas
  const updateMetrics = useCallback(async () => {
    try {
      setError(null);
      
      // Em produção, isso seria uma chamada para API real
      const newMetrics = simulateConnectivityData();
      
      setMetrics(prevMetrics => {
        const updatedMetrics = { ...prevMetrics, ...newMetrics };
        
        // Enviar eventos para GTM quando houver mudanças significativas
        if (Math.abs(updatedMetrics.connectRate - prevMetrics.connectRate) > 0.05) {
          pushEvent('connect_rate_change', {
            connect_rate: updatedMetrics.connectRate,
            status: updatedMetrics.status
          });
        }
        
        if (updatedMetrics.circuitBreakerState !== prevMetrics.circuitBreakerState) {
          pushEvent('circuit_breaker_change', {
            service: 'utmfy_api',
            state: updatedMetrics.circuitBreakerState
          });
        }
        
        // Enviar métricas de sistema periodicamente
        pushEvent('system_health', {
          uptime: updatedMetrics.uptime,
          response_time: updatedMetrics.averageResponseTime,
          error_rate: (updatedMetrics.failedConnections / updatedMetrics.totalAttempts) * 100
        });
        
        return updatedMetrics;
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao atualizar métricas de connect rate:', err);
    }
  }, [simulateConnectivityData, pushEvent]);

  // Iniciar/parar tracking
  const startTracking = useCallback(() => {
    if (!finalConfig.enableRealTimeTracking) return;
    
    setIsTracking(true);
    updateMetrics(); // Atualização inicial
  }, [finalConfig.enableRealTimeTracking, updateMetrics]);

  const stopTracking = useCallback(() => {
    setIsTracking(false);
  }, []);

  // Forçar atualização manual
  const refreshMetrics = useCallback(() => {
    updateMetrics();
  }, [updateMetrics]);

  // Resetar métricas
  const resetMetrics = useCallback(() => {
    setMetrics({
      connectRate: 1.0,
      totalAttempts: 0,
      successfulConnections: 0,
      failedConnections: 0,
      averageResponseTime: 0,
      uptime: 100,
      lastUpdated: new Date(),
      status: 'healthy',
      circuitBreakerState: 'closed'
    });
    setError(null);
  }, []);

  // Effect para tracking automático
  useEffect(() => {
    if (!isTracking || !finalConfig.enableRealTimeTracking) return;

    const interval = setInterval(updateMetrics, finalConfig.updateInterval);
    
    return () => {
      clearInterval(interval);
    };
  }, [isTracking, finalConfig.enableRealTimeTracking, finalConfig.updateInterval, updateMetrics]);

  // Iniciar tracking automaticamente
  useEffect(() => {
    if (finalConfig.enableRealTimeTracking) {
      startTracking();
    }
    
    return () => {
      stopTracking();
    };
  }, [finalConfig.enableRealTimeTracking, startTracking, stopTracking]);

  return {
    metrics,
    isTracking,
    error,
    config: finalConfig,
    actions: {
      startTracking,
      stopTracking,
      refreshMetrics,
      resetMetrics,
      updateMetrics
    }
  };
};