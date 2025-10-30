// 🇧🇷 LastLink Checkout - Checkout para o mercado brasileiro

import { CheckoutData } from '../../types';
import { clearAllData, getCurrentPricing } from '../../utils/dataStorage';
import { calculateUserSelectionPricing } from '../../../../../lib/pricing-calculator';

// 🔗 URLs e configurações LastLink
const LASTLINK_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_LASTLINK_BASE_URL || 'https://lastlink.com.br',
  productId: process.env.NEXT_PUBLIC_LASTLINK_PRODUCT_ID || 'recadinhos-papai-noel',
  apiKey: process.env.NEXT_PUBLIC_LASTLINK_API_KEY || '',
  // Configurações específicas
  currency: 'BRL',
  locale: 'pt-BR',
  country: 'BR'
};

// 📊 Interface para dados LastLink
interface LastLinkPayload {
  session_id: string;
  product_id: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  personalization: {
    children: Array<{
      nome: string;
      idade: number;
      comportamento: string;
    }>;
    order_bumps: string[];
    photos?: string[];
    special_requests?: string;
  };
  pricing: {
    base_price: number;
    additional_costs: number;
    total: number;
    currency: string;
    breakdown?: Array<{
      id: string;
      title: string;
      price: number;
      originalPrice?: number;
      isCombo?: boolean;
      quantity?: number;
    }>;
  };
  utm_params?: Record<string, string>;
}

// 🚀 Processar checkout LastLink
export const processLastLinkCheckout = async (checkoutData: CheckoutData): Promise<void> => {
  try {
    // 1. Preparar payload
    const payload = prepareLastLinkPayload(checkoutData);
    
    // 2. Validar dados específicos do Brasil
    validateBrazilianData(payload);
    
    // 3. Construir URL de checkout
    const checkoutUrl = buildLastLinkCheckoutUrl(payload);
    
    // 4. Redirecionar
    window.location.href = checkoutUrl;
    
    // 5. Limpar dados locais após redirecionamento
    setTimeout(() => {
      clearAllData();
    }, 1000);
    
  } catch (error) {
    console.error('Erro no checkout LastLink:', error);
    throw error;
  }
};

// 📦 Preparar payload para LastLink
const prepareLastLinkPayload = (checkoutData: CheckoutData): LastLinkPayload => {
  const { session_data, pers_data } = checkoutData;
  
  // Obter preços calculados ou recalcular se necessário
  let pricingData = getCurrentPricing('pt');
  
  if (!pricingData) {
    // Recalcular preços baseado nos dados de personalização
    pricingData = calculateUserSelectionPricing(
      pers_data.children?.length || 1,
      pers_data.order_bumps || [],
      pers_data.fotos?.length || 0,
      'pt'
    );
  }
  
  // Recuperar parâmetros UTM
  const utmParams = getUTMParams();
  
  return {
    session_id: session_data.session_id,
    product_id: LASTLINK_CONFIG.productId,
    customer: {
      name: session_data.user_data.nome!,
      email: session_data.user_data.email!,
      phone: session_data.user_data.telefone!
    },
    personalization: {
      children: pers_data.children.map(crianca => ({
        nome: crianca.nome,
        idade: crianca.idade || 0,
        comportamento: crianca.comportamento || 'Bem comportado'
      })),
      order_bumps: pers_data.order_bumps || [],
      photos: pers_data.fotos || [],
      special_requests: pers_data.observacoes
    },
    pricing: {
      base_price: pricingData.basePrice,
      additional_costs: pricingData.orderBumpsTotal + pricingData.photosTotal,
      total: pricingData.total,
      currency: pricingData.currency,
      breakdown: pricingData.breakdown
    },
    utm_params: utmParams
  };
};

// ✅ Validar dados específicos do Brasil
const validateBrazilianData = (payload: LastLinkPayload): void => {
  // Validar telefone brasileiro
  const phoneClean = payload.customer.phone.replace(/\D/g, '');
  if (phoneClean.length < 10 || phoneClean.length > 11) {
    throw new Error('Telefone deve ter 10 ou 11 dígitos');
  }
};

// 🔗 Construir URL de checkout LastLink
const buildLastLinkCheckoutUrl = (payload: LastLinkPayload): string => {
  const baseUrl = `${LASTLINK_CONFIG.baseUrl}/checkout/${LASTLINK_CONFIG.productId}`;
  
  const params = new URLSearchParams({
    // Dados básicos
    session_id: payload.session_id,
    
    // Dados do cliente
    customer_name: payload.customer.name,
    customer_email: payload.customer.email,
    customer_phone: payload.customer.phone,
    
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

// 💰 Calcular preços LastLink
export const calculateLastLinkPricing = (persData: { fotos?: string[] }) => {
  const basePrice = 89.90;
  const photoPrice = 14.90;
  const photoCount = persData.fotos?.length || 0;
  
  return {
    basePrice,
    photoPrice,
    photoCount,
    additionalCosts: photoCount * photoPrice,
    total: basePrice + (photoCount * photoPrice),
    currency: 'BRL',
    formatted: {
      base: `R$ ${basePrice.toFixed(2).replace('.', ',')}`,
      additional: `R$ ${(photoCount * photoPrice).toFixed(2).replace('.', ',')}`,
      total: `R$ ${(basePrice + (photoCount * photoPrice)).toFixed(2).replace('.', ',')}`
    }
  };
};

// 🔍 Debug LastLink
export const debugLastLink = (checkoutData: CheckoutData): void => {
  console.group('🇧🇷 Debug LastLink');
  console.log('Config:', LASTLINK_CONFIG);
  
  try {
    const payload = prepareLastLinkPayload(checkoutData);
    console.log('Payload:', payload);
    console.log('Checkout URL:', buildLastLinkCheckoutUrl(payload));
    
    // Debug do novo sistema de preços
    const pricingData = getCurrentPricing('pt') || calculateUserSelectionPricing(
      checkoutData.pers_data.children?.length || 1,
      checkoutData.pers_data.order_bumps || [],
      checkoutData.pers_data.fotos?.length || 0,
      'pt'
    );
    
    console.log('New Pricing System:', pricingData);
  } catch (error) {
    console.log('Error:', error instanceof Error ? error.message : 'Unknown error');
  }
  
  console.groupEnd();
};

// 📱 Verificar se é mobile para ajustar experiência
export const isMobileLastLink = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 768;
};

// 🎯 Configurações específicas para mobile
export const getMobileLastLinkConfig = () => {
  return {
    ...LASTLINK_CONFIG,
    // Configurações específicas para mobile
    mobileOptimized: true,
    redirectDelay: isMobileLastLink() ? 500 : 1000
  };
};