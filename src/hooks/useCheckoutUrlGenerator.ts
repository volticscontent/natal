import { useMemo } from 'react';
import { useProducts } from './useProducts';
import { useLastLinkUrlMapper, OrderBumpSelection, CustomerData } from './useLastLinkUrlMapper';
import { PersData } from '../components/main/pers/types';
import { getCheckoutProvider } from '../lib/checkout-config';

export interface CheckoutUrlResult {
  success: boolean;
  url?: string;
  error?: string;
  provider: 'lastlink' | 'cartpanda';
  productInfo?: {
    id: string;
    title: string;
    childrenCount: number;
  };
  selectedBumps?: string[];
}

/**
 * Hook para gerar URLs de checkout baseado nos dados de personalização
 */
export const useCheckoutUrlGenerator = (locale: 'pt' | 'en' | 'es' = 'pt') => {
  const { getMainProductByChildren, loading, error } = useProducts(locale);
  const { generateCompleteUrl, validateProductUrls } = useLastLinkUrlMapper();

  /**
   * Converte array de order bumps para o formato esperado pelo mapper
   */
  const convertOrderBumpsToSelection = useMemo(() => {
    return (orderBumps: string[]): OrderBumpSelection => {
      return {
        '4k-quality': orderBumps.includes('4k-quality'),
        'fast-delivery': orderBumps.includes('fast-delivery'),
        'child-photo': orderBumps.includes('child-photo'),
        'combo-addons': orderBumps.includes('combo-addons')
      };
    };
  }, []);

  /**
   * Gera a URL de checkout baseada nos dados de personalização
   */
  const generateCheckoutUrl = useMemo(() => {
    return (persData: PersData): CheckoutUrlResult => {
      try {
        // Validações básicas
        if (!persData.children || persData.children.length === 0) {
          return {
            success: false,
            error: 'Nenhuma criança foi adicionada',
            provider: getCheckoutProvider(locale).name.toLowerCase() as 'lastlink' | 'cartpanda'
          };
        }

        // Determinar o provedor de checkout
        const checkoutProvider = getCheckoutProvider(locale);
        const providerName = checkoutProvider.name.toLowerCase() as 'lastlink' | 'cartpanda';

        // Se não for LastLink, retornar erro (por enquanto só suportamos LastLink)
        if (providerName !== 'lastlink') {
          return {
            success: false,
            error: `Provedor ${providerName} não suportado ainda`,
            provider: providerName
          };
        }

        // Obter produto baseado no número de crianças
        const childrenCount = persData.children.length;
        const product = getMainProductByChildren(childrenCount);

        if (!product) {
          return {
            success: false,
            error: `Produto não encontrado para ${childrenCount} criança(s)`,
            provider: providerName
          };
        }

        // Validar se o produto tem todas as URLs necessárias
        const validation = validateProductUrls(product);
        if (!validation.isValid) {
          return {
            success: false,
            error: `Produto ${product.id} está com URLs incompletas: ${validation.missingUrls.join(', ')}`,
            provider: providerName,
            productInfo: {
              id: product.id,
              title: product.title[locale],
              childrenCount: product.childrenCount || childrenCount
            }
          };
        }

        // Converter order bumps para o formato do mapper
        const orderBumpSelection = convertOrderBumpsToSelection(persData.order_bumps || []);

        // Preparar dados do cliente para autopopulação
        const customerData: CustomerData = {
          nome: persData.contato?.nome,
          email: persData.contato?.email,
          telefone: persData.contato?.telefone,
          cpf: persData.contato?.cpf,
          cnpj: persData.contato?.cnpj,
        };

        // Gerar URL completa
        const { mapping, completeUrl } = generateCompleteUrl(
          product, 
          orderBumpSelection,
          checkoutProvider.baseUrl,
          customerData
        );

        return {
          success: true,
          url: completeUrl,
          provider: providerName,
          productInfo: {
            id: product.id,
            title: product.title[locale],
            childrenCount: product.childrenCount || childrenCount
          },
          selectedBumps: mapping.selectedBumps
        };

      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Erro desconhecido',
          provider: getCheckoutProvider(locale).name.toLowerCase() as 'lastlink' | 'cartpanda'
        };
      }
    };
  }, [locale, getMainProductByChildren, generateCompleteUrl, validateProductUrls, convertOrderBumpsToSelection]);

  /**
   * Função de conveniência para gerar URL e redirecionar
   */
  const generateAndRedirect = useMemo(() => {
    return (persData: PersData): Promise<CheckoutUrlResult> => {
      return new Promise((resolve) => {
        const result = generateCheckoutUrl(persData);
        
        if (result.success && result.url) {
          // Redirecionar para a URL gerada
          window.location.href = result.url;
        }
        
        resolve(result);
      });
    };
  }, [generateCheckoutUrl]);

  /**
   * Valida se os dados estão prontos para gerar checkout
   */
  const validateForCheckout = useMemo(() => {
    return (persData: PersData): { isValid: boolean; errors: string[] } => {
      const errors: string[] = [];

      if (!persData.children || persData.children.length === 0) {
        errors.push('Pelo menos uma criança deve ser adicionada');
      }

      if (persData.children && persData.children.length > 3) {
        errors.push('Máximo de 3 crianças permitido');
      }

      if (persData.order_bumps && persData.order_bumps.length > 4) {
        errors.push('Máximo de 4 order bumps permitido');
      }

      // Validar dados das crianças
      if (persData.children) {
        persData.children.forEach((child, index) => {
          if (!child.nome || child.nome.trim().length < 2) {
            errors.push(`Nome da criança ${index + 1} deve ter pelo menos 2 caracteres`);
          }
        });
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    };
  }, []);

  return {
    generateCheckoutUrl,
    generateAndRedirect,
    validateForCheckout,
    loading,
    error
  };
};

export default useCheckoutUrlGenerator;