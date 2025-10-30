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
  timeout: 10000, // 10 segundos
  retries: 3,
};

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
  const prioridade = persData.order_bumps.includes('entrega_rapida') ? 1 : null;
  
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
      order_bumps_site: persData.order_bumps,
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

// Interface para resposta do webhook N8N
interface N8NWebhookResponse {
  success?: boolean;
  message?: string;
  data?: Record<string, unknown>;
  error?: string;
}

/**
 * Envia dados para o webhook N8N com autenticação JWT
 */
export async function sendToN8NWebhook(
  payload: N8NWebhookPayload,
  config: N8NWebhookConfig = defaultConfig
): Promise<{
  success: boolean;
  response?: N8NWebhookResponse;
  error?: string;
}> {
  if (!config.url) {
    return {
      success: false,
      error: 'URL do webhook N8N não configurada',
    };
  }

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
    return {
      success: false,
      error: `Erro ao gerar token JWT: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    };
  }
  
  // Tenta enviar com retry
  for (let attempt = 1; attempt <= config.retries; attempt++) {
    try {
      console.log(`🔗 Tentativa ${attempt}/${config.retries} - URL N8N: ${config.url}`);
      
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
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      
      return {
        success: true,
        response: responseData,
      };
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Erro desconhecido');
      
      console.warn(`Tentativa ${attempt}/${config.retries} falhou:`, lastError.message);
      
      // Se não é a última tentativa, aguarda antes de tentar novamente
      if (attempt < config.retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  return {
    success: false,
    error: `Falha após ${config.retries} tentativas: ${lastError?.message}`,
  };
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