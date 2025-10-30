import { useState, useEffect } from 'react';
import { getCheckoutProvider, buildCheckoutUrl } from '../lib/checkout-config';

// Tipos para os produtos
export interface ProductPricing {
  price: number;
  originalPrice?: number;
  currency: string;
}

export interface ProductTitle {
  pt: string;
  en: string;
  es: string;
}

export interface ProductDescription {
  pt: string;
  en: string;
  es: string;
}

export interface ProductFeatures {
  pt: string[];
  en: string[];
  es: string[];
}

export interface CheckoutUrls {
  lastlink?: {
    base: string;
    with4K?: string;
    withFastDelivery?: string;
    withPhoto?: string;
    with4KAndFastDelivery?: string;
    with4KAndPhoto?: string;
    withFastDeliveryAndPhoto?: string;
    withAll?: string;
    withCombo?: string;
  };
}

export interface Product {
  id: string;
  title: ProductTitle;
  pricing: {
    lastlink: ProductPricing;
    cartpanda: ProductPricing;
  };
  image?: string;
  description: ProductDescription;
  features: ProductFeatures;
  checkoutUrls?: CheckoutUrls;
  childrenCount?: number;
  includes?: string[];
}

export interface CheckoutProvider {
  name: string;
  region: string;
  locale?: string;
  locales?: string[];
  currency: string;
  baseUrl: string;
  description: string;
}

export interface ProductsData {
  checkoutProviders: {
    lastlink: CheckoutProvider;
    cartpanda: CheckoutProvider;
  };
  mainProducts: Product[];
  orderBumps: Product[];
}

export const useProducts = (locale: 'pt' | 'en' | 'es' = 'pt') => {
  const [products, setProducts] = useState<ProductsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/checkout/products');
        
        if (!response.ok) {
          throw new Error(`Erro ao carregar produtos: ${response.status}`);
        }
        
        const data: ProductsData = await response.json();
        setProducts(data);
        setError(null);
      } catch (err) {
        console.error('Erro ao carregar produtos:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  /**
   * Determina o provedor de checkout baseado no locale
   */
  const getCheckoutProviderForLocale = (locale: string) => {
    return getCheckoutProvider(locale);
  };

  // Função para obter produtos principais baseado no número de crianças
  const getMainProductByChildren = (childrenCount: number): Product | null => {
    if (!products) return null;

    if (childrenCount === 1) {
      return products.mainProducts.find(p => p.id === 'video-1-crianca') || null;
    } else if (childrenCount === 2) {
      return products.mainProducts.find(p => p.id === 'video-2-criancas') || null;
    } else if (childrenCount >= 3) {
      return products.mainProducts.find(p => p.id === 'video-3-ou-mais-criancas') || null;
    }

    return null;
  };

  // Função para obter order bumps disponíveis
  const getOrderBumps = (): Product[] => {
    return products?.orderBumps || [];
  };

  // Função para obter preço de um produto baseado no provedor
  const getProductPrice = (product: Product, provider?: 'lastlink' | 'cartpanda'): ProductPricing => {
    const checkoutProvider = getCheckoutProviderForLocale(locale);
    const targetProvider = provider || (checkoutProvider.name.toLowerCase() as 'lastlink' | 'cartpanda');
    return product.pricing[targetProvider];
  };

  // Função para obter texto localizado
  const getLocalizedText = (text: ProductTitle | ProductDescription): string => {
    return text[locale] || text.pt || '';
  };

  // Função para obter features localizadas
  const getLocalizedFeatures = (features: ProductFeatures): string[] => {
    return features[locale] || features.pt || [];
  };

  /**
   * Constrói URL de checkout do LastLink com base nos order bumps selecionados
   */
  const buildLastLinkCheckoutUrl = (product: Product, selectedBumps: string[] = []): string => {
    const provider = getCheckoutProviderForLocale('pt');
    
    if (!product.checkoutUrls?.lastlink) {
      return buildCheckoutUrl(provider, product.id);
    }

    const urls = product.checkoutUrls.lastlink;
    const hasCombo = selectedBumps.includes('combo');
    const has4K = selectedBumps.includes('4k');
    const hasFastDelivery = selectedBumps.includes('fast_delivery');
    const hasPhoto = selectedBumps.includes('photo');

    // Lógica para determinar qual URL usar baseado nos order bumps
    if (hasCombo) {
      return buildCheckoutUrl(provider, urls.withCombo);
    }

    if (has4K && hasFastDelivery && hasPhoto) {
      return buildCheckoutUrl(provider, urls.withAll);
    }

    if (has4K && hasFastDelivery) {
      return buildCheckoutUrl(provider, urls.with4KAndFastDelivery);
    }

    if (has4K && hasPhoto) {
      return buildCheckoutUrl(provider, urls.with4KAndPhoto);
    }

    if (hasFastDelivery && hasPhoto) {
      return buildCheckoutUrl(provider, urls.withFastDeliveryAndPhoto);
    }

    if (has4K) {
      return buildCheckoutUrl(provider, urls.with4K);
    }

    if (hasFastDelivery) {
      return buildCheckoutUrl(provider, urls.withFastDelivery);
    }

    if (hasPhoto) {
      return buildCheckoutUrl(provider, urls.withPhoto);
    }

    return buildCheckoutUrl(provider, urls.base);
  };

  return {
    products,
    loading,
    error,
    getCheckoutProvider: getCheckoutProviderForLocale,
    getMainProductByChildren,
    getOrderBumps,
    getProductPrice,
    getLocalizedText,
    getLocalizedFeatures,
    buildLastLinkCheckoutUrl
  };
};