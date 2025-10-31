// 🌍 CartPanda Checkout - Checkout para mercado internacional

import { CheckoutData } from '../../types';
import { clearAllData } from '../../utils/dataStorage';
import { unformatPhone } from '../../utils/validation';

// 🔗 URLs e configurações CartPanda
const CARTPANDA_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_CARTPANDA_BASE_URL || 'https://cartpanda.com',
  productId: process.env.NEXT_PUBLIC_CARTPANDA_PRODUCT_ID || 'santa-messages',
  apiKey: process.env.NEXT_PUBLIC_CARTPANDA_API_KEY || '',
  // Configurações específicas
  currency: 'USD',
  defaultLocale: 'en-US',
  supportedCountries: ['US', 'CA', 'GB', 'AU', 'ES', 'FR', 'DE']
};

// 📊 Interface para dados CartPanda
interface CartPandaPayload {
  session_id: string;
  product_id: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    country?: string;
  };
  personalization: {
    children: Array<{
      name: string;
      age?: number;
      behavior?: string;
    }>;
    order_bumps: string[];
    photos?: string[];
    special_notes?: string;
  };
  pricing: {
    base_price: number;
    additional_costs: number;
    total: number;
    currency: string;
  };
  locale: string;
  utm_params?: Record<string, string>;
}

// 🚀 Processar checkout CartPanda
export const processCartPandaCheckout = async (checkoutData: CheckoutData): Promise<void> => {
  try {
    // 1. Preparar payload
    const payload = prepareCartPandaPayload(checkoutData);
    
    // 2. Validar dados internacionais
    validateInternationalData(payload);
    
    // 3. Enviar dados para CartPanda (se necessário)
    if (CARTPANDA_CONFIG.apiKey) {
      await sendToCartPandaAPI(payload);
    }
    
    // 4. Construir URL de checkout
    const checkoutUrl = buildCartPandaCheckoutUrl(payload);
    
    // 5. Redirecionar
    window.location.href = checkoutUrl;
    
    // 6. Limpar dados locais após redirecionamento
    setTimeout(() => {
      clearAllData();
    }, 1000);
    
  } catch (error) {
    console.error('Erro no checkout CartPanda:', error);
    throw error;
  }
};

// 📦 Preparar payload para CartPanda
const prepareCartPandaPayload = (checkoutData: CheckoutData): CartPandaPayload => {
  const { session_data, pers_data, locale } = checkoutData;
  
  // Calcular preços em USD
  const basePrice = 29.99;
  const photoPrice = 4.99;
  const photoCount = pers_data.fotos?.length || 0;
  const additionalCosts = photoCount * photoPrice;
  
  // Recuperar parâmetros UTM
  const utmParams = getUTMParams();
  
  // Detectar país baseado no locale ou UTM
  const country = detectCountryFromLocale(locale) || detectCountryFromUTM(utmParams);
  
  // Obter dados do cliente com formatação limpa
  const customerPhone = session_data.user_data.telefone || pers_data.contato?.telefone || '';

  return {
    session_id: session_data.session_id,
    product_id: CARTPANDA_CONFIG.productId,
    customer: {
      name: session_data.user_data.nome!,
      email: session_data.user_data.email!,
      phone: unformatPhone(customerPhone),
      country
    },
    personalization: {
      children: pers_data.children.map(crianca => ({
        name: crianca.nome,
        age: crianca.idade,
        behavior: crianca.comportamento
      })),
      order_bumps: pers_data.order_bumps || [],
      photos: pers_data.fotos || [],
      special_notes: pers_data.observacoes
    },
    pricing: {
      base_price: basePrice,
      additional_costs: additionalCosts,
      total: basePrice + additionalCosts,
      currency: CARTPANDA_CONFIG.currency
    },
    locale: locale || CARTPANDA_CONFIG.defaultLocale,
    utm_params: utmParams
  };
};

// ✅ Validar dados internacionais
const validateInternationalData = (payload: CartPandaPayload): void => {
  // Validar email internacional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(payload.customer.email)) {
    throw new Error('Invalid email format');
  }
  
  // Validar se o país é suportado
  if (payload.customer.country && 
      !CARTPANDA_CONFIG.supportedCountries.includes(payload.customer.country)) {
    console.warn(`Country ${payload.customer.country} may not be fully supported`);
  }
  
  // Validar telefone (formato mais flexível para internacional)
  const phoneClean = payload.customer.phone.replace(/\D/g, '');
  if (phoneClean.length < 7 || phoneClean.length > 15) {
    throw new Error('Phone number must be between 7 and 15 digits');
  }
};

