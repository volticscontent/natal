/**
 * 💰 Sistema Centralizado de Cálculo de Preços
 * 
 * Este módulo centraliza toda a lógica de cálculo de preços,
 * garantindo consistência entre todos os componentes.
 */

import { getCheckoutProvider } from './checkout-config';

// 🏷️ Interfaces
export interface PricingResult {
  basePrice: number;
  orderBumpsTotal: number;
  comboDiscount: number;
  subtotal: number;
  total: number;
  currency: string;
  provider: 'lastlink' | 'cartpanda';
  breakdown: PriceBreakdown[];
}

export interface PriceBreakdown {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  isCombo?: boolean;
  quantity?: number;
}

export interface OrderBumpSelection {
  id: string;
  selected: boolean;
}

export interface PricingInput {
  childrenCount: number;
  orderBumps: string[];
  locale: string;
  isCombo?: boolean;
}

// Interfaces para produtos da API
interface ProductPricing {
  price: number;
  originalPrice?: number;
}

interface Product {
  id: string;
  pricing: {
    lastlink?: ProductPricing;
    cartpanda?: ProductPricing;
  };
}

interface ProductsApiResponse {
  mainProducts: Product[];
  orderBumps: Product[];
}

// 📊 Tabela de Preços (sincronizada com products.json)
const PRICING_TABLE = {
  lastlink: {
    currency: 'BRL',
    videos: {
      1: { price: 49.99, originalPrice: 69.99 },
      2: { price: 59.99, originalPrice: 79.99 },
      3: { price: 69.99, originalPrice: 99.99 }
    },
    orderBumps: {
      '4k-quality': { price: 12.00 },
      'fast-delivery': { price: 12.00 },
      'child-photo': { price: 14.90 }
    },
    combo: {
      price: 29.99,
      savings: 8.91 // Economia real do combo
    },
    photoPrice: 14.90
  },
  cartpanda: {
    currency: 'USD',
    videos: {
      1: { price: 29.99, originalPrice: 49.99 },
      2: { price: 39.99, originalPrice: 59.99 },
      3: { price: 49.99, originalPrice: 69.99 }
    },
    orderBumps: {
      '4k-quality': { price: 4.99 },
      'fast-delivery': { price: 2.99 },
      'child-photo': { price: 4.99 }
    },
    combo: {
      price: 9.99,
      savings: 2.98 // Economia real do combo
    },
    photoPrice: 4.99
  }
} as const;

// 🎯 Função principal de cálculo
export const calculatePricing = (input: PricingInput): PricingResult => {
  console.group('💰 Calculating Pricing');
  console.log('Input:', input);

  // Determinar provider baseado no locale
  const checkoutProvider = getCheckoutProvider(input.locale);
  const provider = checkoutProvider.name.toLowerCase() as 'lastlink' | 'cartpanda';
  const pricing = PRICING_TABLE[provider];
  
  console.log('Provider:', provider);
  console.log('Pricing table:', pricing);

  // Calcular preço base do vídeo
  const childrenKey = Math.min(input.childrenCount, 3) as 1 | 2 | 3;
  const videoPrice = pricing.videos[childrenKey];
  const basePrice = videoPrice.price;

  console.log('Children count:', input.childrenCount, '-> key:', childrenKey);
  console.log('Base price:', basePrice);

  // Calcular order bumps
  let orderBumpsTotal = 0;
  let comboDiscount = 0;
  const breakdown: PriceBreakdown[] = [];

  // Adicionar vídeo base ao breakdown
  breakdown.push({
    id: 'base-video',
    title: `Vídeo ${input.childrenCount} criança${input.childrenCount > 1 ? 's' : ''}`,
    price: basePrice,
    originalPrice: videoPrice.originalPrice
  });

  // Verificar se é combo de adicionais
  const hasCombo = input.isCombo || input.orderBumps.includes('combo-addons');
  
  if (hasCombo) {
    // Combo: preço fixo com desconto já embutido
    orderBumpsTotal = pricing.combo.price;
    comboDiscount = 0; // Desconto já está embutido no preço
    
    // Valor original do combo baseado no provider
    const comboOriginalPrice = provider === 'lastlink' ? 38.90 : 12.97;
    
    breakdown.push({
      id: 'combo-addons',
      title: 'Combo Completo (4K + Entrega + Foto)',
      price: pricing.combo.price,
      originalPrice: comboOriginalPrice,
      isCombo: true
    });
  } else {
    // Order bumps individuais (apenas se NÃO tiver combo)
    input.orderBumps.forEach(bumpId => {
      if (bumpId === 'combo-addons') return; // Não deveria acontecer, mas por segurança
      
      const bump = pricing.orderBumps[bumpId as keyof typeof pricing.orderBumps];
      if (bump) {
        orderBumpsTotal += bump.price;
        breakdown.push({
          id: bumpId,
          title: getBumpTitle(bumpId),
          price: bump.price
        });
      }
    });
  }

  // Não há mais cobrança de fotos adicionais individuais
  // As fotos são incluídas apenas via order bump 'child-photo' ou combo

  // Calcular totais
  const subtotal = basePrice + orderBumpsTotal;
  // Se é combo, o desconto já está embutido no preço, então não subtraímos novamente
  const total = hasCombo ? subtotal : subtotal - comboDiscount;

  const result: PricingResult = {
    basePrice,
    orderBumpsTotal,
    comboDiscount,
    subtotal,
    total,
    currency: pricing.currency,
    provider,
    breakdown
  };

  console.log('Final result:', result);
  console.groupEnd();

  return result;
};

