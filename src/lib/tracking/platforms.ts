// Interface para configuração das plataformas
export interface PlatformConfig {
  enabled: boolean;
  pixelId: string;
  apiVersion?: string;
  testEventCode?: string;
  accessToken?: string;
  conversionId?: string;
  conversionLabel?: string;
}

// Interface para parâmetros de eventos
export interface EventParameters {
  value?: number;
  currency?: string;
  content_type?: string;
  content_ids?: string[];
  content_name?: string;
  content_category?: string;
  num_items?: number;
  search_string?: string;
  custom_data?: Record<string, unknown>;
  [key: string]: unknown;
}

// Interface para parâmetros do Facebook
export interface FacebookEventParameters {
  value?: number;
  currency?: string;
  content_type?: string;
  content_ids?: string[];
  content_name?: string;
  content_category?: string;
  num_items?: number;
  search_string?: string;
  custom_data?: Record<string, unknown>;
}

// Interface para parâmetros do TikTok
export interface TikTokEventParameters {
  value?: number;
  currency?: string;
  content_type?: string;
  content_id?: string;
  content_name?: string;
  content_category?: string;
  quantity?: number;
  description?: string;
}

// Interface para parâmetros do Google Ads
export interface GoogleAdsEventParameters {
  send_to?: string;
  value?: number;
  currency?: string;
  transaction_id?: string;
  custom_parameters?: Record<string, unknown>;
}

// Configurações dos Pixels das Plataformas
export const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  meta: {
    enabled: true,
    pixelId: process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || '',
    apiVersion: 'v18.0',
    testEventCode: process.env.FACEBOOK_TEST_EVENT_CODE,
    accessToken: process.env.META_CONVERSION_API_TOKEN,
  },
  tiktok: {
    enabled: true,
    pixelId: process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || '',
    apiVersion: 'v1.3',
    accessToken: process.env.TIKTOK_EVENTS_API_TOKEN,
  },
  googleAds: {
    enabled: true,
    pixelId: process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || '',
    conversionId: process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID || '',
    conversionLabel: process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL || '',
  },
};

// Meta Ads (Facebook) Pixel Configuration
export class MetaPixelManager {
  private pixelId: string;
  private testEventCode?: string;
  private isInitialized = false;

  constructor(config: PlatformConfig) {
    this.pixelId = config.pixelId;
    this.testEventCode = config.testEventCode;
  }

