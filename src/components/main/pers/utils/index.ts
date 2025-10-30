/**
 * 🔧 Utilitários de Validação - Personalização
 * Exportações centralizadas para todas as validações
 */

import type { ValidationResult, CompleteValidationResult } from './validation';

// ===== VALIDAÇÕES PRINCIPAIS =====
export type {
  // Interfaces
  ValidationResult,
  FieldValidation,
  ValidationRule,
  CompleteValidationResult,
} from './validation';

export {
  // Validações individuais
  validateField,
  validateContactData,
  validateChild,
  validatePersData,
  
  // Validações completas
  validateCompletePersonalizationData,
  validateArraysOnly,
  validateForCompleteCheckout,
  
  // Validações por provider
  validateForCheckout,
  validateByProvider,
  
  // Utilitários
  cleanString,
  cleanNumbers,
  formatCPF,
  formatPhone,
  
  // Validações específicas
  validateCPF,
  validatePhone,
  validateEmail,
} from './validation';

// ===== VALIDAÇÕES DOS ARRAYS =====
export type {
  // Interfaces dos arrays
  ArrayValidationResult,
  ArraysValidationSummary,
} from './arrayValidation';

export {
  // Validações específicas dos arrays
  validateChildrenArray,
  validateOrderBumpsArray,
  validateFotosArray,
  validateAllArrays,
  
  // Utilitários dos arrays
  extractChildrenNames,
  getArraysCounts,
  checkArraysSync,
  
  // Constantes dos arrays
  VALID_ORDER_BUMPS,
  ARRAY_LIMITS,
} from './arrayValidation';

// ===== VALIDAÇÕES RÁPIDAS =====

/**
 * Validação rápida para verificar se dados básicos estão OK
 */
export const quickValidation = {
  /**
   * Verifica se pelo menos uma criança está cadastrada
   */
  hasChildren: (persData: unknown): boolean => {
    const data = persData as { children?: unknown[] };
    return Boolean(data?.children && Array.isArray(data.children) && data.children.length > 0);
  },

  /**
   * Verifica se dados de contato básicos estão preenchidos
   */
  hasBasicContact: (contactData: unknown): boolean => {
    const data = contactData as { nome?: string; email?: string };
    return Boolean(data?.nome && data?.email);
  },

  /**
   * Verifica se order bumps são válidos
   */
  hasValidOrderBumps: (orderBumps: unknown): boolean => {
    if (!orderBumps || !Array.isArray(orderBumps)) return true; // Opcional
    const validBumps = ['4k', 'fastDelivery', 'photo', 'combo', 'priority', 'express'];
    return orderBumps.every(bump => validBumps.includes(bump as string));
  },

  /**
   * Verifica se fotos são necessárias e estão presentes
   */
  hasRequiredPhotos: (persData: unknown): boolean => {
    const data = persData as { order_bumps?: string[]; fotos?: unknown[] };
    const needsPhotos = data?.order_bumps?.includes('photo') || data?.order_bumps?.includes('combo');
    if (!needsPhotos) return true;
    return Boolean(data?.fotos && Array.isArray(data.fotos) && data.fotos.length > 0);
  },
};

// ===== HELPERS DE VALIDAÇÃO =====

/**
 * Converte resultado de validação para mensagem amigável
 */
export const getValidationMessage = (result: ValidationResult): string => {
  if (result.valid) {
    return 'Dados válidos ✅';
  }
  
  if (result.errors.length === 1) {
    return result.errors[0];
  }
  
  return `${result.errors.length} erros encontrados: ${result.errors.join(', ')}`;
};

/**
 * Conta total de erros em validação completa
 */
export const countTotalErrors = (result: CompleteValidationResult): number => {
  let total = result.errors.length;
  
  if (result.arrays) {
    total += result.arrays.children.errors.length;
    total += result.arrays.order_bumps.errors.length;
    total += result.arrays.fotos.errors.length;
  }
  
  return total;
};

/**
 * Extrai apenas os primeiros erros (para UI)
 */
export const getFirstErrors = (result: CompleteValidationResult, limit: number = 3): string[] => {
  const allErrors: string[] = [];
  
  // Erros principais
  allErrors.push(...result.errors);
  
  // Erros dos arrays
  if (result.arrays) {
    allErrors.push(...result.arrays.children.errors);
    allErrors.push(...result.arrays.order_bumps.errors);
    allErrors.push(...result.arrays.fotos.errors);
  }
  
  return allErrors.slice(0, limit);
};

// ===== EXPORT DEFAULT =====
const validationIndex = {
  // Validações rápidas
  quickValidation,
  
  // Helpers
  getValidationMessage,
  countTotalErrors,
  getFirstErrors,
};

export default validationIndex;