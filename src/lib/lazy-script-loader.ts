'use client';

/**
 * Sistema de lazy loading para scripts de terceiros
 * Carrega scripts apenas quando necessário para melhorar performance
 */

interface ScriptConfig {
  src: string;
  id: string;
  async?: boolean;
  defer?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

class LazyScriptLoader {
  private loadedScripts: Set<string> = new Set();
  private loadingScripts: Map<string, Promise<void>> = new Map();
  private intersectionObserver?: IntersectionObserver;

  constructor() {
    this.setupIntersectionObserver();
  }

  /**
   * Configura observer para carregamento baseado em visibilidade
   */
  private setupIntersectionObserver() {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const scriptId = entry.target.getAttribute('data-script-id');
            if (scriptId) {
              this.loadScript(scriptId);
              this.intersectionObserver?.unobserve(entry.target);
            }
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );
  }

  /**
   * Carrega script de forma assíncrona
   */
  async loadScript(scriptId: string, config?: ScriptConfig): Promise<void> {
    // Se já foi carregado, retorna
    if (this.loadedScripts.has(scriptId)) {
      return Promise.resolve();
    }

    // Se está carregando, retorna a promise existente
    if (this.loadingScripts.has(scriptId)) {
      return this.loadingScripts.get(scriptId)!;
    }

    // Configurações padrão para scripts conhecidos
    const defaultConfigs: Record<string, ScriptConfig> = {
      'facebook-pixel': {
        src: 'https://connect.facebook.net/en_US/fbevents.js',
        id: 'facebook-pixel',
        async: true,
        defer: true,
        onLoad: () => {
          // Inicializar Facebook Pixel após carregamento
          if (typeof window !== 'undefined' && !window.fbq) {
            window.fbq = function() {
              if (window.fbq.callMethod) {
                window.fbq.callMethod.apply(window.fbq, Array.from(arguments));
              } else {
                if (!window.fbq.queue) {
                  window.fbq.queue = [];
                }
                window.fbq.queue.push(Array.from(arguments));
              }
            };
            window.fbq.push = window.fbq;
            window.fbq.loaded = true;
            window.fbq.version = '2.0';
            window.fbq.queue = [];
          }
        }
      },
      'tiktok-pixel': {
        src: 'https://analytics.tiktok.com/i18n/pixel/events.js',
        id: 'tiktok-pixel',
        async: true,
        defer: true,
        onLoad: () => {
          // Inicializar TikTok Pixel após carregamento
          if (typeof window !== 'undefined' && window.ttq && process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID) {
            window.ttq.load(process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID);
            window.ttq.page();
          }
        }
      },
      'google-analytics': {
        src: `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA4_ID}`,
        id: 'google-analytics',
        async: true,
        defer: true
      }
    };

    const scriptConfig = config || defaultConfigs[scriptId];
    if (!scriptConfig) {
      return Promise.reject(new Error(`Script config not found for: ${scriptId}`));
    }

    const loadPromise = new Promise<void>((resolve, reject) => {
      // Verificar se script já existe no DOM
      const existingScript = document.getElementById(scriptConfig.id);
      if (existingScript) {
        this.loadedScripts.add(scriptId);
        resolve();
        return;
      }

      // Criar elemento script
      const script = document.createElement('script');
      script.id = scriptConfig.id;
      script.src = scriptConfig.src;
      script.async = scriptConfig.async ?? true;
      script.defer = scriptConfig.defer ?? true;

      // Handlers de evento
      script.onload = () => {
        this.loadedScripts.add(scriptId);
        this.loadingScripts.delete(scriptId);
        scriptConfig.onLoad?.();
        resolve();
      };

      script.onerror = () => {
        this.loadingScripts.delete(scriptId);
        scriptConfig.onError?.();
        reject(new Error(`Failed to load script: ${scriptId}`));
      };

      // Adicionar ao DOM
      document.head.appendChild(script);
    });

    this.loadingScripts.set(scriptId, loadPromise);
    return loadPromise;
  }

  /**
   * Carrega script quando elemento entra na viewport
   */
  loadOnVisible(element: Element, scriptId: string, config?: ScriptConfig) {
    if (!this.intersectionObserver) {
      // Fallback: carregar imediatamente se não há suporte
      this.loadScript(scriptId, config);
      return;
    }

    element.setAttribute('data-script-id', scriptId);
    this.intersectionObserver.observe(element);
  }

  /**
   * Carrega script após interação do usuário
   */
  loadOnInteraction(scriptId: string, config?: ScriptConfig) {
    const events = ['click', 'scroll', 'keydown', 'touchstart'] as const;
    
    const loadOnce = () => {
      this.loadScript(scriptId, config);
      events.forEach(event => {
        document.removeEventListener(event, loadOnce);
      });
    };

    events.forEach(event => {
      document.addEventListener(event, loadOnce, { passive: true });
    });
  }

  /**
   * Carrega script após delay
   */
  loadWithDelay(scriptId: string, delay: number = 3000, config?: ScriptConfig) {
    setTimeout(() => {
      this.loadScript(scriptId, config);
    }, delay);
  }

  /**
   * Verifica se script foi carregado
   */
  isLoaded(scriptId: string): boolean {
    return this.loadedScripts.has(scriptId);
  }

  /**
   * Remove script do DOM
   */
  unloadScript(scriptId: string) {
    const script = document.getElementById(scriptId);
    if (script) {
      script.remove();
      this.loadedScripts.delete(scriptId);
    }
  }
}

// Instância singleton
export const lazyScriptLoader = new LazyScriptLoader();

/**
 * Hook para usar o lazy script loader
 */
export function useLazyScriptLoader() {
  return {
    loadScript: (scriptId: string, config?: ScriptConfig) => 
      lazyScriptLoader.loadScript(scriptId, config),
    loadOnVisible: (element: Element, scriptId: string, config?: ScriptConfig) =>
      lazyScriptLoader.loadOnVisible(element, scriptId, config),
    loadOnInteraction: (scriptId: string, config?: ScriptConfig) =>
      lazyScriptLoader.loadOnInteraction(scriptId, config),
    loadWithDelay: (scriptId: string, delay?: number, config?: ScriptConfig) =>
      lazyScriptLoader.loadWithDelay(scriptId, delay, config),
    isLoaded: (scriptId: string) => lazyScriptLoader.isLoaded(scriptId),
    unloadScript: (scriptId: string) => lazyScriptLoader.unloadScript(scriptId)
  };
}