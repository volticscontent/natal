// 📊 Types e Interfaces - Sistema de Personalização

export interface Crianca {
  nome: string;
  foto?: string; // Base64 ou URL da foto da criança
  idade?: number; // Idade da criança (opcional)
  comportamento?: string; // Comportamento da criança (opcional)
}

export interface ContactData {
  nome: string;
  email: string;
  telefone: string;
  cpf?: string | null;     
  cnpj?: string;   // CNPJ opcional para pessoas jurídicas
  pais?: string;   // País para checkout internacional
}

export interface PersData {
  quantidade_criancas: number; // Quantidade de crianças selecionada no Step 1 (1-3)
  children: Crianca[];         // Máximo 3 valores (changed from crianças)
  mensagem: string;            // Mensagem personalizada obrigatória
  incluir_fotos?: boolean;     // Se o order bump de fotos foi selecionado (opcional)
  fotos?: string[];            // URLs das fotos das crianças (opcional)
  photo_urls?: string[];       // URLs das fotos processadas pelo R2 (opcional)
  order_bumps: string[];       // Máximo 4 valores
  observacoes?: string;        // Campo opcional para observações especiais
  contato?: ContactData;       // Dados de contato
}

export interface SessionData {
  session_id: string;          // Gerado via UTM antes da personalização
  user_data: {
    nome: string | null;
    email: string | null;
    telefone: string | null;
    cpf?: string | null;       // CPF opcional para pessoas físicas
    cnpj?: string | null;      // CNPJ opcional para pessoas jurídicas
  }
}

export interface CompleteSessionData extends SessionData {
  pers_data: PersData;
}

// Tipos para os steps
export interface StepProps {
  onNext: (data: Partial<PersData | SessionData>) => void;
  onPrevious?: () => void;
  currentData?: Partial<CompleteSessionData>;
}

// Tipos para checkout
export type CheckoutProvider = 'lastlink' | 'cartpanda';

export interface CheckoutData {
  provider: CheckoutProvider;
  session_data: SessionData;
  pers_data: PersData;
  locale: string;
}

// Tipos para validação
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Tipos para storage
export interface StorageManager {
  save: (key: string, data: unknown) => void;
  get: (key: string) => unknown;
  remove: (key: string) => void;
  clear: () => void;
}

// Constantes
export const LIMITS = {
  MAX_CRIANCAS: 3,
  MAX_FOTOS: 3,
  MAX_ORDER_BUMPS: 4,
} as const;

export const STORAGE_KEYS = {
  SESSION_DATA: 'pers_session_data',
  PERS_DATA: 'pers_personalization_data',
  CURRENT_STEP: 'pers_current_step',
  PRICING_DATA: 'pers_pricing_data',
} as const;

export const CHECKOUT_PROVIDERS = {
  LASTLINK: 'lastlink',
  CARTPANDA: 'cartpanda',
} as const;