// 🌐 Enviar dados para API CartPanda (opcional)
const sendToCartPandaAPI = async (payload: CartPandaPayload): Promise<void> => {
  try {
    const response = await fetch(`${CARTPANDA_CONFIG.baseUrl}/api/v1/checkout/prepare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CARTPANDA_CONFIG.apiKey}`,
        'X-Product-ID': CARTPANDA_CONFIG.productId
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`CartPanda API returned error: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Data sent to CartPanda:', result);
    
  } catch (error) {
    console.error('Error sending data to CartPanda API:', error);
    // Não bloquear o checkout se a API falhar
  }
};

// 🔗 Construir URL de checkout CartPanda
const buildCartPandaCheckoutUrl = (payload: CartPandaPayload): string => {
  const baseUrl = `${CARTPANDA_CONFIG.baseUrl}/checkout/${CARTPANDA_CONFIG.productId}`;
  
  const params = new URLSearchParams({
    // Dados básicos
    session_id: payload.session_id,
    locale: payload.locale,
    
    // Dados do cliente
    customer_name: payload.customer.name,
    customer_email: payload.customer.email,
    customer_phone: payload.customer.phone,
    ...(payload.customer.country && { customer_country: payload.customer.country }),
    
    // Personalização (JSON encoded)
    personalization: JSON.stringify(payload.personalization),
    
    // Preços
    total: payload.pricing.total.toString(),
    currency: payload.pricing.currency,
    
    // UTM params
    ...payload.utm_params
  });
  
  return `${baseUrl}?${params.toString()}`;
};

// 🌍 Detectar país baseado no locale
const detectCountryFromLocale = (locale: string): string | undefined => {
  const localeMap: Record<string, string> = {
    'en-US': 'US',
    'en-CA': 'CA',
    'en-GB': 'GB',
    'en-AU': 'AU',
    'es-ES': 'ES',
    'fr-FR': 'FR',
    'de-DE': 'DE',
    'en': 'US', // default
    'es': 'ES', // default
    'fr': 'FR', // default
    'de': 'DE'  // default
  };
  
  return localeMap[locale];
};

// 🔍 Detectar país baseado em UTM
const detectCountryFromUTM = (utmParams: Record<string, string>): string | undefined => {
  // Verificar se há informação de país nos UTM params
  return utmParams.utm_country || utmParams.country || utmParams.geo_country;
};

// 🔍 Recuperar parâmetros UTM salvos
const getUTMParams = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  
  try {
    const saved = localStorage.getItem('pers_utm_params');
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

// 💰 Calcular preços CartPanda
export const calculateCartPandaPricing = (persData: { fotos?: string[] }) => {
  const basePrice = 29.99;
  const photoPrice = 4.99;
  const photoCount = persData.fotos?.length || 0;
  
  return {
    basePrice,
    photoPrice,
    photoCount,
    additionalCosts: photoCount * photoPrice,
    total: basePrice + (photoCount * photoPrice),
    currency: 'USD',
    formatted: {
      base: `$${basePrice.toFixed(2)}`,
      additional: `$${(photoCount * photoPrice).toFixed(2)}`,
      total: `$${(basePrice + (photoCount * photoPrice)).toFixed(2)}`
    }
  };
};

// 🌍 Obter configurações baseadas no locale
export const getLocaleConfig = (locale: string) => {
  const configs: Record<string, {
    currency: string;
    symbol: string;
    country: string;
    language: string;
  }> = {
    'en': {
      currency: 'USD',
      symbol: '$',
      country: 'US',
      language: 'English'
    },
    'es': {
      currency: 'USD',
      symbol: '$',
      country: 'ES',
      language: 'Español'
    },
    'fr': {
      currency: 'EUR',
      symbol: '€',
      country: 'FR',
      language: 'Français'
    },
    'de': {
      currency: 'EUR',
      symbol: '€',
      country: 'DE',
      language: 'Deutsch'
    }
  };
  
  return configs[locale] || configs['en'];
};

// 🔍 Debug CartPanda
export const debugCartPanda = (checkoutData: CheckoutData): void => {
  console.group('🌍 Debug CartPanda');
  console.log('Config:', CARTPANDA_CONFIG);
  
  try {
    const payload = prepareCartPandaPayload(checkoutData);
    console.log('Payload:', payload);
    console.log('Checkout URL:', buildCartPandaCheckoutUrl(payload));
    console.log('Pricing:', calculateCartPandaPricing(checkoutData.pers_data));
    console.log('Locale Config:', getLocaleConfig(checkoutData.locale));
  } catch (error) {
    console.log('Error:', error instanceof Error ? error.message : 'Unknown error');
  }
  
  console.groupEnd();
};

// 📱 Verificar se é mobile para ajustar experiência
export const isMobileCartPanda = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 768;
};

// 🎯 Configurações específicas para mobile
export const getMobileCartPandaConfig = () => {
  return {
    ...CARTPANDA_CONFIG,
    // Configurações específicas para mobile
    mobileOptimized: true,
    redirectDelay: isMobileCartPanda() ? 500 : 1000
  };
};

// 🌐 Suporte a múltiplas moedas (futuro)
export const getSupportedCurrencies = () => {
  return {
    USD: { symbol: '$', name: 'US Dollar' },
    EUR: { symbol: '€', name: 'Euro' },
    GBP: { symbol: '£', name: 'British Pound' },
    CAD: { symbol: 'C$', name: 'Canadian Dollar' },
    AUD: { symbol: 'A$', name: 'Australian Dollar' }
  };
};