// 🇧🇷 LastLink Checkout - Checkout para o mercado brasileiro

import { CheckoutData } from '../../types';
import { clearAllData, getCurrentPricing } from '../../utils/dataStorage';
import { calculateUserSelectionPricing } from '../../../../../lib/pricing-calculator';
import { unformatCPF, unformatPhone } from '../../utils/validation';

// 🔗 URLs e configurações LastLink
const LASTLINK_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_LASTLINK_BASE_URL || 'https://lastlink.com',
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
    cpf?: string;
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
export const processLastLinkCheckout = (
  checkoutData: CheckoutData, 
  productData: { checkoutUrls: { lastlink: Record<string, string> } }
): void => {
  try {
    // 1. Preparar payload
    const payload = prepareLastLinkPayload(checkoutData);
    
    // 2. Validar dados específicos do Brasil
    validateBrazilianData(payload);
    
    // 3. Construir URL de checkout (agora é síncrono e rápido)
    const checkoutUrl = buildLastLinkCheckoutUrl(payload, productData);
    
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
      'pt'
    );
  }
  
  // Recuperar parâmetros UTM
  const utmParams = getUTMParams();
  
  // Obter dados do cliente com formatação limpa
  const customerPhone = session_data.user_data.telefone || pers_data.contato?.telefone || '';
  const customerCpf = session_data.user_data.cpf || pers_data.contato?.cpf || '';

  return {
    session_id: session_data.session_id,
    product_id: LASTLINK_CONFIG.productId,
    customer: {
      name: session_data.user_data.nome!,
      email: session_data.user_data.email!,
      phone: unformatPhone(customerPhone),
      cpf: unformatCPF(customerCpf)
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
      additional_costs: pricingData.orderBumpsTotal,
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
const buildLastLinkCheckoutUrl = (payload: LastLinkPayload, productData: { checkoutUrls: { lastlink: Record<string, string> } }): string => {
  try {
    // Usar dados do produto passados como parâmetro (sem fetch)
    const product = productData;
    
    if (!product || !product.checkoutUrls?.lastlink) {
      throw new Error('Dados do produto LastLink não encontrados');
    }
    
    // Determinar qual URL usar baseado nos order bumps
    const orderBumps = payload.personalization.order_bumps || [];
    const { lastlink } = product.checkoutUrls;
    
    let urlKey: string;
    
    // Lógica de seleção de URL baseada nos order bumps
    const hasCombo = orderBumps.includes('combo-addons');
    const has4K = orderBumps.includes('4k-quality');
    const hasFastDelivery = orderBumps.includes('fast-delivery');
    const hasPhoto = orderBumps.includes('child-photo');
    
    if (hasCombo) {
      urlKey = lastlink.withCombo || lastlink.base;
    } else if (has4K && hasFastDelivery && hasPhoto) {
      urlKey = lastlink.withAll || lastlink.base;
    } else if (has4K && hasFastDelivery) {
      urlKey = lastlink.with4KAndFastDelivery || lastlink.base;
    } else if (has4K && hasPhoto) {
      urlKey = lastlink.with4KAndPhoto || lastlink.base;
    } else if (hasFastDelivery && hasPhoto) {
      urlKey = lastlink.withFastDeliveryAndPhoto || lastlink.base;
    } else if (has4K) {
      urlKey = lastlink.with4K || lastlink.base;
    } else if (hasFastDelivery) {
      urlKey = lastlink.withFastDelivery || lastlink.base;
    } else if (hasPhoto) {
      urlKey = lastlink.withPhoto || lastlink.base;
    } else {
      urlKey = lastlink.base;
    }
    
    // Construir URL no formato correto do LastLink
    const baseUrl = `https://lastlink.com/p/${urlKey}/checkout-payment/`;
    const url = new URL(baseUrl);
    
    // Adicionar dados do cliente como parâmetros para autopopulação
    if (payload.customer.name) {
      url.searchParams.set('name', payload.customer.name);
    }
    if (payload.customer.email) {
      url.searchParams.set('email', payload.customer.email);
    }
    if (payload.customer.phone) {
      url.searchParams.set('phone', payload.customer.phone);
    }
    if (payload.customer.cpf) {
      url.searchParams.set('cpf', payload.customer.cpf);
    }

    console.log('LastLink - Dados formatados:', {
      phone_clean: payload.customer.phone,
      cpf_clean: payload.customer.cpf
    });
    console.log('LastLink URL final:', url.toString());
    
    // Adicionar parâmetros específicos dos order bumps
    if (hasCombo) {
      // Combo inclui entrega rápida, 4K e fotos
      url.searchParams.set('fast_delivery', 'true');
      url.searchParams.set('quality_4k', 'true');
      url.searchParams.set('child_photos', 'true');
      url.searchParams.set('combo_package', 'true');
    } else {
      // Order bumps individuais
      if (hasFastDelivery) {
        url.searchParams.set('fast_delivery', 'true');
      }
      if (has4K) {
        url.searchParams.set('quality_4k', 'true');
      }
      if (hasPhoto) {
        url.searchParams.set('child_photos', 'true');
      }
    }

    // Adicionar UTM params
    if (payload.utm_params) {
      Object.entries(payload.utm_params).forEach(([key, value]) => {
        if (value) {
          url.searchParams.set(key, value);
        }
      });
    }
    
    const finalUrl = url.toString();
    console.log('🔗 URL do LastLink construída:', finalUrl);
    console.log('🔍 Parâmetros de autopopulação:', {
      name: url.searchParams.get('name'),
      email: url.searchParams.get('email'),
      phone: url.searchParams.get('phone')
    });
    return finalUrl;
    
  } catch (error) {
    console.error('Erro ao construir URL do LastLink:', error);
    // Fallback para URL base se houver erro
    return `https://lastlink.com/p/C0EE44F93/checkout-payment/`;
  }
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
    // Note: buildLastLinkCheckoutUrl agora requer productData como segundo parâmetro
    
    // Debug do novo sistema de preços
    const pricingData = getCurrentPricing('pt') || calculateUserSelectionPricing(
      checkoutData.pers_data.children?.length || 1,
      checkoutData.pers_data.order_bumps || [],
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