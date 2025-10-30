import { NextRequest, NextResponse } from 'next/server';
import { CartPandaWebhookPayload, WebhookResponse, ProcessedSaleData, CartPandaEventData } from '../types';
import { 
  validateCartPandaPayload, 
  logWebhookEvent, 
  generateEventHash, 
  isDuplicateEvent,
  logDataStorageStep,
  logProcessingFlow
} from '../utils';

/**
 * Webhook endpoint para receber dados de vendas do CartPanda
 * 
 * Eventos suportados:
 * - order.paid: Pedido pago com sucesso
 * - order.created: Novo pedido criado
 * - order.updated: Pedido atualizado
 * - order.refunded: Pedido reembolsado
 * - product.created: Produto criado
 * - product.updated: Produto atualizado
 * - product.deleted: Produto deletado
 * 
 * URL do webhook: /api/pos-compra/cartpanda
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
      
      logProcessingFlow('cartpanda', 'unknown', processingStages);
      
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

    // Etapa 2: Parsing do payload
    processingStages.push({ stage: 'Payload Parsing', status: 'started' });
    
    const payload: CartPandaWebhookPayload = await request.json();
    
    // Log inicial do payload recebido
    logDataStorageStep(
      'PAYLOAD_RECEIVED',
      'cartpanda',
      payload.event || 'unknown',
      payload as unknown as Record<string, unknown>
    );
    
    processingStages.push({ 
      stage: 'Payload Parsing', 
      status: 'completed',
      data: { event: payload.event, has_data: !!payload.data },
      duration: Date.now() - startTime
    });

    // Etapa 3: Validação estrutural
    processingStages.push({ stage: 'Payload Validation', status: 'started' });
    
    if (!validateCartPandaPayload(payload)) {
      processingStages.push({ 
        stage: 'Payload Validation', 
        status: 'error',
        error: 'Payload inválido: event e data são obrigatórios'
      });
      
      logProcessingFlow('cartpanda', (payload as unknown as { event?: string }).event || 'unknown', processingStages);
      
      return NextResponse.json(
        { success: false, error: 'Payload inválido: event e data são obrigatórios' },
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
    const orderId = payload.data.order_id || payload.data.product_id || 'unknown';
    
    if (isDuplicateEvent(eventHash, orderId)) {
      processingStages.push({ 
        stage: 'Duplicate Check', 
        status: 'completed',
        data: { is_duplicate: true, event_hash: eventHash }
      });
      
      logWebhookEvent('CartPanda', payload.event, payload as unknown as Record<string, unknown>, 'warning');
      logProcessingFlow('cartpanda', payload.event, processingStages);
      
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
      'cartpanda',
      payload.event,
      payload as unknown as Record<string, unknown>
    );

    const processedData = await processCartPandaEvent(payload);
    
    logDataStorageStep(
      'AFTER_PROCESSING',
      'cartpanda',
      payload.event,
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
    logWebhookEvent('CartPanda', payload.event, payload as unknown as Record<string, unknown>, 'success');
    
    // Log do fluxo completo
    logProcessingFlow('cartpanda', payload.event, processingStages);

    // Resposta de sucesso
    const response: WebhookResponse = {
      success: true,
      message: `Evento ${payload.event} processado com sucesso`,
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
    
    console.error('[CartPanda Webhook] Erro ao processar webhook:', error);
    
    // Log do erro
    logWebhookEvent('CartPanda', 'error', { error: errorMessage }, 'error');
    logProcessingFlow('cartpanda', 'error', processingStages);
    
    const response: WebhookResponse = {
      success: false,
      error: 'Erro interno do servidor',
      message: 'Falha ao processar webhook do CartPanda'
    };

    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * Processa os diferentes tipos de eventos do CartPanda
 */
