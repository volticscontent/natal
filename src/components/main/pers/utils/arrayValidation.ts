/**
 * 🔍 Validações Específicas dos 3 Arrays Principais
 * Sistema de validação focado nos arrays: children, order_bumps, fotos
 */

import { PersData, Crianca } from '../types';

// ===== INTERFACES =====

export interface ArrayValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
  arrayName: string;
  count: number;
}

export interface ArraysValidationSummary {
  children: ArrayValidationResult;
  order_bumps: ArrayValidationResult;
  fotos: ArrayValidationResult;
  overall: {
    valid: boolean;
    totalErrors: number;
    summary: string;
  };
}

// ===== CONSTANTES =====

export const ARRAY_LIMITS = {
  children: {
    min: 1,
    max: 3,
  },
  order_bumps: {
    min: 0,
    max: 10, // Sem limite prático, mas para validação
  },
  fotos: {
    min: 0,
    max: 10,
  },
} as const;

export const VALID_ORDER_BUMPS = [
  '4k',           // Vídeo em 4K
  'fastDelivery', // Entrega rápida  
  'photo',        // Inclusão de fotos
  'combo',        // Combo completo
  'priority',     // Prioridade alta
  'express',      // Entrega expressa
] as const;

// ===== VALIDADORES DOS ARRAYS =====

/**
 * 1. Valida Array de Crianças
 */
