// Tipos globais para o projeto

declare global {
  interface Window {
    performance: Performance;
    dataLayer: any[];
    utmify: {
      track: (event: string, data?: any) => void;
      init: (pixelId: string) => void;
    };
    fbq?: (command: string, ...args: unknown[]) => void;
    ttq?: any;
  }
}

export {};