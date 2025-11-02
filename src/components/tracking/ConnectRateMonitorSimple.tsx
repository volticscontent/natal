'use client';

import React, { useState, useEffect } from 'react';

interface ConnectRateMetrics {
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

interface ConnectRateMonitorSimpleProps {
  compact?: boolean;
  showDetails?: boolean;
  className?: string;
}

export default function ConnectRateMonitorSimple({ 
  compact = false, 
  showDetails = true,
  className = ''
}: ConnectRateMonitorSimpleProps) {
  const [metrics, setMetrics] = useState<ConnectRateMetrics>({
    connectRate: 0.95,
    totalAttempts: 100,
    successfulConnections: 95,
    failedConnections: 5,
    averageResponseTime: 120,
    uptime: 99.5,
    lastUpdated: new Date(),
    status: 'healthy',
    circuitBreakerState: 'closed'
  });

  const [isTracking, setIsTracking] = useState(true);

  // Simular atualizações de métricas
  useEffect(() => {
    if (!isTracking) return;

    const interval = setInterval(() => {
      setMetrics(prev => {
        const baseRate = 0.95;
        const variation = (Math.random() - 0.5) * 0.1;
        const newRate = Math.max(0.7, Math.min(1.0, baseRate + variation));
        
        const totalAttempts = Math.floor(Math.random() * 100) + 50;
        const successfulConnections = Math.floor(totalAttempts * newRate);
        const failedConnections = totalAttempts - successfulConnections;
        
        let status: 'healthy' | 'warning' | 'critical' = 'healthy';
        if (newRate < 0.80) {
          status = 'critical';
        } else if (newRate < 0.90) {
          status = 'warning';
        }

        const circuitBreakerState = newRate < 0.5 ? 'open' : newRate < 0.8 ? 'half-open' : 'closed';

        // Enviar evento para GTM (simulado)
        if (typeof window !== 'undefined' && window.dataLayer) {
          window.dataLayer.push({
            event: 'connect_rate_update',
            connect_rate: newRate,
            connect_status: status,
            timestamp: new Date().toISOString()
          });
        }
        
        return {
          ...prev,
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
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isTracking]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCircuitBreakerColor = (state: string) => {
    switch (state) {
      case 'closed': return 'text-green-600';
      case 'half-open': return 'text-yellow-600';
      case 'open': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const handleManualRefresh = () => {
    setMetrics(prev => ({ ...prev, lastUpdated: new Date() }));
    
    // Enviar evento para GTM
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: 'manual_refresh',
        component: 'connect_rate_monitor',
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleToggleTracking = () => {
    setIsTracking(!isTracking);
    
    // Enviar evento para GTM
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: isTracking ? 'tracking_stopped' : 'tracking_started',
        component: 'connect_rate_monitor',
        timestamp: new Date().toISOString()
      });
    }
  };

  if (compact) {
    return (
      <div className={`p-3 bg-white rounded-lg shadow-sm border ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              metrics.status === 'healthy' ? 'bg-green-500' :
              metrics.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm font-medium">UTMfy Connect</span>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">
              {(metrics.connectRate * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">
              {metrics.totalAttempts} tentativas
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 bg-white rounded-lg shadow-lg border ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Monitor de Conectividade UTMfy
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleManualRefresh}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            Atualizar
          </button>
          <button
            onClick={handleToggleTracking}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              isTracking 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {isTracking ? 'Parar' : 'Iniciar'}
          </button>
        </div>
      </div>

      {/* Status Principal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600">
            {(metrics.connectRate * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Taxa de Conexão</div>
          <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(metrics.status)}`}>
            {metrics.status.toUpperCase()}
          </div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {metrics.successfulConnections}
          </div>
          <div className="text-sm text-gray-600">Conexões Bem-sucedidas</div>
          <div className="text-xs text-gray-500 mt-1">
            de {metrics.totalAttempts} tentativas
          </div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {metrics.failedConnections}
          </div>
          <div className="text-sm text-gray-600">Conexões Falhadas</div>
          <div className="text-xs text-gray-500 mt-1">
            {metrics.totalAttempts > 0 ? ((metrics.failedConnections / metrics.totalAttempts) * 100).toFixed(1) : 0}% de erro
          </div>
        </div>
      </div>

      {showDetails && (
        <>
          {/* Métricas Detalhadas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-2">Performance</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tempo de Resposta:</span>
                  <span className="text-sm font-medium">{metrics.averageResponseTime}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Uptime:</span>
                  <span className="text-sm font-medium">{metrics.uptime.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Circuit Breaker:</span>
                  <span className={`text-sm font-medium ${getCircuitBreakerColor(metrics.circuitBreakerState)}`}>
                    {metrics.circuitBreakerState.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-2">Status do Sistema</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tracking Ativo:</span>
                  <span className={`text-sm font-medium ${isTracking ? 'text-green-600' : 'text-red-600'}`}>
                    {isTracking ? 'SIM' : 'NÃO'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Última Atualização:</span>
                  <span className="text-sm font-medium">
                    {metrics.lastUpdated.toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">GTM Integrado:</span>
                  <span className="text-sm font-medium text-green-600">SIM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Barra de Progresso */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Taxa de Conexão</span>
              <span>{(metrics.connectRate * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  metrics.connectRate >= 0.95 ? 'bg-green-500' :
                  metrics.connectRate >= 0.90 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${metrics.connectRate * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Informações de Debug */}
          <div className="text-xs text-gray-500 border-t pt-3">
            <p>🔗 Sistema de monitoramento UTMfy integrado com Google Tag Manager</p>
            <p>📊 Métricas enviadas automaticamente para análise de performance</p>
            <p>⚡ Atualização automática a cada 5 segundos</p>
            <p>🏷️ Eventos GTM: connect_rate_update, manual_refresh, tracking_started/stopped</p>
          </div>
        </>
      )}
    </div>
  );
}