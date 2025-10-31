import { NextRequest, NextResponse } from 'next/server';
import { processAndSendToN8N, validateN8NData } from '@/lib/n8n-webhook';
import { PersData, ContactData } from '@/components/main/pers/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extrair dados do corpo da requisição
    const {
      persData,
      contactData,
      sessionId,
      utmParams
    }: {
      persData: PersData;
      contactData: ContactData;
      sessionId: string;
      utmParams?: Record<string, string>;
    } = body;
    
    // Validar se session_id foi fornecido
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID é obrigatório' },
        { status: 400 }
      );
    }
    
    // Validar dados antes de enviar
    const validation = validateN8NData(persData, contactData);
    if (!validation.valid) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: validation.errors
        },
        { status: 400 }
      );
    }
    
    // Processar e enviar para N8N
    const result = await processAndSendToN8N(
      persData,
      contactData,
      sessionId,
      utmParams
    );
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Pedido enviado com sucesso',
        session_id: sessionId,
        payload: result.payload,
        n8n_response: result.response
      });
    } else {
      console.error('Erro ao enviar para N8N:', result.error);
      
      // Verificar se é um erro de conexão
      const isConnectionError = result.error?.includes('conexão') || 
                               result.error?.includes('network') || 
                               result.error?.includes('fetch failed') ||
                               result.error?.includes('timeout');
      
      if (isConnectionError) {
        return NextResponse.json(
          { 
            error: 'Serviço temporariamente indisponível',
            details: 'Nosso sistema está passando por manutenção. Tente novamente em alguns minutos.',
            fallback_mode: true,
            retry_after: 300 // 5 minutos
          },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Falha ao processar pedido',
          details: result.error
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Erro na API submit-order:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// Método GET para verificar status da API
export async function GET() {
  return NextResponse.json({
    status: 'active',
    endpoint: '/api/submit-order',
    methods: ['POST'],
    description: 'Endpoint para enviar pedidos para N8N webhook'
  });
}