// Tipos globais para o projeto

declare global {
  interface Window {
    performance: Performance;
    dataLayer: unknown[];
    utmify: {
      track: (event: string, data?: Record<string, unknown>) => void;
      init: (pixelId: string) => void;
    };
    fbq?: (command: string, ...args: unknown[]) => void;
    ttq?: {
      track: (eventName: string, parameters?: Record<string, unknown>) => void;
      page: () => void;
    };
    __pixelScriptsMounted?: boolean;
  }
}

export {};
