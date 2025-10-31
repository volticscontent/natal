// Sistema de integração com N8N Webhook
import { PersData, ContactData } from '@/components/main/pers/types';
import { generateN8NWebhookToken } from './jwt-auth';

// Interface para o payload do N8N baseado na estrutura do formulário
export interface N8NWebhookPayload {
  // Informações de contato
  informacoes_contato: {
    nome: string;
    email: string;
    telefone: string;
    cpf: string;
  };
  
  // Informações de personalização
  informacoes_pers: {
    criancas: string[]; // Array de nomes (máximo 3)
    fotos: string[] | null; // Array de URLs das fotos ou null
    mensagem: string;
    order_bumps_site: string[]; // Array de order bumps selecionados
  };
  
  // Informações de UTMs e sessão
  informacoes_utms: {
    source?: string;
    campaign?: string;
    medium?: string;
    term?: string;
    content?: string;
    session_id: string; // Nossa sessão personalizada criada no site
    fbclid?: string; // Facebook Click ID
    gclid?: string;  // Google Click ID
    click_id?: string; // Click ID genérico
  };
  
  // Metadados adicionais
  metadata: {
    timestamp: string;
    locale: string;
    total_criancas: number;
    incluir_fotos: boolean;
    prioridade: null | 1; // null = normal, 1 = entrega rápida
  };
}

// Configuração do webhook N8N
export interface N8NWebhookConfig {
  url: string;
  timeout: number;
  retries: number;
}

const defaultConfig: N8NWebhookConfig = {
  url: process.env.N8N_WEBHOOK_URL || '',
  timeout: 25000, // 25 segundos (otimizado para produção)
  retries: 3, // 3 tentativas (balanceado para produção)
};

/**
 * Mapeia IDs dos order bumps para nomes legíveis
 */
function mapOrderBumpIdsToNames(orderBumpIds: string[]): string[] {
  const orderBumpMapping: Record<string, string> = {
    '4k-quality': 'Qualidade 4K',
    'fast-delivery': 'Entrega Rápida',
    'child-photo': 'Foto da Criança',
    'combo-addons': 'Combo Completo (4K + Entrega + Foto)'
  };

  return orderBumpIds.map(id => orderBumpMapping[id] || id);
}

/**
 * Converte dados do formulário para o formato esperado pelo N8N
 */
export function convertToN8NPayload(
  persData: PersData,
  contactData: ContactData,
  sessionId: string,
  utmParams?: Record<string, string>
): N8NWebhookPayload {
  // Extrai nomes das crianças
  const criancasNomes = persData.children.map(child => child.nome);
  
  // Determina prioridade baseada no order bump de entrega rápida
  const prioridade = persData.order_bumps.includes('fast-delivery') ? 1 : null;
  
  // Mapeia order bumps para nomes legíveis
  const orderBumpsNomes = mapOrderBumpIdsToNames(persData.order_bumps);
  
  // Monta payload
  const payload: N8NWebhookPayload = {
    informacoes_contato: {
      nome: contactData.nome,
      email: contactData.email,
      telefone: contactData.telefone,
      cpf: contactData.cpf,
    },
    informacoes_pers: {
      criancas: criancasNomes,
      fotos: persData.fotos && persData.fotos.length > 0 ? persData.fotos : null,
      mensagem: persData.mensagem,
      order_bumps_site: orderBumpsNomes, // Agora envia nomes legíveis
    },
    informacoes_utms: {
      source: utmParams?.utm_source,
      campaign: utmParams?.utm_campaign,
      medium: utmParams?.utm_medium,
      term: utmParams?.utm_term,
      content: utmParams?.utm_content,
      session_id: sessionId,
      fbclid: utmParams?.fbclid,
      gclid: utmParams?.gclid,
      click_id: utmParams?.click_id,
    },
    metadata: {
      timestamp: new Date().toISOString(),
      locale: 'pt', // Pode ser dinâmico futuramente
      total_criancas: persData.quantidade_criancas,
      incluir_fotos: persData.incluir_fotos || false,
      prioridade,
    },
  };
  
  return payload;
}

// Interface para resposta do N8N Webhook
export interface N8NWebhookResponse {
  success?: boolean;
  message?: string;
  data?: Record<string, unknown>;
  error?: string;
}

// Interface para resposta do webhook N8N
export interface N8NWebhookResult {
  success: boolean;
  response?: N8NWebhookResponse;
  error?: string;
}

/**
 * Envia dados para o webhook N8N com autenticação JWT
 */
