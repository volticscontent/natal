// Tipos globais para o projeto
import { DataLayerEvent } from '@/hooks/useDataLayer';

// Interfaces para pixels de tracking
interface FacebookPixel {
  (...args: unknown[]): void;
  track?: (eventName: string, parameters?: Record<string, unknown>) => void;
  callMethod?: {
    apply: (context: any, args: any[]) => void;
  };
  push?: FacebookPixel;
  loaded?: boolean;
  version?: string;
  queue?: any[];
}

interface TikTokPixel {
  (...args: unknown[]): void;
  track: (eventName: string, parameters?: Record<string, unknown>) => void;
  page: () => void;
  load: (pixelId: string, options?: Record<string, unknown>) => void;
  identify: (parameters?: Record<string, unknown>) => void;
  instances: any;
  debug: (enabled?: boolean) => void;
  on: (event: string, callback: Function) => void;
  off: (event: string, callback: Function) => void;
  once: (event: string, callback: Function) => void;
  ready: (callback: Function) => void;
  alias: (userId: string) => void;
  group: (groupId: string) => void;
  enableCookie: () => void;
  disableCookie: () => void;
  methods?: string[];
  setAndDefer?: (target: any, method: any) => void;
  instance?: (pixelId: string) => any;
  _i?: Record<string, any>;
  _t?: Record<string, number>;
  _o?: Record<string, any>;
}

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
    fbq: FacebookPixel;
    ttq: TikTokPixel;
    performance: Performance;
    google_tag_manager?: unknown;
  }
}

export {};