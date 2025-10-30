/**
 * 🔍 Sistema de Validação Centralizado
 * Validações para todos os campos da tabela de personalização
 */

import { PersData, ContactData, Crianca } from '../types';
import { 
  validateAllArrays, 
  ArraysValidationSummary,
  checkArraysSync 
} from './arrayValidation';

// ===== INTERFACES DE VALIDAÇÃO =====

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface FieldValidation {
  field: string;
  value: unknown;
  required: boolean;
  rules?: ValidationRule[];
}

export interface ValidationRule {
  type: 'minLength' | 'maxLength' | 'pattern' | 'range' | 'custom';
  value?: unknown;
  message: string;
  validator?: (value: unknown) => boolean;
}

export interface CompleteValidationResult extends ValidationResult {
  arrays?: ArraysValidationSummary;
  sync?: { synced: boolean; issues: string[] };
  fieldValidations?: { [key: string]: ValidationResult };
}

// ===== REGRAS DE VALIDAÇÃO =====

const VALIDATION_RULES = {
  // Dados de Contato
  nome: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-ZÀ-ÿ\s]+$/,
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    maxLength: 255,
  },
  telefone: {
    required: true,
    minLength: 10,
    maxLength: 15,
    pattern: /^\+?[\d\s\-\(\)]+$/,
  },
  cpf: {
    required: false, // Obrigatório apenas para Brasil
    pattern: /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/,
    length: 11, // Após limpeza
  },

  // Dados das Crianças
  crianca_nome: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-ZÀ-ÿ\s]+$/,
  },
  crianca_idade: {
    required: false,
    min: 1,
    max: 12,
  },
  crianca_comportamento: {
    required: false,
    maxLength: 500,
  },

  // Personalização
  mensagem: {
    required: true,
    minLength: 10,
    maxLength: 1000,
  },
  quantidade_criancas: {
    required: true,
    min: 1,
    max: 3,
  },

  // Fotos
  fotos: {
    required: false,
    maxCount: 10,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
  },

  // Session
  session_id: {
    required: true,
    minLength: 10,
  },
} as const;

// ===== VALIDADORES ESPECÍFICOS =====

/**
 * Valida CPF brasileiro
 */