// 🏷️ Obter título do order bump
const getBumpTitle = (bumpId: string): string => {
  const titles: Record<string, string> = {
    '4k-quality': 'Qualidade 4K',
    'fast-delivery': 'Entrega Rápida',
    'child-photo': 'Foto da Criança'
  };
  return titles[bumpId] || bumpId;
};

// 💱 Formatação de moeda
export const formatPrice = (price: number, currency: string): string => {
  if (currency === 'BRL') {
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  } else {
    return `$${price.toFixed(2)}`;
  }
};

// 🎯 Calcular economia do combo
export const calculateComboSavings = (
  childrenCount: number, 
  locale: string
): { savings: number; currency: string } => {
  const checkoutProvider = getCheckoutProvider(locale);
  const provider = checkoutProvider.name.toLowerCase() as 'lastlink' | 'cartpanda';
  const pricing = PRICING_TABLE[provider];
  
  return {
    savings: pricing.combo.savings,
    currency: pricing.currency
  };
};

// 📊 Obter preços de produtos do JSON
export const getProductPricing = async (productId: string, provider: 'lastlink' | 'cartpanda') => {
  try {
    const response = await fetch('/api/checkout/products');
    const data: ProductsApiResponse = await response.json();
    
    // Buscar produto principal
    const mainProduct = data.mainProducts.find((p: Product) => p.id === productId);
    if (mainProduct) {
      return mainProduct.pricing[provider];
    }
    
    // Buscar order bump
    const orderBump = data.orderBumps.find((p: Product) => p.id === productId);
    if (orderBump) {
      return orderBump.pricing[provider];
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao buscar preços:', error);
    return null;
  }
};

// 🔄 Sincronizar com products.json (para validação)
export const validatePricingSync = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/checkout/products');
    const data: ProductsApiResponse = await response.json();
    
    // Verificar se os preços estão sincronizados
    const video1LastLink = data.mainProducts.find((p: Product) => p.id === 'video-1-crianca')?.pricing?.lastlink;
    const expectedPrice = PRICING_TABLE.lastlink.videos[1].price;
    
    if (video1LastLink?.price !== expectedPrice) {
      console.warn('⚠️ Preços desincronizados!', {
        expected: expectedPrice,
        actual: video1LastLink?.price
      });
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erro na validação de sincronização:', error);
    return false;
  }
};

// 🎯 Calcular preço baseado em seleções do usuário
export const calculateUserSelectionPricing = (
  childrenCount: number,
  selectedBumps: string[],
  locale: string
): PricingResult => {
  return calculatePricing({
    childrenCount,
    orderBumps: selectedBumps,
    locale,
    isCombo: selectedBumps.includes('combo-addons')
  });
};

// 📋 Obter resumo de preços para exibição
export const getPricingSummary = (pricingResult: PricingResult) => {
  return {
    basePrice: formatPrice(pricingResult.basePrice, pricingResult.currency),
    orderBumps: formatPrice(pricingResult.orderBumpsTotal, pricingResult.currency),
    discount: pricingResult.comboDiscount > 0 ? 
      formatPrice(pricingResult.comboDiscount, pricingResult.currency) : null,
    total: formatPrice(pricingResult.total, pricingResult.currency),
    currency: pricingResult.currency,
    breakdown: pricingResult.breakdown
  };
};