export async function sendToN8NWebhook(
  payload: N8NWebhookPayload,
  config: N8NWebhookConfig = defaultConfig
): Promise<N8NWebhookResult> {
  const mergedConfig = { ...defaultConfig, ...config };
  
  if (!mergedConfig.url) {
    return {
      success: false,
      error: 'URL do webhook N8N não configurada',
    };
  }

  // Usa circuit breaker para melhorar resiliência
  try {
    return await executeWebhookRequest(payload, mergedConfig);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('?? Falha na execu��o:', errorMessage);
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

async function executeWebhookRequest(
  payload: N8NWebhookPayload,
  config: N8NWebhookConfig
): Promise<N8NWebhookResult> {
  let lastError: Error | null = null;
  
  // Gerar token JWT para autenticação
  let jwtToken: string;
  try {
    jwtToken = await generateN8NWebhookToken(
      payload.informacoes_utms.session_id,
      {
        webhook_url: config.url,
        timestamp: payload.metadata.timestamp,
        locale: payload.metadata.locale,
      }
    );
  } catch (error) {
    throw new Error(`Erro ao gerar token JWT: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
  
  // Tenta enviar com retry
  for (let attempt = 1; attempt <= config.retries; attempt++) {
    try {
      console.log(`🚀 Enviando para N8N (tentativa ${attempt}/${config.retries})...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);
      
      const response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`,
          'User-Agent': 'Recadinhos-Papai-Noel/1.0',
          'X-Webhook-Source': 'recadinhos-papai-noel',
          'X-Session-ID': payload.informacoes_utms.session_id,
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        // Mensagens de erro mais específicas baseadas no status HTTP
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        switch (response.status) {
          case 404:
            errorMessage = 'Webhook N8N não encontrado. Verifique se o webhook está configurado corretamente no servidor N8N.';
            break;
          case 500:
            errorMessage = 'Erro interno no servidor N8N. Tente novamente em alguns minutos.';
            break;
          case 502:
          case 503:
          case 504:
            errorMessage = 'Servidor N8N temporariamente indisponível. Tente novamente em alguns minutos.';
            break;
          case 401:
          case 403:
            errorMessage = 'Erro de autenticação com o servidor N8N.';
            break;
          case 429:
            errorMessage = 'Muitas requisições. Aguarde um momento e tente novamente.';
            break;
          default:
            if (response.status >= 400 && response.status < 500) {
              errorMessage = 'Erro na requisição para o servidor N8N. Verifique os dados e tente novamente.';
            } else if (response.status >= 500) {
              errorMessage = 'Erro no servidor N8N. Tente novamente em alguns minutos.';
            }
        }
        
        throw new Error(errorMessage);
      }
      
      const responseData = await response.json();
      
      return {
        success: true,
        response: responseData,
      };
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Erro desconhecido');
      
      // DEBUG: Log do erro original para investigação
      console.error(`🔍 ERRO ORIGINAL (tentativa ${attempt}):`, {
        message: lastError.message,
        name: lastError.name,
        stack: lastError.stack,
        cause: lastError.cause
      });
      
      // Melhorar mensagens de erro baseadas no tipo de erro
      let errorMessage = lastError.message;
      
      if (errorMessage.includes('fetch failed') || errorMessage.includes('Failed to fetch')) {
        errorMessage = 'Falha na conexão com o servidor N8N. Verifique sua conexão com a internet.';
      } else if (errorMessage.includes('timeout') || errorMessage.includes('aborted')) {
        errorMessage = 'Timeout na conexão com o servidor N8N. Tente novamente.';
      } else if (errorMessage.includes('network') || errorMessage.includes('NetworkError')) {
        errorMessage = 'Erro de rede ao conectar com o servidor N8N.';
      } else if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('DNS')) {
        errorMessage = 'Não foi possível encontrar o servidor N8N. Verifique a configuração.';
      }
      
      lastError = new Error(errorMessage);
      
      console.warn(`Tentativa ${attempt}/${config.retries} falhou:`, lastError.message);
      
      // Se não é a última tentativa, aguarda antes de tentar novamente
      if (attempt < config.retries) {
        // Backoff exponencial com jitter para evitar thundering herd
        const baseDelay = 1000; // 1 segundo base
        const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 500; // Até 500ms de jitter
        const totalDelay = Math.min(exponentialDelay + jitter, 10000); // Máximo 10s
        
        console.log(`⏳ Aguardando ${Math.round(totalDelay)}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, totalDelay));
      }
    }
  }
  
  throw new Error(`Falha após ${config.retries} tentativas: ${lastError?.message}`);
}

/**
 * Função de conveniência que combina conversão e envio
 */
export async function processAndSendToN8N(
  persData: PersData,
  contactData: ContactData,
  sessionId: string,
  utmParams?: Record<string, string>,
  config?: N8NWebhookConfig
): Promise<{
  success: boolean;
  payload?: N8NWebhookPayload;
  response?: N8NWebhookResponse;
  error?: string;
}> {
  try {
    // Converte dados para formato N8N
    const payload = convertToN8NPayload(persData, contactData, sessionId, utmParams);
    
    // Envia para N8N
    const result = await sendToN8NWebhook(payload, config);
    
    return {
      success: result.success,
      payload,
      response: result.response,
      error: result.error,
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro na conversão dos dados',
    };
  }
}

/**
 * Valida se os dados estão completos para envio ao N8N
 */
export function validateN8NData(
  persData: PersData,
  contactData: ContactData
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validar dados de contato
  if (!contactData.nome?.trim()) {
    errors.push('Nome é obrigatório');
  }
  
  if (!contactData.email?.trim()) {
    errors.push('Email é obrigatório');
  }
  
  if (!contactData.telefone?.trim()) {
    errors.push('Telefone é obrigatório');
  }
  
  if (!contactData.cpf?.trim()) {
    errors.push('CPF é obrigatório');
  }
  
  // Validar dados de personalização
  if (!persData.children || persData.children.length === 0) {
    errors.push('Pelo menos uma criança deve ser adicionada');
  }
  
  if (persData.children.length > 3) {
    errors.push('Máximo de 3 crianças permitidas');
  }
  
  // Validar nomes das crianças
  persData.children.forEach((child, index) => {
    if (!child.nome?.trim()) {
      errors.push(`Nome da criança ${index + 1} é obrigatório`);
    }
  });
  
  if (!persData.mensagem?.trim()) {
    errors.push('Mensagem personalizada é obrigatória');
  }
  
  // Validar fotos se order bump selecionado
  if (persData.incluir_fotos && (!persData.fotos || persData.fotos.length === 0)) {
    errors.push('Fotos são obrigatórias quando o order bump de fotos está selecionado');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