export const validateCPF = (cpf: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!cpf || !cpf.trim()) {
    return { valid: false, errors: ['CPF é obrigatório'] };
  }

  // Limpar CPF
  const cpfClean = cpf.replace(/\D/g, '');
  
  // Verificar tamanho
  if (cpfClean.length !== 11) {
    errors.push('CPF deve ter 11 dígitos');
  }

  // Verificar se não são todos iguais
  if (/^(\d)\1{10}$/.test(cpfClean)) {
    errors.push('CPF inválido');
  }

  // Validação matemática do CPF
  if (errors.length === 0) {
    let sum = 0;
    let remainder;

    // Primeiro dígito verificador
    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cpfClean.substring(i - 1, i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpfClean.substring(9, 10))) {
      errors.push('CPF inválido');
    }

    // Segundo dígito verificador
    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cpfClean.substring(i - 1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpfClean.substring(10, 11))) {
      errors.push('CPF inválido');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Valida telefone por região
 */
export const validatePhone = (phone: string, locale: string = 'pt'): ValidationResult => {
  const errors: string[] = [];
  
  if (!phone || !phone.trim()) {
    return { valid: false, errors: ['Telefone é obrigatório'] };
  }

  const phoneClean = phone.replace(/\D/g, '');

  if (locale === 'pt') {
    // Validação para Brasil
    if (phoneClean.length < 10 || phoneClean.length > 11) {
      errors.push('Telefone deve ter 10 ou 11 dígitos');
    }
    
    // Verificar se começa com código de área válido
    const areaCode = phoneClean.substring(0, 2);
    const validAreaCodes = ['11', '12', '13', '14', '15', '16', '17', '18', '19', '21', '22', '24', '27', '28', '31', '32', '33', '34', '35', '37', '38', '41', '42', '43', '44', '45', '46', '47', '48', '49', '51', '53', '54', '55', '61', '62', '63', '64', '65', '66', '67', '68', '69', '71', '73', '74', '75', '77', '79', '81', '82', '83', '84', '85', '86', '87', '88', '89', '91', '92', '93', '94', '95', '96', '97', '98', '99'];
    
    if (!validAreaCodes.includes(areaCode)) {
      errors.push('Código de área inválido');
    }
  } else {
    // Validação internacional
    if (phoneClean.length < 7 || phoneClean.length > 15) {
      errors.push('Phone number must be between 7 and 15 digits');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Valida email
 */
export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!email || !email.trim()) {
    return { valid: false, errors: ['Email é obrigatório'] };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push('Email inválido');
  }

  if (email.length > 255) {
    errors.push('Email muito longo');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Valida dados de uma criança
 */
export const validateChild = (child: Crianca, index: number): ValidationResult => {
  const errors: string[] = [];
  
  // Nome obrigatório
  if (!child.nome || !child.nome.trim()) {
    errors.push(`Nome da criança ${index + 1} é obrigatório`);
  } else {
    if (child.nome.length < 2) {
      errors.push(`Nome da criança ${index + 1} muito curto`);
    }
    if (child.nome.length > 50) {
      errors.push(`Nome da criança ${index + 1} muito longo`);
    }
    if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(child.nome)) {
      errors.push(`Nome da criança ${index + 1} contém caracteres inválidos`);
    }
  }

  // Idade opcional, mas se preenchida deve ser válida
  if (child.idade !== undefined && child.idade !== null) {
    if (child.idade < 1 || child.idade > 12) {
      errors.push(`Idade da criança ${index + 1} deve ser entre 1 e 12 anos`);
    }
  }

  // Comportamento opcional
  if (child.comportamento && child.comportamento.length > 500) {
    errors.push(`Descrição do comportamento da criança ${index + 1} muito longa`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Valida dados de contato
 */
export const validateContactData = (contactData: ContactData, locale: string = 'pt'): ValidationResult => {
  const errors: string[] = [];

  // Validar nome
  const nameValidation = validateField(contactData.nome, 'nome');
  errors.push(...nameValidation.errors);

  // Validar email
  const emailValidation = validateEmail(contactData.email);
  errors.push(...emailValidation.errors);

  // Validar telefone
  const phoneValidation = validatePhone(contactData.telefone, locale);
  errors.push(...phoneValidation.errors);

  // CPF removido - não é mais obrigatório

  return {
    valid: errors.length === 0,
    errors,
  };
};

// ===== VALIDAÇÃO COMPLETA DOS DADOS =====

/**
 * Validação completa dos dados de personalização
 * Inclui validação dos 3 arrays principais + campos individuais + sincronização
 */
export const validateCompletePersonalizationData = (
  persData: PersData,
  contactData?: ContactData
): CompleteValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Validar os 3 arrays principais
  const arraysValidation = validateAllArrays(persData);
  if (!arraysValidation.overall.valid) {
    errors.push(...arraysValidation.children.errors);
    errors.push(...arraysValidation.order_bumps.errors);
    errors.push(...arraysValidation.fotos.errors);
  }

  // 2. Validar campos individuais
  const fieldValidations: { [key: string]: ValidationResult } = {};

  // Validar quantidade de crianças
  const quantityValidation = validateField(persData.quantidade_criancas, 'quantidade_criancas');
  fieldValidations.quantidade_criancas = quantityValidation;
  if (!quantityValidation.valid) {
    errors.push(...quantityValidation.errors);
  }

  // Validar mensagem
  if (persData.mensagem) {
    const messageValidation = validateField(persData.mensagem, 'mensagem');
    fieldValidations.mensagem = messageValidation;
    if (!messageValidation.valid) {
      errors.push(...messageValidation.errors);
    }
  }

  // Validar dados de contato se fornecidos
  if (contactData) {
    const contactValidation = validateContactData(contactData);
    fieldValidations.contactData = contactValidation;
    if (!contactValidation.valid) {
      errors.push(...contactValidation.errors);
    }
  }

  // 3. Verificar sincronização entre arrays
  const syncCheck = checkArraysSync(persData);
  if (!syncCheck.synced) {
    errors.push(...syncCheck.issues);
  }

  // 4. Coletar warnings
  if (arraysValidation.children.warnings) warnings.push(...arraysValidation.children.warnings);
  if (arraysValidation.order_bumps.warnings) warnings.push(...arraysValidation.order_bumps.warnings);
  if (arraysValidation.fotos.warnings) warnings.push(...arraysValidation.fotos.warnings);

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
    arrays: arraysValidation,
    sync: syncCheck,
    fieldValidations,
  };
};

/**
 * Validação rápida apenas dos arrays
 */
export const validateArraysOnly = (persData: PersData): ArraysValidationSummary => {
  return validateAllArrays(persData);
};

/**
 * Validação para checkout - mais rigorosa
 */
export const validateForCompleteCheckout = (
  persData: PersData,
  contactData: ContactData,
  provider: 'lastlink' | 'cartpanda'
): CompleteValidationResult => {
  const result = validateCompletePersonalizationData(persData, contactData);
  
  // Validações adicionais para checkout
  const additionalErrors: string[] = [];

  // Dados de contato obrigatórios para checkout
  if (!contactData.nome || !contactData.email) {
    additionalErrors.push('Nome e email são obrigatórios para checkout');
  }

  // Validações específicas por provider
  if (provider === 'lastlink') {
    if (!contactData.cpf) {
      additionalErrors.push('CPF é obrigatório para checkout no Brasil');
    }
    if (!contactData.telefone) {
      additionalErrors.push('Telefone é obrigatório para checkout no Brasil');
    }
  }

  if (provider === 'cartpanda') {
    if (!contactData.pais) {
      additionalErrors.push('País é obrigatório para checkout internacional');
    }
  }

  // Pelo menos uma criança deve estar cadastrada
  if (!persData.children || persData.children.length === 0) {
    additionalErrors.push('Pelo menos uma criança deve ser cadastrada');
  }

  return {
    ...result,
    valid: result.valid && additionalErrors.length === 0,
    errors: [...result.errors, ...additionalErrors],
  };
};

/**
 * Valida dados de personalização (mantido para compatibilidade)
 */
export const validatePersData = (persData: PersData): ValidationResult => {
  const errors: string[] = [];

  // Validar quantidade de crianças
  if (!persData.quantidade_criancas || persData.quantidade_criancas < 1 || persData.quantidade_criancas > 3) {
    errors.push('Quantidade de crianças deve ser entre 1 e 3');
  }

  // Validar se há crianças cadastradas
  if (!persData.children || persData.children.length === 0) {
    errors.push('Pelo menos uma criança deve ser adicionada');
  } else {
    // Validar cada criança
    persData.children.forEach((child, index) => {
      const childValidation = validateChild(child, index);
      errors.push(...childValidation.errors);
    });

    // Verificar se quantidade bate com crianças cadastradas
    if (persData.children.length !== persData.quantidade_criancas) {
      errors.push('Quantidade de crianças não confere com as cadastradas');
    }
  }

  // Validar mensagem
  if (!persData.mensagem || !persData.mensagem.trim()) {
    errors.push('Mensagem personalizada é obrigatória');
  } else {
    if (persData.mensagem.length < 10) {
      errors.push('Mensagem muito curta (mínimo 10 caracteres)');
    }
    if (persData.mensagem.length > 1000) {
      errors.push('Mensagem muito longa (máximo 1000 caracteres)');
    }
  }

  // ===== VALIDAÇÕES DOS 3 ARRAYS PRINCIPAIS =====
  
  // 1. ARRAY DE CRIANÇAS (children)
  if (persData.children && persData.children.length > 3) {
    errors.push('Máximo de 3 crianças permitidas');
  }

  // 2. ARRAY DE ORDER BUMPS (order_bumps)
  if (persData.order_bumps && persData.order_bumps.length > 0) {
    const validOrderBumps = ['4k', 'fastDelivery', 'photo', 'combo'];
    const invalidBumps = persData.order_bumps.filter(bump => !validOrderBumps.includes(bump));
    if (invalidBumps.length > 0) {
      errors.push(`Order bumps inválidos: ${invalidBumps.join(', ')}`);
    }
  }

  // 3. ARRAY DE FOTOS (fotos)
  if (persData.fotos && persData.fotos.length > 0) {
    // Validar quantidade máxima
    if (persData.fotos.length > 10) {
      errors.push('Máximo de 10 fotos permitidas');
    }

    // Validar URLs das fotos
    persData.fotos.forEach((foto, index) => {
      if (!foto || typeof foto !== 'string') {
        errors.push(`Foto ${index + 1} inválida`);
      } else {
        try {
          new URL(foto);
        } catch {
          errors.push(`URL da foto ${index + 1} inválida`);
        }
      }
    });
  }

  // Validar fotos se order bump selecionado
  if (persData.incluir_fotos && (!persData.fotos || persData.fotos.length === 0)) {
    errors.push('Fotos são obrigatórias quando o order bump de fotos está selecionado');
  }

  // Validar se order bump "photo" está selecionado mas não há fotos
  if (persData.order_bumps?.includes('photo') && (!persData.fotos || persData.fotos.length === 0)) {
    errors.push('Order bump "photo" selecionado mas nenhuma foto foi adicionada');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validação genérica de campo
 */
export const validateField = (value: unknown, fieldName: keyof typeof VALIDATION_RULES): ValidationResult => {
  const errors: string[] = [];
  const rules = VALIDATION_RULES[fieldName];

  if (!rules) {
    return { valid: true, errors: [] };
  }

  // Verificar se é obrigatório
  if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
    errors.push(`${fieldName} é obrigatório`);
    return { valid: false, errors };
  }

  // Se não é obrigatório e está vazio, não validar outras regras
  if (!rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
    return { valid: true, errors: [] };
  }

  // Validar comprimento mínimo
  if ('minLength' in rules && typeof value === 'string' && value.length < rules.minLength!) {
    errors.push(`${fieldName} deve ter pelo menos ${rules.minLength} caracteres`);
  }

  // Validar comprimento máximo
  if ('maxLength' in rules && typeof value === 'string' && value.length > rules.maxLength!) {
    errors.push(`${fieldName} deve ter no máximo ${rules.maxLength} caracteres`);
  }

  // Validar padrão
  if ('pattern' in rules && typeof value === 'string' && !rules.pattern!.test(value)) {
    errors.push(`${fieldName} tem formato inválido`);
  }

  // Validar faixa numérica
  if ('min' in rules && typeof value === 'number' && value < rules.min!) {
    errors.push(`${fieldName} deve ser pelo menos ${rules.min}`);
  }

  if ('max' in rules && typeof value === 'number' && value > rules.max!) {
    errors.push(`${fieldName} deve ser no máximo ${rules.max}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validação completa para checkout
 */
export const validateForCheckout = (
  persData: PersData,
  contactData: ContactData,
  locale: string = 'pt'
): ValidationResult => {
  const errors: string[] = [];

  // Validar dados de personalização
  const persValidation = validatePersData(persData);
  errors.push(...persValidation.errors);

  // Validar dados de contato
  const contactValidation = validateContactData(contactData, locale);
  errors.push(...contactValidation.errors);

  // Validações específicas para checkout
  if (!persData.children || persData.children.length === 0) {
    errors.push('Pelo menos uma criança deve ser adicionada para o checkout');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validação por provider de checkout
 */
export const validateByProvider = (
  persData: PersData,
  contactData: ContactData,
  provider: 'lastlink' | 'cartpanda'
): ValidationResult => {
  const locale = provider === 'lastlink' ? 'pt' : 'en';
  
  // Validação base
  const baseValidation = validateForCheckout(persData, contactData, locale);
  
  if (!baseValidation.valid) {
    return baseValidation;
  }

  const errors: string[] = [];

  // Validações específicas por provider
  if (provider === 'lastlink') {
    // CPF obrigatório para LastLink
    if (!contactData.cpf) {
      errors.push('CPF é obrigatório para checkout brasileiro');
    }
  }

  if (provider === 'cartpanda') {
    // Validações específicas para CartPanda se necessário
    // Por enquanto, usa as validações base
  }

  return {
    valid: errors.length === 0,
    errors: [...baseValidation.errors, ...errors],
  };
};

// ===== UTILITÁRIOS =====

/**
 * Limpa string removendo caracteres especiais
 */
export const cleanString = (str: string): string => {
  return str.replace(/[^\w\s]/gi, '').trim();
};

/**
 * Limpa números removendo caracteres não numéricos
 */
export const cleanNumbers = (str: string): string => {
  return str.replace(/\D/g, '');
};

/**
 * Formata CPF
 */
export const formatCPF = (cpf: string): string => {
  const clean = cleanNumbers(cpf);
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

/**
 * Formata telefone brasileiro
 */
export const formatPhone = (phone: string): string => {
  const clean = cleanNumbers(phone);
  if (clean.length === 11) {
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (clean.length === 10) {
    return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
};

const validationUtils = {
  validateCPF,
  validatePhone,
  validateEmail,
  validateChild,
  validateContactData,
  validatePersData,
  validateField,
  validateForCheckout,
  validateByProvider,
  cleanString,
  cleanNumbers,
  formatCPF,
  formatPhone,
};

export default validationUtils;