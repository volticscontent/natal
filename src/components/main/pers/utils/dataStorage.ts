// 💾 Data Storage - Gerenciamento de dados locais

import { 
  SessionData, 
  PersData, 
  CompleteSessionData, 
  StorageManager,
  STORAGE_KEYS 
} from '../types';
import { PricingResult, calculateUserSelectionPricing } from '../../../../lib/pricing-calculator';

// 🔍 Sistema de logs para localStorage
const logStorageOperation = (operation: string, key: string, data?: unknown, success: boolean = true) => {
  const timestamp = new Date().toISOString();
  const logStyle = success ? 'color: #10b981; font-weight: bold;' : 'color: #ef4444; font-weight: bold;';
  
  console.group(`%c📦 LocalStorage ${operation}`, logStyle);
  console.log(`⏰ Timestamp: ${timestamp}`);
  console.log(`🔑 Key: ${key}`);
  
  if (data !== undefined) {
    console.log(`📄 Data:`, data);
    console.log(`📊 Data Size: ${JSON.stringify(data).length} characters`);
    console.log(`🏷️ Data Type: ${typeof data}`);
    
    if (typeof data === 'object' && data !== null) {
      console.log(`🔢 Object Keys: ${Object.keys(data).length}`);
      console.log(`📋 Object Keys: [${Object.keys(data).join(', ')}]`);
    }
  }
  
  console.log(`✅ Success: ${success}`);
  console.groupEnd();
};

// 📊 Função para verificar o estado atual do localStorage
const logCurrentStorageState = () => {
  console.group('🗄️ Current LocalStorage State');
  
  Object.values(STORAGE_KEYS).forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      try {
        const parsed = JSON.parse(value);
        console.log(`${key}:`, parsed);
      } catch {
        console.log(`${key}: ${value} (raw string)`);
      }
    } else {
      console.log(`${key}: null`);
    }
  });
  
  console.groupEnd();
};

class LocalStorageManager implements StorageManager {
  save(key: string, data: unknown): void {
    try {
      const serializedData = JSON.stringify(data);
      localStorage.setItem(key, serializedData);
      logStorageOperation('SAVE', key, data, true);
      
      // Disparar evento customizado para notificar outros componentes
      window.dispatchEvent(new Event('localStorageChange'));
      
      // Log do estado atual após salvar
      if (process.env.NODE_ENV === 'development') {
        setTimeout(() => logCurrentStorageState(), 100);
      }
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
      logStorageOperation('SAVE', key, data, false);
    }
  }

  get(key: string): unknown {
    try {
      const item = localStorage.getItem(key);
      const parsed = item ? JSON.parse(item) : null;
      logStorageOperation('GET', key, parsed, true);
      return parsed;
    } catch (error) {
      console.error('Erro ao recuperar do localStorage:', error);
      logStorageOperation('GET', key, undefined, false);
      return null;
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
      logStorageOperation('REMOVE', key, undefined, true);
    } catch (error) {
      console.error('Erro ao remover do localStorage:', error);
      logStorageOperation('REMOVE', key, undefined, false);
    }
  }

  clear(): void {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      logStorageOperation('CLEAR_ALL', 'ALL_KEYS', undefined, true);
    } catch (error) {
      console.error('Erro ao limpar localStorage:', error);
      logStorageOperation('CLEAR_ALL', 'ALL_KEYS', undefined, false);
    }
  }
}

// Instância singleton do storage manager
const storageManager = new LocalStorageManager();

// 📊 Funções para dados de personalização
export const savePersonalizationData = (data: Partial<PersData>): void => {
  console.group('🎨 Saving Personalization Data');
  console.log('Input data:', data);
  
  const existingData = getPersonalizationData();
  console.log('Existing data:', existingData);
  
  const updatedData = { ...existingData, ...data };
  console.log('Updated data:', updatedData);
  
  storageManager.save(STORAGE_KEYS.PERS_DATA, updatedData);
  console.groupEnd();
};

export const getPersonalizationData = (): PersData => {
  console.group('🎨 Getting Personalization Data');
  
  const data = storageManager.get(STORAGE_KEYS.PERS_DATA) as PersData | null;
  console.log('Raw data from storage:', data);
  
  if (!data || typeof data !== 'object') {
    const defaultData = {
      quantidade_criancas: 1,
      children: [{ nome: '' }], // Garantir pelo menos uma criança
      mensagem: 'default',
      incluir_fotos: false,
      fotos: [],
      order_bumps: [],
      observacoes: ''
    };
    console.log('Using default data:', defaultData);
    console.groupEnd();
    return defaultData;
  }
  
  const result = {
    quantidade_criancas: data.quantidade_criancas || 1,
    children: data.children && data.children.length > 0 ? data.children : [{ nome: '' }], // Garantir pelo menos uma criança
    mensagem: data.mensagem || 'default',
    incluir_fotos: data.incluir_fotos || false,
    fotos: data.fotos || [],
    order_bumps: data.order_bumps || [],
    observacoes: data.observacoes || '',
    contato: data.contato
  };
  
  console.log('Processed data:', result);
  console.groupEnd();
  return result;
};

