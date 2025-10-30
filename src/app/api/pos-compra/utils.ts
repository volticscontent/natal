import { LastLinkWebhookPayload, CartPandaWebhookPayload } from './types';

/**
 * Utilitários para validação e processamento dos webhooks
 */

// ===== VALIDAÇÃO DE PAYLOADS =====

/**
 * Valida o token de autenticação do webhook da LastLink
 */
export function validateLastLinkToken(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.LASTLINK_WEBHOOK_TOKEN;
  
  if (!expectedToken) {
    console.warn('LASTLINK_WEBHOOK_TOKEN não configurado no ambiente');
    return false;
  }
  
  if (!authHeader) {
    return false;
  }
  
  // Suporte para Bearer token ou token direto
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : authHeader;
    
  return token === expectedToken;
}

/**
 * Valida se o payload do LastLink está correto
 */
export function validateLastLinkPayload(payload: unknown): payload is LastLinkWebhookPayload {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const p = payload as Record<string, unknown>;

  // Verificar campos obrigatórios
  if (!p.event_type || !p.data) {
    return false;
  }

  // Verificar se o event_type é válido
  const validEvents = [
    'Purchase_Order_Confirmed',
    'Payment_Refund',
    'Payment_Chargeback',
    'Purchase_Request_Canceled',
    'Purchase_Request_Confirmed',
    'Purchase_Request_Expired',
    'Recurrent_Payment',
    'Refund_Period_Over',
    'Subscription_Canceled',
    'Subscription_Expired',
    'Product_access_started',
    'Product_access_ended',
    'Subscription_Renewal_Pending',
    'Active_Member_Notification',
    'Refund_Requested',
    'Abandoned_Cart'
  ];

  if (!validEvents.includes(p.event_type as string)) {
    return false;
  }

  // Verificar estrutura básica dos dados
  const data = p.data as Record<string, unknown>;
  if (!data.order_id) {
    return false;
  }

  return true;
}

/**
 * Valida se o payload do CartPanda está correto
 */
export function validateCartPandaPayload(payload: unknown): payload is CartPandaWebhookPayload {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const p = payload as Record<string, unknown>;

  // Verificar campos obrigatórios
  if (!p.event || !p.data) {
    return false;
  }

  // Verificar se o event é válido
  const validEvents = [
    'product.created',
    'product.updated',
    'product.deleted',
    'order.created',
    'order.paid',
    'order.updated',
    'order.refunded'
  ];

  if (!validEvents.includes(p.event as string)) {
    return false;
  }

  // Verificar estrutura básica dos dados
  const data = p.data as Record<string, unknown>;
  if (!data.order_id && !data.product_id) {
    return false;
  }

  return true;
}

// ===== PROCESSAMENTO DE DADOS =====

/**
 * Sanitiza e normaliza dados do cliente
 */
export function sanitizeCustomerData(customer: unknown): Record<string, unknown> | null {
  if (!customer || typeof customer !== 'object') return null;

  const cust = customer as Record<string, unknown>;

  return {
    id: cust.id || '',
    name: sanitizeString(cust.name) || '',
    email: sanitizeEmail(cust.email) || '',
    phone: sanitizePhone(cust.phone) || '',
    document: sanitizeString(cust.document) || '',
    address: cust.address ? sanitizeAddress(cust.address) : null
  };
}

/**
 * Sanitiza dados de endereço
 */
export function sanitizeAddress(address: unknown): Record<string, string> | null {
  if (!address || typeof address !== 'object') return null;

  const addr = address as Record<string, unknown>;
  
  return {
    street: sanitizeString(addr.street) || '',
    number: sanitizeString(addr.number) || '',
    complement: sanitizeString(addr.complement) || '',
    neighborhood: sanitizeString(addr.neighborhood) || '',
    city: sanitizeString(addr.city) || '',
    state: sanitizeString(addr.state) || '',
    zipcode: sanitizeString(addr.zipcode) || '',
    country: sanitizeString(addr.country) || 'BR'
  };
}

/**
 * Sanitiza strings removendo caracteres perigosos
 */
