// 🌍 Checkout Router - Roteamento multi-regional

import { 
  CheckoutProvider, 
  CheckoutData, 
  CompleteSessionData,
  CHECKOUT_PROVIDERS 
} from '../types';
import { getCompleteSessionData } from './dataStorage';

// 🎯 Determinar provedor de checkout baseado no locale
export const getCheckoutProvider = (locale: string): CheckoutProvider => {
  switch (locale.toLowerCase()) {
    case 'pt':
    case 'pt-br':
      return CHECKOUT_PROVIDERS.LASTLINK as CheckoutProvider;
    
    case 'en':
    case 'en-us':
    case 'es':
    case 'es-es':
    default:
      return CHECKOUT_PROVIDERS.CARTPANDA as CheckoutProvider;
  }
};

// 📊 Preparar dados para checkout
export const prepareCheckoutData = (
  locale: string,
  sessionData?: Partial<CompleteSessionData>
): CheckoutData => {
  const data = sessionData || getCompleteSessionData();
  const provider = getCheckoutProvider(locale);
  
  // Validar se temos todos os dados necessários
  if (!data.session_id || !data.pers_data || !data.user_data) {
    throw new Error('Dados incompletos para checkout');
  }
  
  return {
    provider,
    locale,
    session_data: {
      session_id: data.session_id,
      user_data: data.user_data
    },
    pers_data: data.pers_data
  } as CheckoutData;
};

// 🚀 Redirecionar para checkout apropriado
export const redirectToCheckout = async (
  checkoutData: CheckoutData
): Promise<void> => {
  try {
    switch (checkoutData.provider) {
      case CHECKOUT_PROVIDERS.LASTLINK:
        await redirectToLastLink(checkoutData);
        break;
      
      case CHECKOUT_PROVIDERS.CARTPANDA:
        await redirectToCartPanda(checkoutData);
        break;
      
      default:
        throw new Error(`Provedor de checkout desconhecido: ${checkoutData.provider}`);
    }
  } catch (error) {
    console.error('Erro no redirecionamento para checkout:', error);
    throw error;
  }
};

// 🇧🇷 Redirecionamento para LastLink (Brasil)
const redirectToLastLink = async (checkoutData: CheckoutData): Promise<void> => {
  // Importar dinamicamente o módulo LastLink
  const { processLastLinkCheckout } = await import('../checkout/lastlink');
  
  try {
    await processLastLinkCheckout(checkoutData);
  } catch (error) {
    console.error('Erro no checkout LastLink:', error);
    throw new Error('Falha no processamento do checkout brasileiro');
  }
};

// 🌍 Redirecionamento para CartPanda (Internacional)
const redirectToCartPanda = async (checkoutData: CheckoutData): Promise<void> => {
  // Importar dinamicamente o módulo CartPanda
  const { processCartPandaCheckout } = await import('../checkout/cartPanda/index');
  
  try {
    await processCartPandaCheckout(checkoutData);
  } catch (error) {
    console.error('Erro no checkout CartPanda:', error);
    throw new Error('Falha no processamento do checkout internacional');
  }
};

// ✅ Validar dados antes do checkout
export const validateCheckoutData = (data: CheckoutData): boolean => {
  // Validar dados básicos
  if (!data.session_data.session_id) {
    console.error('Session ID não encontrado');
    return false;
  }
  
  // Validar dados do usuário
  const { nome, email, telefone } = data.session_data.user_data;
  if (!nome || !email || !telefone) {
    console.error('Dados do usuário incompletos');
    return false;
  }
  
  // Validar dados de personalização
  if (!data.pers_data.children || data.pers_data.children.length === 0) {
    console.error('Dados de personalização incompletos');
    return false;
  }
  
  return true;
};

// 🔄 Processar checkout completo
export const processCheckout = async (locale: string): Promise<void> => {
  try {
    // 1. Preparar dados
    const checkoutData = prepareCheckoutData(locale);
    
    // 2. Validar dados
    if (!validateCheckoutData(checkoutData)) {
      throw new Error('Dados inválidos para checkout');
    }
    
    // 3. Redirecionar para checkout apropriado
    await redirectToCheckout(checkoutData);
    
    // 4. Limpar dados após sucesso (será feito pelos módulos específicos)
    
  } catch (error) {
    console.error('Erro no processamento do checkout:', error);
    throw error;
  }
};

// 🔍 Obter informações do checkout
export const getCheckoutInfo = (locale: string) => {
  const provider = getCheckoutProvider(locale);
  
  return {
    provider,
    locale,
    isLastLink: provider === CHECKOUT_PROVIDERS.LASTLINK,
    isCartPanda: provider === CHECKOUT_PROVIDERS.CARTPANDA,
    requiresCPF: provider === CHECKOUT_PROVIDERS.LASTLINK,
    currency: provider === CHECKOUT_PROVIDERS.LASTLINK ? 'BRL' : 'USD'
  };
};

// 📊 Calcular preços baseado no provedor
export const calculatePricing = (
  provider: CheckoutProvider,
  persData: { fotos?: string[] }
): { basePrice: number; additionalCosts: number; total: number; currency: string } => {
  const isLastLink = provider === CHECKOUT_PROVIDERS.LASTLINK;
  
  // Preços base (exemplo - ajustar conforme necessário)
  const basePrice = isLastLink ? 89.90 : 29.99;
  const photoPrice = isLastLink ? 14.90 : 4.99;
  
  // Calcular custos adicionais
  const photoCount = persData.fotos?.length || 0;
  const additionalCosts = photoCount * photoPrice;
  
  return {
    basePrice,
    additionalCosts,
    total: basePrice + additionalCosts,
    currency: isLastLink ? 'BRL' : 'USD'
  };
};

// 🔍 Debug do checkout
export const debugCheckout = (locale: string): void => {
  console.group('🔍 Debug Checkout');
  console.log('Locale:', locale);
  console.log('Checkout Info:', getCheckoutInfo(locale));
  
  try {
    const checkoutData = prepareCheckoutData(locale);
    console.log('Checkout Data:', checkoutData);
    console.log('Is Valid:', validateCheckoutData(checkoutData));
    console.log('Pricing:', calculatePricing(checkoutData.provider, checkoutData.pers_data));
  } catch (error) {
    console.log('Error preparing data:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
  
  console.groupEnd();
};