  async initialize(): Promise<void> {
    console.log('🔍 Meta Pixel - Tentando inicializar...', {
      pixelId: this.pixelId,
      testEventCode: this.testEventCode,
      isInitialized: this.isInitialized
    });

    if (this.isInitialized || !this.pixelId) {
      console.log('❌ Meta Pixel - Inicialização cancelada:', {
        isInitialized: this.isInitialized,
        pixelId: this.pixelId
      });
      return;
    }

    try {
      console.log('📦 Meta Pixel - Carregando script...');
      
      // Carregar Facebook Pixel
      (function(f: Window & typeof globalThis, b: Document, e: string, v: string, n?: FacebookPixel, t?: HTMLScriptElement, s?: Element) {
        const windowWithFbq = f as Window & { fbq?: (command: string, ...args: unknown[]) => void; _fbq?: FacebookPixel };
        if (windowWithFbq._fbq?.loaded) return;
        n = function(...args: unknown[]) {
          if (n!.callMethod) {
            n!.callMethod.apply(n, args);
          } else {
            n!.queue.push(args);
          }
        } as unknown as FacebookPixel;
        windowWithFbq.fbq = n as unknown as (command: string, ...args: unknown[]) => void;
        if (!windowWithFbq._fbq) windowWithFbq._fbq = n;
        n.push = n;
        n.loaded = true;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e) as HTMLScriptElement;
        t.async = true;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode!.insertBefore(t, s);
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

      console.log('🔧 Meta Pixel - Inicializando pixel com ID:', this.pixelId);

      // Inicializar pixel
      (window as WindowWithFbq).fbq('init', this.pixelId, {
        em: 'insert_email_variable',
        ph: 'insert_phone_variable',
      });

      // Configurar test event code se disponível
      if (this.testEventCode) {
        console.log('🧪 Meta Pixel - Configurando test event code:', this.testEventCode);
        (window as WindowWithFbq).fbq('init', this.pixelId, {}, {
          testEventCode: this.testEventCode,
        });
      }

      // Desativar autoConfig para evitar PageView automáticos em SPA
      try {
        (window as WindowWithFbq).fbq('set', 'autoConfig', false, this.pixelId);
        console.log('⚙️ Meta Pixel - autoConfig desativado para evitar PageView automático em SPA');
      } catch (e) {
        console.warn('⚠️ Meta Pixel - Falha ao desativar autoConfig:', e);
      }

      // Proteger contra qualquer PageView em páginas de personalização via wrapper
      try {
        const originalFbq = (window as WindowWithFbq).fbq;
        (window as WindowWithFbq).fbq = ((command: string, ...args: unknown[]) => {
          try {
            const eventName = (args && args[0]) as string | undefined;
            const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
            if (command === 'track' && eventName === 'PageView' && pathname.includes('/pers/')) {
              console.log('⏹️ Meta Pixel - PageView bloqueado em página de personalização:', pathname);
              return;
            }
          } catch (_) {}
          return (originalFbq as unknown as (command: string, ...args: unknown[]) => void)(command, ...(args as unknown[]));
        }) as unknown as (command: string, ...args: unknown[]) => void;
        console.log('🛡️ Meta Pixel - Wrapper instalado para bloquear PageView em /pers/*');
      } catch (e) {
        console.warn('⚠️ Meta Pixel - Falha ao instalar wrapper de proteção:', e);
      }

      // Disparar PageView apenas fora de páginas de personalização
      const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
      const isPersPage = pathname.includes('/pers/');
      if (!isPersPage) {
        console.log('📄 Meta Pixel - Disparando PageView...');
        (window as WindowWithFbq).fbq('track', 'PageView');
      } else {
        console.log('⏭️ Meta Pixel - PageView suprimido em página de personalização:', pathname);
      }

      this.isInitialized = true;
      console.log('✅ Meta Pixel inicializado com sucesso:', this.pixelId);
    } catch (error) {
      console.error('❌ Erro ao inicializar Meta Pixel:', error);
    }
  }

  trackEvent(eventName: string, parameters: EventParameters = {}): void {
    if (!this.isInitialized || typeof window === 'undefined') return;

    try {
      const fbq = (window as WindowWithFbq).fbq;
      if (fbq) {
        // Mapear eventos para nomenclatura do Facebook
        const fbEventName = this.mapEventName(eventName);
        const fbParameters = this.formatParameters(parameters);

        // Se não houver mapeamento padrão (ou for 'CustomEvent'), enviar como customizado com o nome real
        if (!fbEventName || fbEventName === 'CustomEvent') {
          fbq('trackCustom', eventName, fbParameters);
        } else {
          fbq('track', fbEventName, fbParameters);
        }

        console.log('Meta Pixel - Evento enviado:', {
          event: (!fbEventName || fbEventName === 'CustomEvent') ? `trackCustom:${eventName}` : fbEventName,
          parameters: fbParameters,
        });
      }
    } catch (error) {
      console.error('Erro ao enviar evento para Meta Pixel:', error);
    }
  }

  private mapEventName(eventName: string): string {
    const eventMap: Record<string, string> = {
      'landing_page_view': 'PageView',
      'landing_cta_click': 'Lead',
      'step_1_page_view': 'InitiateCheckout',
      'step_2_add_to_cart': 'AddToCart',
      'step_3_begin_checkout': 'InitiateCheckout',
      'purchase_completed': 'Purchase',
      // Personalização: page views específicos dos steps não devem virar PageView
      'perspgview1': 'CustomEvent',
      'perspgview2': 'CustomEvent',
      'perspgview3': 'CustomEvent',
    };

    return eventMap[eventName] || 'CustomEvent';
  }

  private formatParameters(params: EventParameters): FacebookEventParameters {
    const formatted: FacebookEventParameters = {};

    // Mapear parâmetros para formato do Facebook
    if (params.value) formatted.value = params.value;
    if (params.currency) formatted.currency = params.currency;
    if (params.content_type) formatted.content_type = params.content_type;
    if (params.content_ids) formatted.content_ids = params.content_ids;
    if (params.content_name) formatted.content_name = params.content_name;
    if (params.content_category) formatted.content_category = params.content_category;
    if (params.num_items) formatted.num_items = params.num_items;

    return formatted;
  }
}

// TikTok Pixel Configuration
export class TikTokPixelManager {
  private pixelId: string;
  private isInitialized = false;

