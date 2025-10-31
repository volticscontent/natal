import { useMemo } from 'react';
import { unformatCPF, unformatPhone } from '../components/main/pers/utils/validation';
import { Product } from './useProducts';

export interface OrderBumps {
  '4k-quality': boolean;
  'fast-delivery': boolean;
  'child-photo': boolean;
  'combo-addons': boolean;
}

export type OrderBumpSelection = OrderBumps;

export interface CustomerData {
  nome?: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  cnpj?: string;
}

export interface LastLinkUrlMapping {
  productId: string;
  baseUrl: string;
  finalUrl: string;
  selectedBumps: string[];
  customerParams?: Record<string, string>;
}

/**
 * Hook para mapear as seleções do cliente para URLs da LastLink
 */
export const useLastLinkUrlMapper = () => {
  
  /**
   * Gera a URL final da LastLink baseada no produto e order bumps selecionados
   */
  const generateLastLinkUrl = useMemo(() => {
    return (product: Product, orderBumps: OrderBumpSelection, customerData?: CustomerData): LastLinkUrlMapping => {
      if (!product.checkoutUrls?.lastlink) {
        throw new Error(`Produto ${product.id} não possui URLs da LastLink configuradas`);
      }

      const { lastlink } = product.checkoutUrls;
      const selectedBumps: string[] = [];
      
      // Identifica quais order bumps foram selecionados
      if (orderBumps['4k-quality']) selectedBumps.push('4k-quality');
      if (orderBumps['fast-delivery']) selectedBumps.push('fast-delivery');
      if (orderBumps['child-photo']) selectedBumps.push('child-photo');
      if (orderBumps['combo-addons']) selectedBumps.push('combo-addons');

      // Determina qual URL usar baseado nas seleções
      let urlKey: string;

      // Se combo foi selecionado, usa a URL do combo (ignora outras seleções)
      if (orderBumps['combo-addons']) {
        urlKey = lastlink.withCombo || lastlink.base;
      }
      // Combinações de todas as opções
      else if (orderBumps['4k-quality'] && orderBumps['fast-delivery'] && orderBumps['child-photo']) {
        urlKey = lastlink.withAll || lastlink.base;
      }
      // Combinações de 4K e Fast Delivery
      else if (orderBumps['4k-quality'] && orderBumps['fast-delivery']) {
        urlKey = lastlink.with4KAndFastDelivery || lastlink.base;
      }
      // Combinações de 4K e Photo
      else if (orderBumps['4k-quality'] && orderBumps['child-photo']) {
        urlKey = lastlink.with4KAndPhoto || lastlink.base;
      }
      // Combinações de Fast Delivery e Photo
      else if (orderBumps['fast-delivery'] && orderBumps['child-photo']) {
        urlKey = lastlink.withFastDeliveryAndPhoto || lastlink.base;
      }
      // Opções individuais
      else if (orderBumps['4k-quality']) {
        urlKey = lastlink.with4K || lastlink.base;
      }
      else if (orderBumps['fast-delivery']) {
        urlKey = lastlink.withFastDelivery || lastlink.base;
      }
      else if (orderBumps['child-photo']) {
        urlKey = lastlink.withPhoto || lastlink.base;
      }
      // Nenhuma opção selecionada
      else {
        urlKey = lastlink.base;
      }

      // Preparar parâmetros do cliente para autopopulação (formato único: sem formatação)
      const customerParams: Record<string, string> = {};
      if (customerData) {
        if (customerData.nome) customerParams.name = customerData.nome;
        if (customerData.email) customerParams.email = customerData.email;
        if (customerData.telefone) customerParams.phone = unformatPhone(customerData.telefone);
        if (customerData.cpf) customerParams.cpf = unformatCPF(customerData.cpf);
      }

      return {
        productId: product.id,
        baseUrl: lastlink.base,
        finalUrl: urlKey,
        selectedBumps,
        customerParams
      };
    };
  }, []);

  /**
   * Recupera parâmetros UTM salvos no localStorage
   */
  const getUtmParams = useMemo(() => {
    return (): Record<string, string> => {
      if (typeof window === 'undefined') return {};
      
      try {
        const saved = localStorage.getItem('pers_utm_params');
        return saved ? JSON.parse(saved) : {};
      } catch (error) {
        console.warn('Erro ao recuperar UTMs do localStorage:', error);
        return {};
      }
    };
  }, []);

  /**
   * Gera a URL completa da LastLink com o novo formato
   */
  const buildCompleteLastLinkUrl = useMemo(() => {
    return (mapping: LastLinkUrlMapping, baseUrl: string = 'https://lastlink.com'): string => {
      console.log('🔍 buildCompleteLastLinkUrl - mapping:', mapping);
      console.log('🔍 buildCompleteLastLinkUrl - baseUrl:', baseUrl);
      
      // Usar o novo formato: https://lastlink.com/p/{urlKey}/checkout-payment/
      const url = new URL(`${baseUrl}/p/${mapping.finalUrl}/checkout-payment/`);
      console.log('🔍 buildCompleteLastLinkUrl - URL base construída:', url.toString());
      
      // Adicionar parâmetros de autopopulação se disponíveis
      if (mapping.customerParams) {
        console.log('🔍 buildCompleteLastLinkUrl - adicionando customerParams:', mapping.customerParams);
        Object.entries(mapping.customerParams).forEach(([key, value]) => {
          if (value) {
            url.searchParams.set(key, value);
          }
        });
      }

      // Adicionar parâmetros específicos dos order bumps baseado no mapping
      if (mapping.selectedBumps) {
        const hasCombo = mapping.selectedBumps.includes('combo-addons');
        const hasFastDelivery = mapping.selectedBumps.includes('fast-delivery');
        const has4K = mapping.selectedBumps.includes('4k-quality');
        const hasPhoto = mapping.selectedBumps.includes('child-photo');

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
      }

      // Adicionar parâmetros UTM salvos
      const utmParams = getUtmParams();
      console.log('🔍 buildCompleteLastLinkUrl - UTM params:', utmParams);
      Object.entries(utmParams).forEach(([key, value]) => {
        if (value && typeof value === 'string') {
          url.searchParams.set(key, value);
        }
      });
      
      const finalUrl = url.toString();
      console.log('🔍 buildCompleteLastLinkUrl - URL final:', finalUrl);
      return finalUrl;
    };
  }, [getUtmParams]);

  /**
   * Função de conveniência que combina geração de mapping e URL completa
   */
  const generateCompleteUrl = useMemo(() => {
    return (
      product: Product, 
      orderBumps: OrderBumpSelection, 
      baseUrl?: string,
      customerData?: CustomerData
    ): { mapping: LastLinkUrlMapping; completeUrl: string } => {
      const mapping = generateLastLinkUrl(product, orderBumps, customerData);
      const completeUrl = buildCompleteLastLinkUrl(mapping, baseUrl);
      
      return { mapping, completeUrl };
    };
  }, [generateLastLinkUrl, buildCompleteLastLinkUrl]);

  /**
   * Valida se um produto tem todas as URLs necessárias configuradas
   */
  const validateProductUrls = useMemo(() => {
    return (product: Product): { isValid: boolean; missingUrls: string[] } => {
      const missingUrls: string[] = [];
      
      if (!product.checkoutUrls?.lastlink) {
        return { isValid: false, missingUrls: ['lastlink configuration'] };
      }

      const { lastlink } = product.checkoutUrls;
      
      if (!lastlink.base) missingUrls.push('base');
      if (!lastlink.with4K) missingUrls.push('with4K');
      if (!lastlink.withFastDelivery) missingUrls.push('withFastDelivery');
      if (!lastlink.withPhoto) missingUrls.push('withPhoto');
      if (!lastlink.with4KAndFastDelivery) missingUrls.push('with4KAndFastDelivery');
      if (!lastlink.with4KAndPhoto) missingUrls.push('with4KAndPhoto');
      if (!lastlink.withFastDeliveryAndPhoto) missingUrls.push('withFastDeliveryAndPhoto');
      if (!lastlink.withAll) missingUrls.push('withAll');
      if (!lastlink.withCombo) missingUrls.push('withCombo');

      return {
        isValid: missingUrls.length === 0,
        missingUrls
      };
    };
  }, []);

  return {
    generateLastLinkUrl,
    buildCompleteLastLinkUrl,
    generateCompleteUrl,
    validateProductUrls
  };
};

export default useLastLinkUrlMapper;