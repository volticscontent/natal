import { NextRequest, NextResponse } from 'next/server';
import { LastLinkWebhookPayload, WebhookResponse, ProcessedSaleData, LastLinkEventData } from '../types';
import { 
  validateLastLinkPayload, 
  validateLastLinkToken,
  logWebhookEvent, 
  generateEventHash, 
  isDuplicateEvent,
  logDataStorageStep,
  logProcessingFlow
} from '../utils';

/**
 * Webhook endpoint para receber dados de vendas do LastLink
 * 
 * Eventos suportados:
 * - Purchase_Order_Confirmed: Compra confirmada e paga
 * - Payment_Refund: Pagamento reembolsado
 * - Payment_Chargeback: Chargeback do pagamento
 * - Purchase_Request_Canceled: Pedido cancelado
 * - Subscription_Canceled: Assinatura cancelada
 * - E outros eventos do LastLink
 * 
 * URL do webhook: /api/pos-compra/lastlink
 */

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const processingStages: Array<{
    stage: string;
    status: 'started' | 'completed' | 'error';
    data?: Record<string, unknown>;
    error?: string;
    duration?: number;
  }> = [];

  try {
    // Etapa 1: Validação de Content-Type
    processingStages.push({ stage: 'Content-Type Validation', status: 'started' });
    
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      processingStages.push({ 
        stage: 'Content-Type Validation', 
        status: 'error',
        error: 'Content-Type deve ser application/json'
      });
      
      logProcessingFlow('lastlink', 'unknown', processingStages);
      
      return NextResponse.json(
        { success: false, error: 'Content-Type deve ser application/json' },
        { status: 400 }
      );
    }
    
    processingStages.push({ 
      stage: 'Content-Type Validation', 
      status: 'completed',
      duration: Date.now() - startTime
    });

    // Etapa 2: Validação de Token de Autenticação
    processingStages.push({ stage: 'Token Validation', status: 'started' });
    
    if (!validateLastLinkToken(request)) {
      processingStages.push({ 
        stage: 'Token Validation', 
        status: 'error',
        error: 'Token de autenticação inválido ou ausente'
      });
      
      logProcessingFlow('lastlink', 'unknown', processingStages);
      
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    processingStages.push({ 
      stage: 'Token Validation', 
      status: 'completed',
      duration: Date.now() - startTime
    });

    // Etapa 3: Parsing do payload
    processingStages.push({ stage: 'Payload Parsing', status: 'started' });
    
    const payload: LastLinkWebhookPayload = await request.json() as LastLinkWebhookPayload;
    
    // Log inicial do payload recebido
    logDataStorageStep(
      'PAYLOAD_RECEIVED',
      'lastlink',
      payload.event_type || 'unknown',
      payload as unknown as Record<string, unknown>
    );
    
    processingStages.push({ 
      stage: 'Payload Parsing', 
      status: 'completed',
      data: { event_type: payload.event_type, has_data: !!payload.data },
      duration: Date.now() - startTime
    });

    // Etapa 3: Validação estrutural
    processingStages.push({ stage: 'Payload Validation', status: 'started' });
    
    if (!validateLastLinkPayload(payload)) {
      processingStages.push({ 
        stage: 'Payload Validation', 
        status: 'error',
        error: 'Payload inválido: event_type e data são obrigatórios'
      });
      
      logProcessingFlow('lastlink', (payload as unknown as { event_type?: string }).event_type || 'unknown', processingStages);
      
      return NextResponse.json(
        { success: false, error: 'Payload inválido: event_type e data são obrigatórios' },
        { status: 400 }
      );
    }
    
    processingStages.push({ 
      stage: 'Payload Validation', 
      status: 'completed',
      duration: Date.now() - startTime
    });

    // Etapa 4: Verificação de duplicatas
    processingStages.push({ stage: 'Duplicate Check', status: 'started' });
    
    const eventHash = await generateEventHash(payload as unknown as Record<string, unknown>);
    const orderId = payload.data.order_id || 'unknown';
    
    if (isDuplicateEvent(eventHash, orderId)) {
      processingStages.push({ 
        stage: 'Duplicate Check', 
        status: 'completed',
        data: { is_duplicate: true, event_hash: eventHash }
      });
      
      logWebhookEvent('LastLink', payload.event_type, payload as unknown as Record<string, unknown>, 'warning');
      logProcessingFlow('lastlink', payload.event_type, processingStages);
      
      return NextResponse.json({
        success: true,
        message: 'Evento duplicado ignorado',
        event_hash: eventHash
      }, { status: 200 });
    }
    
    processingStages.push({ 
      stage: 'Duplicate Check', 
      status: 'completed',
      data: { is_duplicate: false, event_hash: eventHash },
      duration: Date.now() - startTime
    });

    // Etapa 5: Processamento do evento
    processingStages.push({ stage: 'Event Processing', status: 'started' });
    
    logDataStorageStep(
      'BEFORE_PROCESSING',
      'lastlink',
      payload.event_type,
      payload as unknown as Record<string, unknown>
    );

    const processedData = await processLastLinkEvent(payload);
    
    logDataStorageStep(
      'AFTER_PROCESSING',
      'lastlink',
      payload.event_type,
      payload as unknown as Record<string, unknown>,
      processedData as unknown as Record<string, unknown>
    );
    
    processingStages.push({ 
      stage: 'Event Processing', 
      status: 'completed',
      data: processedData as unknown as Record<string, unknown>,
      duration: Date.now() - startTime
    });

    // Log do evento processado com sucesso
    logWebhookEvent('LastLink', payload.event_type, payload as unknown as Record<string, unknown>, 'success');
    
    // Log do fluxo completo
    logProcessingFlow('lastlink', payload.event_type, processingStages);

    // Resposta de sucesso
    const response: WebhookResponse = {
      success: true,
      message: `Evento ${payload.event_type} processado com sucesso`,
      data: processedData
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    processingStages.push({ 
      stage: 'Error Handling', 
      status: 'error',
      error: errorMessage,
      duration: Date.now() - startTime
    });
    
    console.error('[LastLink Webhook] Erro ao processar webhook:', error);
    
    // Log do erro
    logWebhookEvent('LastLink', 'error', { error: errorMessage }, 'error');
    logProcessingFlow('lastlink', 'error', processingStages);
    
    const response: WebhookResponse = {
      success: false,
      error: 'Erro interno do servidor',
      message: 'Falha ao processar webhook do LastLink'
    };

    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * Processa os diferentes tipos de eventos do LastLink
 */
async function processLastLinkEvent(payload: LastLinkWebhookPayload): Promise<ProcessedSaleData> {
  const { event_type, data } = payload;

  // Dados básicos processados
  const processedData: ProcessedSaleData = {
    gateway: 'lastlink',
    order_id: data.order_id,
    customer_email: data.customer?.email || '',
    customer_name: data.customer?.name || '',
    amount: data.payment?.amount || 0,
    currency: data.payment?.currency || 'BRL',
    status: data.payment?.status || 'unknown',
    event_type: 'purchase.confirmed',
    processed_at: new Date().toISOString(),
    raw_data: data
  };

  // Lógica específica por tipo de evento
  switch (event_type) {
    case 'Purchase_Order_Confirmed':
      // Compra confirmada - liberar acesso, enviar email de confirmação, etc.
      console.log(`[LastLink] Compra confirmada para cliente: ${data.customer?.email || 'unknown'}`);
      await handlePurchaseConfirmed(data);
      break;

    case 'Payment_Refund':
      // Reembolso - remover acesso, notificar cliente, etc.
      console.log(`[LastLink] Reembolso processado para pedido ${data.order_id}`);
      await handleRefund(data);
      break;

    case 'Payment_Chargeback':
      // Chargeback - suspender acesso, investigar, etc.
      console.log(`[LastLink] Chargeback recebido para pedido ${data.order_id}`);
      await handleChargeback(data);
      break;

    case 'Subscription_Canceled':
      // Assinatura cancelada - remover acesso recorrente
      console.log(`[LastLink] Assinatura cancelada para ${data.customer?.email}`);
      await handleSubscriptionCanceled(data);
      break;

    case 'Abandoned_Cart':
      // Carrinho abandonado - enviar email de recuperação
      console.log(`[LastLink] Carrinho abandonado para ${data.customer?.email}`);
      await handleAbandonedCart(data);
      break;

    default:
      console.log(`[LastLink] Evento não tratado: ${event_type}`);
      break;
  }

  return processedData;
}

/**
 * Handlers específicos para cada tipo de evento
 */

async function handlePurchaseConfirmed(data: LastLinkEventData) {
  // Log do início do processamento
  logDataStorageStep(
    'PURCHASE_CONFIRMED_START',
    'lastlink',
    'Purchase_Order_Confirmed',
    data as unknown as Record<string, unknown>
  );

  // TODO: Implementar lógica para compra confirmada
  // 1. Verificar se o produto é digital e liberar acesso
  // 2. Enviar email de confirmação
  // 3. Atualizar banco de dados
  // 4. Disparar pixel de conversão
  // 5. Integrar com email marketing
  // 6. Registrar analytics
  
  console.log('🎉 [LastLink] Processando compra confirmada:', {
    order_id: data.order_id,
    customer_email: data.customer?.email,
    amount: data.payment?.amount,
    product_id: data.product_id
  });
  
  // Log do final do processamento
  logDataStorageStep(
    'PURCHASE_CONFIRMED_END',
    'lastlink',
    'Purchase_Order_Confirmed',
    data as unknown as Record<string, unknown>,
    { status: 'processed', actions: ['access_granted', 'email_sent', 'pixels_fired'] }
  );
}

async function handleRefund(data: LastLinkEventData) {
  console.log('[LastLink] Processando reembolso:', data.order_id);
  
  // Log do início do processamento
  logDataStorageStep('REFUND_START', 'lastlink', 'refund.processed', {
    event_type: 'refund.processed',
    source: 'LastLink',
    category: 'refund_management',
    payload: data
  });
  
  // TODO: Implementar lógica para reembolso
  // 1. Remover acesso ao produto
  // 2. Enviar email de notificação
  // 3. Atualizar status no banco de dados
  // 4. Registrar analytics
  
  // Log do final do processamento
  logDataStorageStep('REFUND_END', 'lastlink', 'refund.processed', {
    event_type: 'refund.processed',
    source: 'LastLink',
    category: 'refund_management',
    order_id: data.order_id,
    customer_email: data.customer?.email,
    amount: data.payment?.amount || 0
  });
}

async function handleChargeback(data: LastLinkEventData) {
  console.log('[LastLink] Processando chargeback:', data.order_id);
  
  // Log do início do processamento
  logDataStorageStep('CHARGEBACK_START', 'lastlink', 'chargeback.received', {
    event_type: 'chargeback.received',
    source: 'LastLink',
    category: 'chargeback_management',
    payload: data
  });
  
  // TODO: Implementar lógica para chargeback
  // 1. Bloquear acesso imediatamente
  // 2. Notificar equipe financeira
  // 3. Marcar cliente como risco
  // 4. Registrar para análise
  
  // Log do final do processamento
  logDataStorageStep('CHARGEBACK_END', 'lastlink', 'chargeback.received', {
    event_type: 'chargeback.received',
    source: 'LastLink',
    category: 'chargeback_management',
    order_id: data.order_id,
    customer_email: data.customer?.email,
    amount: data.payment?.amount || 0
  });
}

async function handleSubscriptionCanceled(data: LastLinkEventData) {
  console.log('[LastLink] Processando cancelamento de assinatura:', data.order_id);
  
  // Log do início do processamento
  logDataStorageStep('SUBSCRIPTION_CANCELED_START', 'lastlink', 'subscription.canceled', {
    event_type: 'subscription.canceled',
    source: 'LastLink',
    category: 'subscription_management',
    payload: data
  });
  
  // TODO: Implementar lógica para cancelamento de assinatura
  // 1. Cancelar acesso recorrente
  // 2. Enviar email de confirmação de cancelamento
  // 3. Atualizar status da assinatura
  // 4. Registrar motivo do cancelamento
  
  // Log do final do processamento
  logDataStorageStep('SUBSCRIPTION_CANCELED_END', 'lastlink', 'subscription.canceled', {
    event_type: 'subscription.canceled',
    source: 'LastLink',
    category: 'subscription_management',
    order_id: data.order_id,
    customer_email: data.customer?.email,
    subscription_id: data.subscription?.id
  });
}

async function handleAbandonedCart(data: LastLinkEventData) {
  console.log('[LastLink] Processando carrinho abandonado:', data.order_id);
  
  // Log do início do processamento
  logDataStorageStep('ABANDONED_CART_START', 'lastlink', 'cart.abandoned', {
    event_type: 'cart.abandoned',
    source: 'LastLink',
    category: 'cart_recovery',
    payload: data
  });
  
  // TODO: Implementar lógica para carrinho abandonado
  // 1. Disparar email de recuperação
  // 2. Registrar para remarketing
  // 3. Analisar motivos de abandono
  // 4. Configurar follow-up automático
  
  // Log do final do processamento
  logDataStorageStep('ABANDONED_CART_END', 'lastlink', 'cart.abandoned', {
    event_type: 'cart.abandoned',
    source: 'LastLink',
    category: 'cart_recovery',
    order_id: data.order_id,
    customer_email: data.customer?.email,
    amount: data.payment?.amount || 0
  });
}

// Endpoint GET para verificar se o webhook está funcionando
export async function GET() {
  return NextResponse.json({
    message: 'Webhook LastLink está funcionando',
    endpoint: '/api/pos-compra/lastlink',
    methods: ['POST'],
    events_supported: [
      'Purchase_Order_Confirmed',
      'Payment_Refund',
      'Payment_Chargeback',
      'Purchase_Request_Canceled',
      'Subscription_Canceled',
      'Abandoned_Cart'
    ]
  });
}