async function processCartPandaEvent(payload: CartPandaWebhookPayload): Promise<ProcessedSaleData> {
  const { event, data } = payload;

  // Dados básicos processados
  const processedData: ProcessedSaleData = {
    gateway: 'cartpanda',
    order_id: data.order_id,
    customer_email: data.customer?.email || '',
    customer_name: data.customer?.name || '',
    amount: data.totals?.total || data.payment?.amount || 0,
    currency: data.payment?.currency || 'BRL',
    status: data.payment?.status || 'unknown',
    event_type: event,
    processed_at: new Date().toISOString(),
    raw_data: payload
  };

  // Lógica específica por tipo de evento
  switch (event) {
    case 'order.paid':
      // Pedido pago - liberar acesso, enviar confirmação, etc.
      console.log(`[CartPanda] Pedido pago para ${data.customer?.email || 'unknown'}`);
      await handleOrderPaid(data);
      break;

    case 'order.created':
      // Novo pedido criado - registrar lead, enviar email de acompanhamento
      console.log(`[CartPanda] Novo pedido criado: ${data.order_id}`);
      await handleOrderCreated(data);
      break;

    case 'order.updated':
      // Pedido atualizado - sincronizar mudanças
      console.log(`[CartPanda] Pedido atualizado: ${data.order_id}`);
      await handleOrderUpdated(data);
      break;

    case 'order.refunded':
      // Pedido reembolsado - remover acesso, notificar
      console.log(`[CartPanda] Pedido reembolsado: ${data.order_id}`);
      await handleOrderRefunded(data);
      break;

    case 'product.created':
      // Produto criado - sincronizar catálogo
      console.log(`[CartPanda] Produto criado: ${data.product_id}`);
      await handleProductCreated(data);
      break;

    case 'product.updated':
      // Produto atualizado - sincronizar mudanças
      console.log(`[CartPanda] Produto atualizado: ${data.product_id}`);
      await handleProductUpdated(data);
      break;

    case 'product.deleted':
      // Produto deletado - remover do catálogo
      console.log(`[CartPanda] Produto deletado: ${data.product_id}`);
      await handleProductDeleted(data);
      break;

    default:
      console.log(`[CartPanda] Evento não tratado: ${event}`);
      break;
  }

  return processedData;
}

/**
 * Handlers específicos para cada tipo de evento
 */

async function handleOrderPaid(data: CartPandaEventData) {
  console.log('[CartPanda] Processando pagamento confirmado:', data.order_id);
  
  // Log do início do processamento
  logDataStorageStep('ORDER_PAID_START', 'cartpanda', 'order.paid', {
    event_type: 'order.paid',
    source: 'CartPanda',
    category: 'payment_confirmation',
    payload: data
  });
  
  // TODO: Implementar lógica para pagamento confirmado
  // 1. Liberar acesso ao produto
  // 2. Enviar email de boas-vindas
  // 3. Registrar venda no analytics
  // 4. Configurar entrega/acesso
  
  // Log do final do processamento
  logDataStorageStep('ORDER_PAID_END', 'cartpanda', 'order.paid', {
    event_type: 'order.paid',
    source: 'CartPanda',
    category: 'payment_confirmation',
    order_id: data.order_id,
    customer_email: data.customer?.email,
    amount: data.totals?.total || 0
  });
}

async function handleOrderCreated(data: CartPandaEventData) {
  console.log('[CartPanda] Processando pedido criado:', data.order_id);
  
  // Log do início do processamento
  logDataStorageStep('ORDER_CREATED_START', 'cartpanda', 'order.created', {
    event_type: 'order.created',
    source: 'CartPanda',
    category: 'order_management',
    payload: data
  });
  
  // TODO: Implementar lógica para pedido criado
  // 1. Registrar pedido no sistema
  // 2. Enviar confirmação de pedido
  // 3. Iniciar processo de fulfillment
  
  // Log do final do processamento
  logDataStorageStep('ORDER_CREATED_END', 'cartpanda', 'order.created', {
    event_type: 'order.created',
    source: 'CartPanda',
    category: 'order_management',
    order_id: data.order_id,
    customer_email: data.customer?.email,
    amount: data.totals?.total || 0
  });
}

async function handleOrderUpdated(data: CartPandaEventData) {
  console.log('[CartPanda] Processando atualização de pedido:', data.order_id);
  
  // Log do início do processamento
  logDataStorageStep('ORDER_UPDATED_START', 'cartpanda', 'order.updated', {
    event_type: 'order.updated',
    source: 'CartPanda',
    category: 'order_management',
    payload: data
  });
  
  // TODO: Implementar lógica para atualização de pedido
  // 1. Atualizar dados do pedido
  // 2. Notificar cliente sobre mudanças
  // 3. Ajustar fulfillment se necessário
  
  // Log do final do processamento
  logDataStorageStep('ORDER_UPDATED_END', 'cartpanda', 'order.updated', {
    event_type: 'order.updated',
    source: 'CartPanda',
    category: 'order_management',
    order_id: data.order_id,
    customer_email: data.customer?.email,
    amount: data.totals?.total || 0
  });
}