  constructor(config: PlatformConfig) {
    this.pixelId = config.pixelId;
  }

  async initialize(): Promise<void> {
    console.log('🔍 TikTok Pixel - Tentando inicializar...', {
      pixelId: this.pixelId,
      isInitialized: this.isInitialized
    });

    if (this.isInitialized || !this.pixelId) {
      console.log('❌ TikTok Pixel - Inicialização cancelada:', {
        isInitialized: this.isInitialized,
        pixelId: this.pixelId
      });
      return;
    }

    try {
      console.log('📦 TikTok Pixel - Carregando script...');
      
      // Carregar TikTok Pixel
      (function(this: TikTokPixelManager, w: Window & typeof globalThis, d: Document, t: string) {
        const windowWithTikTok = w as unknown as Window & { TiktokAnalyticsObject?: string; [key: string]: unknown };
        windowWithTikTok.TiktokAnalyticsObject = t;
        const ttq = (windowWithTikTok[t] = windowWithTikTok[t] || []) as unknown as TikTokPixel;
        ttq.methods = ["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
        ttq.setAndDefer = function(t: TikTokPixel, e: string) {
          (t as unknown as Record<string, unknown>)[e] = function(...args: unknown[]) {
            t.push([e].concat(Array.prototype.slice.call(args, 0)));
          };
        };
        for (let i = 0; i < ttq.methods.length; i++) {
          ttq.setAndDefer(ttq, ttq.methods[i]);
        }
        ttq.instance = function(t: string) {
          const e = ((ttq._i && ttq._i[t]) || []) as unknown as TikTokPixel;
          for (let n = 0; n < ttq.methods.length; n++) {
            ttq.setAndDefer(e, ttq.methods[n]);
          }
          return e;
        };
        ttq.load = function(e: string, n?: Record<string, unknown>) {
          const i = "https://analytics.tiktok.com/i18n/pixel/events.js";
          ttq._i = ttq._i || {};
          ttq._i[e] = [] as unknown as TikTokPixel;
          (ttq._i[e] as unknown as Record<string, unknown>)._u = i;
          ttq._t = ttq._t || {};
          ttq._t[e] = +new Date();
          ttq._o = ttq._o || {};
          ttq._o[e] = n || {};
          const o = document.createElement("script");
          o.type = "text/javascript";
          o.async = true;
          o.src = i + "?sdkid=" + e + "&lib=" + t;
          const a = document.getElementsByTagName("script")[0];
          a.parentNode!.insertBefore(o, a);
        };
        
        console.log('🔧 TikTok Pixel - Carregando com ID:', this.pixelId);
        ttq.load(this.pixelId);
        
        // Proteção robusta contra Pageview em páginas de personalização
        const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
        const isPersPage = pathname.includes('/pers/');

        // 1) Proteger o stub antes do carregamento: interceptar page() e track('PageView')
        try {
          const originalPush = (ttq as unknown as { push: (args: unknown[]) => void }).push;
          // Intercepta track/page durante a fase de queue para bloquear Pageview em /pers/*
          (ttq as unknown as { push: (args: unknown[]) => void }).push = function(args: unknown[]) {
            try {
              const cmd = (Array.isArray(args) ? args[0] : undefined) as string | undefined;
              const eventName = (Array.isArray(args) && typeof args[1] === 'string') ? (args[1] as string) : undefined;
              if (isPersPage && (cmd === 'page' || (cmd === 'track' && eventName && ['PageView','Pageview','page_view','pageview'].includes(eventName)))) {
                console.log('⛔ TikTok Pixel - Bloqueado no queue:', { cmd, eventName, pathname });
                return; // não enfileirar
              }
            } catch (_) {}
            return originalPush.call(ttq as unknown as { push: (args: unknown[]) => void }, args);
          } as unknown as (args: unknown[]) => void;

          // Também substituir os stubs diretos de page/track para bloquear antes do load
          const originalStubPage = ttq.page;
          ttq.page = function() {
            try {
              if (isPersPage) {
                console.log('⛔ TikTok Pixel - page() bloqueado em /pers/*:', pathname);
                return;
              }
            } catch (_) {}
            return (originalStubPage as () => void).apply(ttq);
          } as unknown as () => void;

          const originalStubTrack = ttq.track;
          ttq.track = function(eventName: string, parameters?: TikTokEventParameters) {
            try {
              if (isPersPage && eventName && ['PageView','Pageview','page_view','pageview'].includes(eventName)) {
                console.log('⛔ TikTok Pixel - track(Pageview) bloqueado em /pers/*:', { eventName, pathname });
                return;
              }
            } catch (_) {}
            return (originalStubTrack as (eventName: string, parameters?: TikTokEventParameters) => void).apply(ttq, [eventName, parameters]);
          } as unknown as (eventName: string, parameters?: TikTokEventParameters) => void;
        } catch (e) {
          console.warn('⚠️ TikTok Pixel - Falha ao instalar proteção de stub:', e);
        }

        // 2) Após carregar, reforçar proteção sobre métodos reais usando ready()
        try {
          ttq.ready?.(function() {
            try {
              const realTrack = ttq.track;
              ttq.track = function(eventName: string, parameters?: TikTokEventParameters) {
                try {
                  if (isPersPage && eventName && ['PageView','Pageview','page_view','pageview'].includes(eventName)) {
                    console.log('⏹️ TikTok Pixel - track(Pageview) bloqueado (ready) em /pers/*:', { eventName, pathname });
                    return;
                  }
                } catch (_) {}
                return (realTrack as (eventName: string, parameters?: TikTokEventParameters) => void).apply(ttq, [eventName, parameters]);
              } as unknown as (eventName: string, parameters?: TikTokEventParameters) => void;

              const realPage = ttq.page;
              ttq.page = function() {
                try {
                  if (isPersPage) {
                    console.log('⏹️ TikTok Pixel - page() bloqueado (ready) em /pers/*:', pathname);
                    return;
                  }
                } catch (_) {}
                return (realPage as () => void).apply(ttq);
              } as unknown as () => void;

              console.log('🛡️ TikTok Pixel - Wrapper instalado para bloquear Pageview em /pers/*');
            } catch (e) {
              console.warn('⚠️ TikTok Pixel - Falha ao instalar wrapper (ready):', e);
            }
          });
        } catch (e) {
          console.warn('⚠️ TikTok Pixel - Falha ao registrar ready():', e);
        }

        // 3) Disparar page view apenas fora de páginas de personalização
        if (!isPersPage) {
          console.log('📄 TikTok Pixel - Disparando page view...');
          ttq.page();
        } else {
          console.log('⏭️ TikTok Pixel - Page view suprimido em página de personalização:', pathname);
        }
      }.bind(this))(window, document, 'ttq');

      this.isInitialized = true;
      console.log('✅ TikTok Pixel inicializado com sucesso:', this.pixelId);
    } catch (error) {
      console.error('❌ Erro ao inicializar TikTok Pixel:', error);
    }
  }

  trackEvent(eventName: string, parameters: EventParameters = {}): void {
    if (!this.isInitialized || typeof window === 'undefined') return;

    try {
      const ttq = (window as unknown as WindowWithTtq).ttq;
      if (ttq) {
        const ttEventName = this.mapEventName(eventName);
        const ttParameters = this.formatParameters(parameters);

        ttq.track(ttEventName, ttParameters);

        console.log('TikTok Pixel - Evento enviado:', {
          event: ttEventName,
          parameters: ttParameters,
        });
      }
    } catch (error) {
      console.error('Erro ao enviar evento para TikTok Pixel:', error);
    }
  }

  private mapEventName(eventName: string): string {
    const eventMap: Record<string, string> = {
      'landing_page_view': 'ViewContent',
      'landing_cta_click': 'ClickButton',
      'step_1_page_view': 'InitiateCheckout',
      'step_2_add_to_cart': 'AddToCart',
      'step_3_begin_checkout': 'InitiateCheckout',
      'purchase_completed': 'CompletePayment',
      // Personalização: page views específicos dos steps não devem virar PageView
      'perspgview1': 'CustomEvent',
      'perspgview2': 'CustomEvent',
      'perspgview3': 'CustomEvent',
    };

    return eventMap[eventName] || 'CustomEvent';
  }

  private formatParameters(params: EventParameters): TikTokEventParameters {
    const formatted: TikTokEventParameters = {};

    if (params.value) formatted.value = params.value;
    if (params.currency) formatted.currency = params.currency;
    if (params.content_type) formatted.content_type = params.content_type;
    if (params.content_ids?.[0]) formatted.content_id = params.content_ids[0];
    if (params.content_name) formatted.content_name = params.content_name;
    if (params.content_category) formatted.content_category = params.content_category;
    if (params.num_items) formatted.quantity = params.num_items;

    return formatted;
  }
}

// Google Ads Configuration
export class GoogleAdsManager {
  private conversionId: string;
  private conversionLabel: string;
  private isInitialized = false;

