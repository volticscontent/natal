import { NextRequest, NextResponse } from 'next/server';

// Interface para resposta de consulta de fotos
interface GetPhotosResponse {
  success: boolean;
  message: string;
  data?: {
    session_id: string;
    fotos: string[];
    metadata?: {
      total_fotos: number;
      created_at?: string;
      updated_at?: string;
    };
  };
  error?: string;
}

// Interface para dados do pedido (baseado no schema PostgreSQL)
interface PedidoData {
  id: number;
  session_id: string;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  fotos: string[] | null; // JSONB array de URLs
  created_at: string;
  updated_at: string;
  // ... outros campos do schema
}

/**
 * GET /api/get-photos?session_id=xxx
 * Endpoint para recuperar URLs de fotos salvas no PostgreSQL
 */
export async function GET(request: NextRequest): Promise<NextResponse<GetPhotosResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get('session_id');

    // Validação do session_id
    if (!session_id) {
      return NextResponse.json({
        success: false,
        message: 'session_id é obrigatório',
        error: 'MISSING_SESSION_ID'
      }, { status: 400 });
    }

    console.log(`[GET-PHOTOS] Buscando fotos para session: ${session_id}`);

    // TODO: Implementar consulta direta ao PostgreSQL
    // Por enquanto, vamos simular uma consulta via N8N webhook de consulta
    
    try {
      // Simula consulta ao banco (substituir por integração real)
      const queryResult = await queryPhotosFromDatabase(session_id);
      
      if (!queryResult.success) {
        return NextResponse.json({
          success: false,
          message: 'Erro ao consultar fotos no banco de dados',
          error: queryResult.error || 'DATABASE_QUERY_ERROR'
        }, { status: 500 });
      }

      // Se não encontrou dados
      if (!queryResult.data) {
        return NextResponse.json({
          success: true,
          message: 'Nenhuma foto encontrada para esta sessão',
          data: {
            session_id,
            fotos: [],
            metadata: {
              total_fotos: 0
            }
          }
        }, { status: 200 });
      }

      // Retorna dados encontrados
      return NextResponse.json({
        success: true,
        message: `${queryResult.data.fotos.length} fotos encontradas`,
        data: {
          session_id,
          fotos: queryResult.data.fotos,
          metadata: {
            total_fotos: queryResult.data.fotos.length,
            created_at: queryResult.data.created_at,
            updated_at: queryResult.data.updated_at
          }
        }
      }, { status: 200 });

    } catch (queryError) {
      console.error('[GET-PHOTOS] Erro na consulta:', queryError);
      return NextResponse.json({
        success: false,
        message: 'Erro interno ao consultar banco de dados',
        error: queryError instanceof Error ? queryError.message : 'QUERY_ERROR'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[GET-PHOTOS] Erro geral:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

/**
 * Função para consultar fotos no banco de dados
 * TODO: Implementar integração real com PostgreSQL
 */
async function queryPhotosFromDatabase(session_id: string): Promise<{
  success: boolean;
  data?: {
    fotos: string[];
    created_at: string;
    updated_at: string;
  };
  error?: string;
}> {
  try {
    // OPÇÃO 1: Consulta via N8N webhook (recomendado para manter consistência)
    const n8nQueryUrl = process.env.N8N_QUERY_WEBHOOK_URL;
    
    if (n8nQueryUrl) {
      const response = await fetch(n8nQueryUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.N8N_WEBHOOK_JWT_SECRET || ''}`
        },
        body: JSON.stringify({
          action: 'query_photos',
          session_id: session_id
        })
      });

      if (!response.ok) {
        throw new Error(`N8N query failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        return {
          success: true,
          data: {
            fotos: result.data.fotos || [],
            created_at: result.data.created_at || new Date().toISOString(),
            updated_at: result.data.updated_at || new Date().toISOString()
          }
        };
      }
    }

    // OPÇÃO 2: Consulta direta ao PostgreSQL (se configurado)
    // TODO: Implementar conexão direta com pg ou similar
    
    // Por enquanto, retorna dados mockados para desenvolvimento
    console.warn('[GET-PHOTOS] Usando dados mockados - implementar integração real');
    
    // Simula dados baseados no session_id para desenvolvimento
    const mockPhotos = generateMockPhotos(session_id);
    
    return {
      success: true,
      data: {
        fotos: mockPhotos,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('[GET-PHOTOS] Erro na consulta ao banco:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'DATABASE_ERROR'
    };
  }
}

/**
 * Gera fotos mockadas para desenvolvimento
 * TODO: Remover quando integração real estiver implementada
 */
function generateMockPhotos(session_id: string): string[] {
  // Retorna array vazio por padrão
  // Em desenvolvimento, pode retornar URLs de exemplo
  if (process.env.NODE_ENV === 'development') {
    return [
      `https://pub-123456789.r2.dev/photos/${session_id}/photo1.jpg`,
      `https://pub-123456789.r2.dev/photos/${session_id}/photo2.jpg`
    ];
  }
  
  return [];
}

/**
 * POST /api/get-photos
 * Endpoint alternativo para consultas mais complexas
 */
export async function POST(request: NextRequest): Promise<NextResponse<GetPhotosResponse>> {
  try {
    const body = await request.json();
    const { session_id, include_metadata = false } = body;

    if (!session_id) {
      return NextResponse.json({
        success: false,
        message: 'session_id é obrigatório no body',
        error: 'MISSING_SESSION_ID'
      }, { status: 400 });
    }

    // Reutiliza a lógica do GET
    const mockRequest = new NextRequest(`${request.url}?session_id=${session_id}`);
    return GET(mockRequest);

  } catch (error) {
    console.error('[GET-PHOTOS] Erro no POST:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro ao processar requisição POST',
      error: error instanceof Error ? error.message : 'POST_ERROR'
    }, { status: 500 });
  }
}