async function handleOrderRefunded(data: CartPandaEventData) {
  console.log('[CartPanda] Processando reembolso de pedido:', data.order_id);
  
  // Log do início do processamento
  logDataStorageStep('ORDER_REFUNDED_START', 'cartpanda', 'order.refunded', {
    event_type: 'order.refunded',
    source: 'CartPanda',
    category: 'refund_management',
    payload: data
  });
  
  // TODO: Implementar lógica para reembolso
  // 1. Processar reembolso
  // 2. Remover acesso ao produto
  // 3. Enviar confirmação de reembolso
  // 4. Atualizar analytics
  
  // Log do final do processamento
  logDataStorageStep('ORDER_REFUNDED_END', 'cartpanda', 'order.refunded', {
    event_type: 'order.refunded',
    source: 'CartPanda',
    category: 'refund_management',
    order_id: data.order_id,
    customer_email: data.customer?.email,
    amount: data.totals?.total || 0
  });
}

async function handleProductCreated(data: CartPandaEventData) {
  console.log('[CartPanda] Processando produto criado:', data.product_id);
  
  // Log do início do processamento
  logDataStorageStep('PRODUCT_CREATED_START', 'cartpanda', 'product.created', {
    event_type: 'product.created',
    source: 'CartPanda',
    category: 'product_management',
    payload: data
  });
  
  // TODO: Implementar lógica para produto criado
  // 1. Sincronizar produto no sistema
  // 2. Atualizar catálogo
  // 3. Configurar disponibilidade
  
  // Log do final do processamento
  logDataStorageStep('PRODUCT_CREATED_END', 'cartpanda', 'product.created', {
    event_type: 'product.created',
    source: 'CartPanda',
    category: 'product_management',
    product_id: data.product_id
  });
}

async function handleProductUpdated(data: CartPandaEventData) {
  console.log('[CartPanda] Processando atualização de produto:', data.product_id);
  
  // Log do início do processamento
  logDataStorageStep('PRODUCT_UPDATED_START', 'cartpanda', 'product.updated', {
    event_type: 'product.updated',
    source: 'CartPanda',
    category: 'product_management',
    payload: data
  });
  
  // TODO: Implementar lógica para atualização de produto
  // 1. Atualizar dados do produto
  // 2. Sincronizar mudanças
  // 3. Notificar sobre alterações de preço/disponibilidade
  
  // Log do final do processamento
  logDataStorageStep('PRODUCT_UPDATED_END', 'cartpanda', 'product.updated', {
    event_type: 'product.updated',
    source: 'CartPanda',
    category: 'product_management',
    product_id: data.product_id
  });
}

async function handleProductDeleted(data: CartPandaEventData) {
  console.log('[CartPanda] Processando exclusão de produto:', data.product_id);
  
  // Log do início do processamento
  logDataStorageStep('PRODUCT_DELETED_START', 'cartpanda', 'product.deleted', {
    event_type: 'product.deleted',
    source: 'CartPanda',
    category: 'product_management',
    payload: data
  });
  
  // TODO: Implementar lógica para exclusão de produto
  // 1. Remover produto do catálogo
  // 2. Lidar com pedidos existentes
  // 3. Atualizar referências
  
  // Log do final do processamento
  logDataStorageStep('PRODUCT_DELETED_END', 'cartpanda', 'product.deleted', {
    event_type: 'product.deleted',
    source: 'CartPanda',
    category: 'product_management',
    product_id: data.product_id
  });
}

// Endpoint GET para verificar se o webhook está funcionando
export async function GET() {
  return NextResponse.json({
    message: 'Webhook CartPanda está funcionando',
    endpoint: '/api/pos-compra/cartpanda',
    methods: ['POST'],
    events_supported: [
      'order.paid',
      'order.created',
      'order.updated',
      'order.refunded',
      'product.created',
      'product.updated',
      'product.deleted'
    ]
  });
}