  constructor(config: PlatformConfig) {
    this.conversionId = config.conversionId || '';
    this.conversionLabel = config.conversionLabel || '';
  }

  async initialize(): Promise<void> {
    if (this.isInitialized || !this.conversionId) return;

    try {
      // Carregar Google Ads (gtag)
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.conversionId}`;
      document.head.appendChild(script);

      // Configurar gtag
      function gtag(...args: GtagArguments) {
        (window as unknown as WindowWithGtag).dataLayer = (window as unknown as WindowWithGtag).dataLayer || [];
        (window as unknown as WindowWithGtag).dataLayer.push(args);
      }
      (window as unknown as WindowWithGtag).gtag = gtag as (...args: unknown[]) => void;

      gtag('js', new Date());
      gtag('config', this.conversionId);

      this.isInitialized = true;
      console.log('Google Ads inicializado:', this.conversionId);
    } catch (error) {
      console.error('Erro ao inicializar Google Ads:', error);
    }
  }

  trackConversion(eventName: string, parameters: EventParameters = {}): void {
    if (!this.isInitialized || typeof window === 'undefined') return;

    try {
      const gtag = (window as unknown as WindowWithGtag).gtag;
      if (gtag && this.conversionLabel) {
        const gtagParameters = this.formatParameters(parameters);
        gtagParameters.send_to = `${this.conversionId}/${this.conversionLabel}`;

        gtag('event', 'conversion', gtagParameters);

        console.log('Google Ads - Conversão enviada:', {
          event: eventName,
          parameters: gtagParameters,
        });
      }
    } catch (error) {
      console.error('Erro ao enviar conversão para Google Ads:', error);
    }
  }

  trackEvent(eventName: string, parameters: EventParameters = {}): void {
    if (!this.isInitialized || typeof window === 'undefined') return;

    try {
      const gtag = (window as unknown as WindowWithGtag).gtag;
      if (gtag) {
        const gtagEventName = this.mapEventName(eventName);
        const gtagParameters = this.formatParameters(parameters);

        gtag('event', gtagEventName, gtagParameters);

        console.log('Google Ads - Evento enviado:', {
          event: gtagEventName,
          parameters: gtagParameters,
        });
      }
    } catch (error) {
      console.error('Erro ao enviar evento para Google Ads:', error);
    }
  }

  private mapEventName(eventName: string): string {
    const eventMap: Record<string, string> = {
      'landing_page_view': 'page_view',
      'landing_cta_click': 'generate_lead',
      'step_1_page_view': 'begin_checkout',
      'step_2_add_to_cart': 'add_to_cart',
      'step_3_begin_checkout': 'begin_checkout',
      'purchase_completed': 'purchase',
      // Personalização: page views específicos dos steps não devem virar page_view
      'perspgview1': 'custom_event',
      'perspgview2': 'custom_event',
      'perspgview3': 'custom_event',
    };

    return eventMap[eventName] || 'custom_event';
  }

  private formatParameters(params: EventParameters): GoogleAdsEventParameters {
    const formatted: GoogleAdsEventParameters = {};

    if (params.value) formatted.value = params.value;
    if (params.currency) formatted.currency = params.currency;
    if (params.custom_data) formatted.custom_parameters = params.custom_data;

    return formatted;
  }
}

// Platform Manager - Gerencia todas as plataformas
export class PlatformManager {
  private metaPixel?: MetaPixelManager;
  private tiktokPixel?: TikTokPixelManager;
  private googleAds?: GoogleAdsManager;

  constructor() {
    console.log('🚀 PlatformManager - Inicializando gerenciador de plataformas...');
    
    // Inicializar plataformas habilitadas
    if (PLATFORM_CONFIGS.meta.enabled) {
      console.log('📱 PlatformManager - Configurando Meta Pixel:', PLATFORM_CONFIGS.meta.pixelId);
      this.metaPixel = new MetaPixelManager(PLATFORM_CONFIGS.meta);
    }
    if (PLATFORM_CONFIGS.tiktok.enabled) {
      console.log('📱 PlatformManager - Configurando TikTok Pixel:', PLATFORM_CONFIGS.tiktok.pixelId);
      this.tiktokPixel = new TikTokPixelManager(PLATFORM_CONFIGS.tiktok);
    }
    if (PLATFORM_CONFIGS.googleAds.enabled) {
      console.log('📱 PlatformManager - Configurando Google Ads:', PLATFORM_CONFIGS.googleAds.pixelId);
      this.googleAds = new GoogleAdsManager(PLATFORM_CONFIGS.googleAds);
    }
    
    console.log('✅ PlatformManager - Gerenciador configurado com sucesso');
  }

  async initializeAll(): Promise<void> {
    console.log('🔄 PlatformManager - Iniciando inicialização de todas as plataformas...');
    
    const promises = [];
    if (this.metaPixel) promises.push(this.metaPixel.initialize());
    if (this.tiktokPixel) promises.push(this.tiktokPixel.initialize());
    if (this.googleAds) promises.push(this.googleAds.initialize());

    await Promise.all(promises);
    
    console.log('🎉 PlatformManager - Todas as plataformas foram inicializadas');
  }

  trackEventToAll(eventName: string, parameters: EventParameters = {}): void {
    try {
      if (this.metaPixel) {
        this.metaPixel.trackEvent(eventName, parameters);
      }
      if (this.tiktokPixel) {
        this.tiktokPixel.trackEvent(eventName, parameters);
      }
      if (this.googleAds) {
        this.googleAds.trackEvent(eventName, parameters);
      }
    } catch (error) {
      console.error('Erro ao enviar evento para todas as plataformas:', error);
    }
  }

  trackConversion(parameters: EventParameters = {}): void {
    try {
      // Conversões específicas para cada plataforma
      if (this.metaPixel) {
        this.metaPixel.trackEvent('purchase_completed', parameters);
      }
      if (this.tiktokPixel) {
        this.tiktokPixel.trackEvent('purchase_completed', parameters);
      }
      if (this.googleAds) {
        this.googleAds.trackConversion('purchase_completed', parameters);
      }
    } catch (error) {
      console.error('Erro ao enviar conversão:', error);
    }
  }
}

// Tipos para as extensões do Window
interface FacebookPixel {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  push: FacebookPixel;
  loaded: boolean;
  version: string;
}

interface WindowWithFbq extends Window {
  fbq: (command: string, ...args: unknown[]) => void;
  _fbq?: FacebookPixel;
}

interface TikTokPixel extends Array<unknown> {
  methods: string[];
  setAndDefer: (t: TikTokPixel, e: string) => void;
  instance: (t: string) => TikTokPixel;
  load: (e: string, n?: Record<string, unknown>) => void;
  _i?: Record<string, TikTokPixel>;
  _t?: Record<string, number>;
  _o?: Record<string, Record<string, unknown>>;
  track: (eventName: string, parameters?: TikTokEventParameters) => void;
  page: () => void;
  // Some integrations expose a ready() callback once the SDK is loaded
  ready?: (cb: () => void) => void;
}

interface WindowWithTtq extends Window {
  TiktokAnalyticsObject: string;
  ttq: TikTokPixel;
}

type GtagArguments = [string, Date | string, Record<string, unknown>?] | [string, string, GoogleAdsEventParameters?];

interface WindowWithGtag extends Window {
  gtag: (...args: unknown[]) => void;
  dataLayer: unknown[];
}

// Instância global do gerenciador de plataformas
export const platformManager = new PlatformManager();