export function sanitizeString(value: unknown): string {
  if (typeof value !== 'string') return '';
  
  return value
    .trim()
    .replace(/[<>\"']/g, '') // Remove caracteres HTML perigosos
    .substring(0, 255); // Limita tamanho
}

/**
 * Valida e sanitiza email
 */
export function sanitizeEmail(email: unknown): string {
  if (typeof email !== 'string') return '';
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const cleanEmail = email.trim().toLowerCase();
  
  return emailRegex.test(cleanEmail) ? cleanEmail : '';
}

/**
 * Sanitiza telefone
 */
export function sanitizePhone(phone: unknown): string {
  if (typeof phone !== 'string') return '';
  
  // Remove tudo que não é número
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Valida se tem pelo menos 10 dígitos (telefone brasileiro)
  return cleanPhone.length >= 10 ? cleanPhone : '';
}

/**
 * Valida e sanitiza valor monetário
 */
export function sanitizeAmount(amount: unknown): number {
  if (typeof amount === 'number' && !isNaN(amount) && amount >= 0) {
    return Math.round(amount * 100) / 100; // Arredonda para 2 casas decimais
  }
  
  if (typeof amount === 'string') {
    const numAmount = parseFloat(amount.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (!isNaN(numAmount) && numAmount >= 0) {
      return Math.round(numAmount * 100) / 100;
    }
  }
  
  return 0;
}

// ===== LOGGING E MONITORAMENTO =====

/**
 * Log estruturado para webhooks
 */
export function logWebhookEvent(
  provider: string,
  event: string,
  data: Record<string, unknown>,
  status: 'success' | 'error' | 'warning' = 'success'
): void {
  const customer = data.customer as Record<string, unknown> | undefined;
  const payment = data.payment as Record<string, unknown> | undefined;
  const totals = data.totals as Record<string, unknown> | undefined;
  
  const logData = {
    timestamp: new Date().toISOString(),
    provider,
    event,
    status,
    order_id: data.order_id || data.id || 'unknown',
    customer_email: customer?.email || 'unknown',
    amount: payment?.amount || totals?.total || 0
  };

  console.log(`[Webhook ${provider.toUpperCase()}]`, logData);

  // Aqui você pode integrar com serviços de logging como:
  // - Sentry para erros
  // - DataDog para métricas
  // - CloudWatch para AWS
  // - Google Cloud Logging
}

/**
 * Gera hash para identificação única de eventos
 */
export async function generateEventHash(payload: Record<string, unknown>): Promise<string> {
  const crypto = await import('crypto');
  const dataString = JSON.stringify(payload);
  return crypto.createHash('sha256').update(dataString).digest('hex').substring(0, 16);
}

/**
 * Verifica se é um evento duplicado (implementação básica)
 */
const processedEvents = new Set<string>();

export function isDuplicateEvent(eventId: string, orderId: string): boolean {
  const uniqueKey = `${eventId}-${orderId}`;
  
  if (processedEvents.has(uniqueKey)) {
    return true;
  }
  
  processedEvents.add(uniqueKey);
  
  // Limpar eventos antigos (manter apenas os últimos 1000)
  if (processedEvents.size > 1000) {
    const firstKey = processedEvents.values().next().value;
    if (firstKey) {
      processedEvents.delete(firstKey);
    }
  }
  
  return false;
}

// ===== INTEGRAÇÃO COM SERVIÇOS EXTERNOS =====

/**
 * Dispara pixels de conversão
 */
export function triggerConversionPixels(orderData: Record<string, unknown>): void {
  try {
    // Facebook Pixel
    if (process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID) {
      triggerFacebookPixel(orderData);
    }

    // Google Ads
    if (process.env.NEXT_PUBLIC_GOOGLE_ADS_ID) {
      triggerGoogleAds(orderData);
    }

    // TikTok Pixel
    if (process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID) {
      triggerTikTokPixel(orderData);
    }

    // Google Analytics 4
    if (process.env.NEXT_PUBLIC_GA4_ID) {
      triggerGA4Event(orderData);
    }

  } catch (error) {
    console.error('Erro ao disparar pixels de conversão:', error);
  }
}

function triggerFacebookPixel(data: Record<string, unknown>) {
  // Implementar integração com Facebook Conversions API
  console.log('Disparando Facebook Pixel para:', data.order_id);
}

function triggerGoogleAds(data: Record<string, unknown>) {
  // Implementar integração com Google Ads Conversions API
  console.log('Disparando Google Ads para:', data.order_id);
}

function triggerTikTokPixel(data: Record<string, unknown>) {
  // Implementar integração com TikTok Events API
  console.log('Disparando TikTok Pixel para:', data.order_id);
}

function triggerGA4Event(data: Record<string, unknown>) {
  // Implementar integração com Google Analytics 4 Measurement Protocol
  console.log('Disparando GA4 Event para:', data.order_id);
}

/**
 * Envia notificação por email
 */
export async function sendNotificationEmail(
  type: 'purchase_confirmed' | 'refund_processed' | 'error_occurred',
  data: Record<string, unknown>
) {
  try {
    // Implementar integração com serviço de email
    // Exemplos: SendGrid, AWS SES, Mailgun, etc.
    const customer = data.customer as Record<string, unknown> | undefined;
    console.log(`Enviando email de ${type} para:`, customer?.email || 'unknown');
    
  } catch (error) {
    console.error('Erro ao enviar email:', error);
  }
}

/**
 * Função para logging detalhado do data storage em cada etapa
 * Mostra o payload completo para visualização e debug
 */
export function logDataStorageStep(
  step: string,
  provider: 'lastlink' | 'cartpanda',
  eventType: string,
  payload: Record<string, unknown>,
  processedData?: Record<string, unknown>
): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    step,
    provider,
    eventType,
    payload: {
      ...payload,
      // Mascarar dados sensíveis para logging
      customer: payload.customer ? {
        ...(payload.customer as Record<string, unknown>),
        email: maskEmail((payload.customer as Record<string, unknown>).email),
        phone: maskPhone((payload.customer as Record<string, unknown>).phone),
        document: maskDocument((payload.customer as Record<string, unknown>).document)
      } : undefined
    },
    processedData: processedData ? {
      ...processedData,
      customer_email: maskEmail(processedData.customer_email as string)
    } : undefined,
    dataSize: JSON.stringify(payload).length,
    memoryUsage: process.memoryUsage()
  };

  console.log(`\n🔍 [DATA STORAGE LOG] ${step.toUpperCase()}`);
  console.log('=' .repeat(80));
  console.log(JSON.stringify(logEntry, null, 2));
  console.log('=' .repeat(80));
}

/**
 * Função para logging do fluxo completo de processamento
 */
export function logProcessingFlow(
  provider: 'lastlink' | 'cartpanda',
  eventType: string,
  stages: Array<{
    stage: string;
    status: 'started' | 'completed' | 'error';
    data?: Record<string, unknown>;
    error?: string;
    duration?: number;
  }>
): void {
  const timestamp = new Date().toISOString();
  
  console.log(`\n📊 [PROCESSING FLOW] ${provider.toUpperCase()} - ${eventType}`);
  console.log('=' .repeat(100));
  console.log(`Timestamp: ${timestamp}`);
  console.log(`Event: ${eventType}`);
  console.log(`Provider: ${provider}`);
  console.log('\nStages:');
  
  stages.forEach((stage, index) => {
    const statusIcon = stage.status === 'completed' ? '✅' : 
                      stage.status === 'error' ? '❌' : '🔄';
    
    console.log(`  ${index + 1}. ${statusIcon} ${stage.stage} (${stage.status})`);
    
    if (stage.duration) {
      console.log(`     ⏱️  Duration: ${stage.duration}ms`);
    }
    
    if (stage.error) {
      console.log(`     ❌ Error: ${stage.error}`);
    }
    
    if (stage.data) {
      console.log(`     📦 Data keys: [${Object.keys(stage.data).join(', ')}]`);
    }
  });
  
  console.log('=' .repeat(100));
}

/**
 * Funções auxiliares para mascarar dados sensíveis
 */
function maskEmail(email: unknown): string {
  if (typeof email !== 'string' || !email.includes('@')) {
    return 'invalid-email';
  }
  const [user, domain] = email.split('@');
  return `${user.substring(0, 2)}***@${domain}`;
}

function maskPhone(phone: unknown): string {
  if (typeof phone !== 'string') return 'invalid-phone';
  return phone.replace(/(\d{2})(\d+)(\d{4})/, '$1***$3');
}

function maskDocument(document: unknown): string {
  if (typeof document !== 'string') return 'invalid-document';
  return document.replace(/(\d{3})(\d+)(\d{2})/, '$1***$3');
}