export const validateChildrenArray = (children: Crianca[] | undefined): ArrayValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const count = children?.length || 0;

  // Verificar se existe
  if (!children || !Array.isArray(children)) {
    return {
      valid: false,
      errors: ['Array de crianças não encontrado'],
      arrayName: 'children',
      count: 0,
    };
  }

  // Verificar limites
  if (count < ARRAY_LIMITS.children.min) {
    errors.push(`Mínimo de ${ARRAY_LIMITS.children.min} criança(s) obrigatória(s)`);
  }

  if (count > ARRAY_LIMITS.children.max) {
    errors.push(`Máximo de ${ARRAY_LIMITS.children.max} crianças permitidas`);
  }

  // Validar cada criança
  children.forEach((child, index) => {
    const childNumber = index + 1;

    // Nome obrigatório
    if (!child.nome || !child.nome.trim()) {
      errors.push(`Nome da criança ${childNumber} é obrigatório`);
    } else {
      // Validar formato do nome
      if (child.nome.length < 2) {
        errors.push(`Nome da criança ${childNumber} muito curto (mínimo 2 caracteres)`);
      }
      
      if (child.nome.length > 50) {
        errors.push(`Nome da criança ${childNumber} muito longo (máximo 50 caracteres)`);
      }

      if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(child.nome)) {
        errors.push(`Nome da criança ${childNumber} contém caracteres inválidos`);
      }
    }

    // Idade opcional, mas se preenchida deve ser válida
    if (child.idade !== undefined && child.idade !== null) {
      if (typeof child.idade !== 'number' || child.idade < 1 || child.idade > 12) {
        errors.push(`Idade da criança ${childNumber} deve ser entre 1 e 12 anos`);
      }
    }

    // Comportamento opcional
    if (child.comportamento && child.comportamento.length > 500) {
      warnings.push(`Descrição do comportamento da criança ${childNumber} muito longa`);
    }
  });

  // Verificar nomes duplicados
  const names = children.map(c => c.nome?.toLowerCase().trim()).filter(Boolean);
  const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
  if (duplicates.length > 0) {
    errors.push(`Nomes duplicados encontrados: ${duplicates.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    arrayName: 'children',
    count,
  };
};

/**
 * 2. Valida Array de Order Bumps
 */
export const validateOrderBumpsArray = (order_bumps: string[] | undefined): ArrayValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const count = order_bumps?.length || 0;

  // Array pode estar vazio (opcional)
  if (!order_bumps || !Array.isArray(order_bumps)) {
    return {
      valid: true,
      errors: [],
      arrayName: 'order_bumps',
      count: 0,
    };
  }

  // Verificar limites
  if (count > ARRAY_LIMITS.order_bumps.max) {
    errors.push(`Máximo de ${ARRAY_LIMITS.order_bumps.max} order bumps permitidos`);
  }

  // Validar cada order bump
  order_bumps.forEach((bump, index) => {
    if (!bump || typeof bump !== 'string') {
      errors.push(`Order bump ${index + 1} inválido`);
      return;
    }

    if (!VALID_ORDER_BUMPS.includes(bump as (typeof VALID_ORDER_BUMPS)[number])) {
      errors.push(`Order bump "${bump}" não é válido. Válidos: ${VALID_ORDER_BUMPS.join(', ')}`);
    }
  });

  // Verificar duplicatas
  const duplicates = order_bumps.filter((bump, index) => order_bumps.indexOf(bump) !== index);
  if (duplicates.length > 0) {
    errors.push(`Order bumps duplicados: ${duplicates.join(', ')}`);
  }

  // Validações de lógica de negócio
  if (order_bumps.includes('combo') && order_bumps.length > 1) {
    warnings.push('Order bump "combo" geralmente substitui outros order bumps');
  }

  if (order_bumps.includes('photo') && order_bumps.includes('combo')) {
    warnings.push('Order bump "photo" já está incluído no "combo"');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    arrayName: 'order_bumps',
    count,
  };
};

/**
 * 3. Valida Array de Fotos
 */
export const validateFotosArray = (fotos: string[] | undefined, order_bumps?: string[]): ArrayValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const count = fotos?.length || 0;

  // Verificar se fotos são obrigatórias
  const photosRequired = order_bumps?.includes('photo') || order_bumps?.includes('combo');

  if (photosRequired && (!fotos || fotos.length === 0)) {
    return {
      valid: false,
      errors: ['Fotos são obrigatórias quando order bump "photo" ou "combo" está selecionado'],
      arrayName: 'fotos',
      count: 0,
    };
  }

  // Se não há fotos e não são obrigatórias, está OK
  if (!fotos || !Array.isArray(fotos) || fotos.length === 0) {
    return {
      valid: true,
      errors: [],
      arrayName: 'fotos',
      count: 0,
    };
  }

  // Verificar limites
  if (count > ARRAY_LIMITS.fotos.max) {
    errors.push(`Máximo de ${ARRAY_LIMITS.fotos.max} fotos permitidas`);
  }

  // Validar cada foto
  fotos.forEach((foto, index) => {
    const fotoNumber = index + 1;

    if (!foto || typeof foto !== 'string') {
      errors.push(`Foto ${fotoNumber} inválida`);
      return;
    }

    // Validar URL
    try {
      const url = new URL(foto);
      
      // Verificar se é HTTPS (recomendado)
      if (url.protocol !== 'https:') {
        warnings.push(`Foto ${fotoNumber}: recomendado usar HTTPS`);
      }

      // Verificar domínio (se for R2 Cloudflare)
      if (url.hostname.includes('r2.dev') || url.hostname.includes('cloudflare')) {
        // OK, é do nosso storage
      } else {
        warnings.push(`Foto ${fotoNumber}: URL externa detectada`);
      }

    } catch {
      errors.push(`Foto ${fotoNumber}: URL inválida`);
    }

    // Verificar extensão da imagem
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const hasValidExtension = validExtensions.some(ext => 
      foto.toLowerCase().includes(ext)
    );
    
    if (!hasValidExtension) {
      warnings.push(`Foto ${fotoNumber}: formato pode não ser suportado`);
    }
  });

  // Verificar duplicatas
  const duplicates = fotos.filter((foto, index) => fotos.indexOf(foto) !== index);
  if (duplicates.length > 0) {
    errors.push(`URLs de fotos duplicadas encontradas`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    arrayName: 'fotos',
    count,
  };
};

// ===== VALIDAÇÃO COMPLETA DOS 3 ARRAYS =====

/**
 * Valida todos os 3 arrays principais
 */
export const validateAllArrays = (persData: PersData): ArraysValidationSummary => {
  // Validar cada array
  const childrenValidation = validateChildrenArray(persData.children);
  const orderBumpsValidation = validateOrderBumpsArray(persData.order_bumps);
  const fotosValidation = validateFotosArray(persData.fotos, persData.order_bumps);

  // Calcular resultado geral
  const totalErrors = 
    childrenValidation.errors.length + 
    orderBumpsValidation.errors.length + 
    fotosValidation.errors.length;

  const overallValid = totalErrors === 0;

  // Gerar resumo
  let summary = `Arrays validados: `;
  summary += `${childrenValidation.count} criança(s), `;
  summary += `${orderBumpsValidation.count} order bump(s), `;
  summary += `${fotosValidation.count} foto(s)`;

  if (!overallValid) {
    summary += ` - ${totalErrors} erro(s) encontrado(s)`;
  }

  return {
    children: childrenValidation,
    order_bumps: orderBumpsValidation,
    fotos: fotosValidation,
    overall: {
      valid: overallValid,
      totalErrors,
      summary,
    },
  };
};

// ===== UTILITÁRIOS =====

/**
 * Extrai apenas os nomes das crianças (para N8N)
 */
export const extractChildrenNames = (children: Crianca[]): string[] => {
  return children
    .filter(child => child.nome && child.nome.trim())
    .map(child => child.nome.trim());
};

/**
 * Conta total de itens nos arrays
 */
export const getArraysCounts = (persData: PersData) => {
  return {
    children: persData.children?.length || 0,
    order_bumps: persData.order_bumps?.length || 0,
    fotos: persData.fotos?.length || 0,
    total: (persData.children?.length || 0) + 
           (persData.order_bumps?.length || 0) + 
           (persData.fotos?.length || 0),
  };
};

/**
 * Verifica se arrays estão sincronizados
 */
export const checkArraysSync = (persData: PersData): { synced: boolean; issues: string[] } => {
  const issues: string[] = [];

  // Verificar se quantidade de crianças bate
  if (persData.quantidade_criancas !== persData.children?.length) {
    issues.push(`Quantidade declarada (${persData.quantidade_criancas}) não bate com crianças cadastradas (${persData.children?.length || 0})`);
  }

  // Verificar se order bump "photo" bate com presença de fotos
  const hasPhotoOrderBump = persData.order_bumps?.includes('photo');
  const hasPhotos = persData.fotos && persData.fotos.length > 0;

  if (hasPhotoOrderBump && !hasPhotos) {
    issues.push('Order bump "photo" selecionado mas nenhuma foto adicionada');
  }

  if (!hasPhotoOrderBump && hasPhotos) {
    issues.push('Fotos adicionadas mas order bump "photo" não selecionado');
  }

  return {
    synced: issues.length === 0,
    issues,
  };
};

const arrayValidationUtils = {
  validateChildrenArray,
  validateOrderBumpsArray,
  validateFotosArray,
  validateAllArrays,
  extractChildrenNames,
  getArraysCounts,
  checkArraysSync,
  VALID_ORDER_BUMPS,
  ARRAY_LIMITS,
};

export default arrayValidationUtils;