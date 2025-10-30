/**
 * Configuração dos provedores de checkout
 * Centraliza as URLs e configurações sensíveis usando variáveis de ambiente
 */

export interface CheckoutProvider {
  name: string;
  region: string;
  locale?: string;
  locales?: string[];
  currency: string;
  baseUrl: string;
  description: string;
}

export interface CheckoutConfig {
  lastlink: CheckoutProvider;
  cartpanda: CheckoutProvider;
}

/**
 * Configuração dos provedores de checkout usando variáveis de ambiente
 */
export const CHECKOUT_CONFIG: CheckoutConfig = {
  lastlink: {
    name: "LastLink",
    region: "Brasil", 
    locale: "pt",
    currency: "BRL",
    baseUrl: process.env.NEXT_PUBLIC_LASTLINK_BASE_URL || 'https://lastlink.com',
    description: "Checkout exclusivo para o mercado brasileiro com URLs específicas do LastLink"
  },
  cartpanda: {
    name: "CartPanda",
    region: "Internacional",
    locales: ["en", "es"],
    currency: "USD", 
    baseUrl: process.env.NEXT_PUBLIC_CARTPANDA_BASE_URL || 'https://cartpanda.com',
    description: "Checkout internacional usando a lógica interna do CartPanda"
  }
};

/**
 * Obtém a configuração do provedor baseado no locale
 */
export function getCheckoutProvider(locale: string): CheckoutProvider {
  if (locale === 'pt') {
    return CHECKOUT_CONFIG.lastlink;
  }
  return CHECKOUT_CONFIG.cartpanda;
}

/**
 * Constrói URL completa de checkout
 */
export function buildCheckoutUrl(provider: CheckoutProvider, path: string = ''): string {
  const baseUrl = provider.baseUrl.endsWith('/') 
    ? provider.baseUrl.slice(0, -1) 
    : provider.baseUrl;
  
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${baseUrl}${cleanPath}`;
}