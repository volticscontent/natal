'use client';

import { useEffect, useState } from 'react';
import GTMManager from './GTMManager';
import UTMTracker from './UTMTracker';
import CTATracker from './CTATracker';
import AdPlatformTags from './AdPlatformTags';
import { TRACKING_CONFIG, shouldTrackEvent } from '@/lib/tracking-optimization';

interface TrackingProviderProps {
  children: React.ReactNode;
  enableCTATracking?: boolean;
  enableUTMTracking?: boolean;
  enablePersonalizationTracking?: boolean;
  debugMode?: boolean;
}

export default function TrackingProvider({
  children,
  enableCTATracking = true,
  enableUTMTracking = true,
  enablePersonalizationTracking = true,
  debugMode = TRACKING_CONFIG.DEBUG_MODE
}: TrackingProviderProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Só renderizar no cliente para evitar hidration mismatch
  if (!isClient) {
    return <>{children}</>;
  }

  return (
    <>
      {/* GTM Manager - sempre ativo */}
      <GTMManager />
      
      {/* Ad Platform Tags - configuração de Facebook, TikTok e Google Ads */}
      <AdPlatformTags 
        enableFacebook={!!process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID}
        enableTikTok={!!process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID}
        enableGoogle={!!process.env.NEXT_PUBLIC_GA4_ID}
      />
      
      {/* UTM Tracker - captura e persiste UTMs */}
      {enableUTMTracking && <UTMTracker />}
      
      {/* CTA Tracker - envolve o conteúdo para capturar cliques */}
      {enableCTATracking ? (
        <CTATracker>
          {children}
        </CTATracker>
      ) : (
        children
      )}
      
      {/* Debug Panel - apenas em modo debug */}
      {debugMode && process.env.NEXT_PUBLIC_TRACKING_DEBUG === 'true' && (
        <TrackingDebugPanel />
      )}
    </>
  );
}

