// Tipos globais para o projeto
import { DataLayerEvent } from '@/hooks/useDataLayer';

// Interfaces para pixels de tracking
interface FacebookPixel {
  (...args: unknown[]): void;
  track?: (eventName: string, parameters?: Record<string, unknown>) => void;
}

interface TikTokPixel {
  (...args: unknown[]): void;
  track: (eventName: string, parameters?: Record<string, unknown>) => void;
}

declare global {
  interface Window {
    dataLayer?: (DataLayerEvent | object)[];
    gtag?: (...args: unknown[]) => void;
    fbq?: FacebookPixel;
    ttq?: TikTokPixel;
    google_tag_manager?: unknown;
  }
}

export {};