// 👤 Funções para dados de sessão
export const saveSessionData = (data: Partial<SessionData>): void => {
  console.group('👤 Saving Session Data');
  console.log('Input data:', data);
  
  const existingData = getSessionData();
  console.log('Existing data:', existingData);
  
  const updatedData = { ...existingData, ...data };
  console.log('Updated data:', updatedData);
  
  storageManager.save(STORAGE_KEYS.SESSION_DATA, updatedData);
  console.groupEnd();
};

export const getSessionData = (): Partial<SessionData> => {
  const result = storageManager.get(STORAGE_KEYS.SESSION_DATA) || {
    session_id: '',
    user_data: {
      nome: null,
      email: null,
      telefone: null
    },
    utm_data: {
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_term: null,
      utm_content: null
    },
    device_info: {
      user_agent: null,
      screen_resolution: null,
      timezone: null
    }
  };
  
  console.log('📊 Session Data Retrieved:', result);
  return result;
};

// 🔄 Funções para dados completos
export const getCompleteSessionData = (): Partial<CompleteSessionData> => {
  return {
    ...getSessionData(),
    pers_data: getPersonalizationData()
  };
};

export const saveCompleteSessionData = (data: Partial<CompleteSessionData>): void => {
  if (data.session_id || data.user_data) {
    saveSessionData({
      session_id: data.session_id,
      user_data: data.user_data
    });
  }
  
  if (data.pers_data) {
    savePersonalizationData(data.pers_data);
  }
};

// 📍 Funções para step atual
export const saveCurrentStep = (step: number): void => {
  storageManager.save(STORAGE_KEYS.CURRENT_STEP, step);
};

export const getCurrentStep = (): number => {
  const step = storageManager.get(STORAGE_KEYS.CURRENT_STEP);
  return typeof step === 'number' ? step : 1;
};

// 🧹 Função para limpar dados
export const clearSessionData = (): void => {
  storageManager.clear();
};

// Função para limpar todos os dados (alias para compatibilidade)
export const clearAllData = (): void => {
  clearSessionData();
};

// ✅ Função para validar dados antes de salvar
export const validateData = (data: unknown): boolean => {
  try {
    // Validação básica - pode ser expandida
    if (typeof data !== 'object' || data === null) {
      return false;
    }
    
    // Validar se os dados podem ser serializados
    JSON.stringify(data);
    return true;
  } catch (error) {
    console.error('Dados inválidos:', error);
    return false;
  }
};

// 🔍 Função para debug - listar todos os dados
export const debugStorageData = (): void => {
  console.group('🔍 Debug Storage Data');
  console.log('Session Data:', getSessionData());
  console.log('Personalization Data:', getPersonalizationData());
  console.log('Current Step:', getCurrentStep());
  console.log('Complete Data:', getCompleteSessionData());
  console.groupEnd();
};

// 💰 Funções para dados de preços
export const savePricingData = (pricingResult: PricingResult): void => {
  console.group('💰 Saving Pricing Data');
  console.log('Pricing result:', pricingResult);
  
  storageManager.save(STORAGE_KEYS.PRICING_DATA, pricingResult);
  console.groupEnd();
};

export const getPricingData = (): PricingResult | null => {
  const result = storageManager.get(STORAGE_KEYS.PRICING_DATA) as PricingResult | null;
  console.log('💰 Pricing Data Retrieved:', result);
  return result;
};

// 🔄 Recalcular e salvar preços baseado nos dados atuais
export const recalculateAndSavePricing = (locale: string = 'pt'): PricingResult | null => {
  console.group('🔄 Recalculating Pricing');
  
  const persData = getPersonalizationData();
  
  // Usar quantidade_criancas como fonte principal de dados
  const childrenCount = persData.quantidade_criancas || 1;
  const selectedBumps = persData.order_bumps || [];
  const photosCount = persData.fotos?.length || 0;

  console.log('Calculation inputs:', {
    childrenCount,
    selectedBumps,
    photosCount,
    locale,
    persData
  });

  const pricingResult = calculateUserSelectionPricing(
    childrenCount,
    selectedBumps,
    photosCount,
    locale
  );

  savePricingData(pricingResult);
  console.log('Final pricing result:', pricingResult);
  console.groupEnd();

  return pricingResult;
};

// 🎯 Obter preços atualizados (recalcula se necessário)
export const getCurrentPricing = (locale: string = 'pt'): PricingResult | null => {
  let pricingData = getPricingData();
  
  // Se não há dados de preços salvos, recalcular
  if (!pricingData) {
    pricingData = recalculateAndSavePricing(locale);
  }
  
  return pricingData;
};

// 🧹 Limpar dados de preços
export const clearPricingData = (): void => {
  storageManager.remove(STORAGE_KEYS.PRICING_DATA);
  console.log('💰 Pricing data cleared');
};

export default storageManager;