// Componente de debug para visualizar eventos em tempo real
function TrackingDebugPanel() {
  const [events, setEvents] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Interceptar eventos do dataLayer
    const originalPush = window.dataLayer?.push;
    if (originalPush) {
      window.dataLayer.push = function(...args: any[]) {
        // Adicionar evento ao debug panel
        setEvents(prev => [...prev.slice(-9), ...args].slice(-10)); // Manter apenas os últimos 10
        return originalPush.apply(this, args);
      };
    }

    // Cleanup
    return () => {
      if (originalPush) {
        window.dataLayer.push = originalPush;
      }
    };
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9999,
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}
        title="Abrir Debug Panel"
      >
        🐛
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '400px',
        maxHeight: '500px',
        backgroundColor: 'rgba(0,0,0,0.9)',
        color: 'white',
        borderRadius: '8px',
        padding: '16px',
        zIndex: 9999,
        fontSize: '12px',
        fontFamily: 'monospace',
        overflow: 'auto',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '14px' }}>🏷️ GTM Debug Panel</h3>
        <button
          onClick={() => setIsVisible(false)}
          style={{
            backgroundColor: 'transparent',
            color: 'white',
            border: 'none',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>
      </div>
      
      <div style={{ marginBottom: '12px' }}>
        <strong>Eventos Recentes ({events.length}):</strong>
        <button
          onClick={() => setEvents([])}
          style={{
            marginLeft: '8px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '2px 6px',
            fontSize: '10px',
            cursor: 'pointer'
          }}
        >
          Limpar
        </button>
      </div>
      
      <div style={{ maxHeight: '300px', overflow: 'auto' }}>
        {events.length === 0 ? (
          <div style={{ color: '#888', fontStyle: 'italic' }}>
            Nenhum evento capturado ainda...
          </div>
        ) : (
          events.map((event, index) => (
            <div
              key={index}
              style={{
                marginBottom: '8px',
                padding: '8px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: '4px',
                borderLeft: '3px solid #007bff'
              }}
            >
              <div style={{ fontWeight: 'bold', color: '#4fc3f7' }}>
                {event.event || 'Unknown Event'}
              </div>
              <div style={{ fontSize: '10px', color: '#888', marginBottom: '4px' }}>
                {new Date().toLocaleTimeString()}
              </div>
              <pre style={{ 
                margin: 0, 
                fontSize: '10px', 
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: '100px',
                overflow: 'auto'
              }}>
                {JSON.stringify(event, (key, value) => {
                  // Evitar serializar objetos problemáticos
                  if (value === window || value === document || value === global) {
                    return '[Global Object]';
                  }
                  
                  if (value instanceof HTMLElement) {
                    return `[HTMLElement: ${value.tagName}]`;
                  }
                  
                  if (value instanceof Element) {
                    return `[Element: ${value.tagName}]`;
                  }
                  
                  if (value instanceof Node) {
                    return `[Node: ${value.nodeName}]`;
                  }
                  
                  if (value instanceof Window) {
                    return '[Window Object]';
                  }
                  
                  if (value instanceof Event) {
                    return `[Event: ${value.type || 'Unknown'}]`;
                  }
                  
                  if (typeof value === 'function') {
                    return `[Function: ${value.name || 'Anonymous'}]`;
                  }
                  
                  if (typeof value === 'object' && value !== null) {
                    // Verificar se é um objeto React Fiber ou similar
                    if (value.constructor && (
                      value.constructor.name === 'FiberNode' ||
                      value.constructor.name === 'HTMLButtonElement' ||
                      value.constructor.name === 'Window' ||
                      key.includes('react') ||
                      key.includes('fiber') ||
                      key.includes('__') ||
                      key === 'window' ||
                      key === 'document' ||
                      key === 'target' ||
                      key === 'currentTarget' ||
                      key === 'srcElement'
                    )) {
                      return '[Circular Reference Removed]';
                    }
                    
                    // Verificar se o objeto tem propriedades circulares comuns
                    if (value.window === value || value.self === value || value.parent === value) {
                      return '[Circular Reference Removed]';
                    }
                  }
                  
                  return value;
                }, 2)}
              </pre>
            </div>
          ))
        )}
      </div>
      
      <div style={{ marginTop: '12px', fontSize: '10px', color: '#888' }}>
        <div>GTM ID: {process.env.NEXT_PUBLIC_GTM_ID}</div>
        <div>GA4 ID: {process.env.NEXT_PUBLIC_GA4_ID}</div>
        <div>FB Pixel: {process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID}</div>
        <div>Debug: {process.env.NEXT_PUBLIC_TRACKING_DEBUG}</div>
      </div>
    </div>
  );
}

// Hook para usar o sistema de tracking completo
export function useTracking() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Aguardar GTM estar pronto
    const checkGTM = () => {
      if (typeof window !== 'undefined' && window.dataLayer) {
        setIsReady(true);
      } else {
        setTimeout(checkGTM, 100);
      }
    };
    checkGTM();
  }, []);

  const trackEvent = (eventName: string, eventData: Record<string, any> = {}) => {
    if (!isReady || typeof window === 'undefined' || !window.dataLayer) return;

    window.dataLayer.push({
      event: eventName,
      ...eventData,
      timestamp: new Date().toISOString()
    });
  };

  const trackPageView = (pagePath?: string) => {
    trackEvent('page_view', {
      page_path: pagePath || window.location.pathname,
      page_title: document.title,
      page_location: window.location.href
    });
  };

  const trackPurchase = (transactionData: {
    transaction_id: string;
    value: number;
    currency: string;
    items: Array<{
      item_id: string;
      item_name: string;
      category: string;
      quantity: number;
      price: number;
    }>;
  }) => {
    trackEvent('purchase', {
      currency: transactionData.currency,
      value: transactionData.value,
      transaction_id: transactionData.transaction_id,
      ecommerce: {
        transaction_id: transactionData.transaction_id,
        value: transactionData.value,
        currency: transactionData.currency,
        items: transactionData.items
      }
    });
  };

  const trackLead = (leadData: {
    email?: string;
    phone?: string;
    name?: string;
    source?: string;
    value?: number;
  }) => {
    trackEvent('generate_lead', {
      currency: 'BRL',
      value: leadData.value || 0,
      lead_source: leadData.source || 'website',
      user_data: {
        email: leadData.email,
        phone: leadData.phone,
        name: leadData.name
      }
    });
  };

  return {
    isReady,
    trackEvent,
    trackPageView,
    trackPurchase,
    trackLead
  };
}