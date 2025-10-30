import { NextRequest, NextResponse } from 'next/server';
import { uploadMultiplePhotos } from '@/lib/r2-upload';
import { sendToN8NWebhook, N8NWebhookPayload, N8NWebhookResponse } from '@/lib/n8n-webhook';

// Interface para o payload de salvamento de fotos
interface SavePhotosPayload {
  session_id: string;
  fotos: string[];
  nome?: string;
  email?: string;
  telefone?: string;
  cpf?: string;
}

// Interface para resposta do endpoint
interface SavePhotosResponse {
  success: boolean;
  message: string;
  data?: {
    session_id: string;
    fotos_salvas: string[];
    postgres_response?: N8NWebhookResponse;
  };
  error?: string;
}

/**
 * POST /api/save-photos
 * Endpoint para fazer upload de fotos no R2 e salvar URLs no PostgreSQL
 */
export async function POST(request: NextRequest): Promise<NextResponse<SavePhotosResponse>> {
  try {
    const formData = await request.formData();
    const session_id = formData.get('session_id') as string;
    
    // Validação do session_id
    if (!session_id) {
      return NextResponse.json({
        success: false,
        message: 'session_id é obrigatório',
        error: 'MISSING_SESSION_ID'
      }, { status: 400 });
    }

    // Extrai arquivos do FormData
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('file') && value instanceof File) {
        files.push(value);
      }
    }

    // Validação de arquivos
    if (files.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Nenhum arquivo foi enviado',
        error: 'NO_FILES'
      }, { status: 400 });
    }

    if (files.length > 3) {
      return NextResponse.json({
        success: false,
        message: 'Máximo de 3 fotos permitidas',
        error: 'TOO_MANY_FILES'
      }, { status: 400 });
    }

    // 1. Upload das fotos para o R2
    console.log(`[SAVE-PHOTOS] Iniciando upload de ${files.length} fotos para R2...`);
    const uploadResult = await uploadMultiplePhotos(files, session_id);
    
    if (!uploadResult.success || !uploadResult.urls) {
      return NextResponse.json({
        success: false,
        message: 'Erro no upload das fotos para R2',
        error: uploadResult.errors.join('; ') || 'UPLOAD_FAILED'
      }, { status: 500 });
    }

    console.log(`[SAVE-PHOTOS] Upload concluído. URLs: ${uploadResult.urls.join(', ')}`);

    // 2. Prepara payload para salvar no PostgreSQL via N8N
    const savePayload: SavePhotosPayload = {
      session_id,
      fotos: uploadResult.urls,
      nome: formData.get('nome') as string || undefined,
      email: formData.get('email') as string || undefined,
      telefone: formData.get('telefone') as string || undefined,
      cpf: formData.get('cpf') as string || undefined,
    };

    // 3. Monta payload do N8N para salvar no PostgreSQL
    const n8nPayload: Partial<N8NWebhookPayload> = {
      informacoes_contato: {
        nome: savePayload.nome || '',
        email: savePayload.email || '',
        telefone: savePayload.telefone || '',
        cpf: savePayload.cpf || '',
      },
      informacoes_pers: {
        criancas: [], // Será preenchido posteriormente
        fotos: savePayload.fotos,
        mensagem: '', // Será preenchido posteriormente
        order_bumps_site: [], // Será preenchido posteriormente
      },
      informacoes_utms: {
        session_id: savePayload.session_id,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        locale: 'pt-BR',
        total_criancas: 0,
        incluir_fotos: true,
        prioridade: null,
      },
    };

    // 4. Envia para N8N salvar no PostgreSQL
    console.log(`[SAVE-PHOTOS] Salvando URLs no PostgreSQL via N8N...`);
    const n8nResult = await sendToN8NWebhook(n8nPayload as N8NWebhookPayload);
    
    if (!n8nResult.success) {
      console.error(`[SAVE-PHOTOS] Erro ao salvar no PostgreSQL:`, n8nResult.error);
      // Mesmo com erro no PostgreSQL, retornamos sucesso do upload
      return NextResponse.json({
        success: true,
        message: 'Fotos enviadas para R2, mas houve erro ao salvar no PostgreSQL',
        data: {
          session_id,
          fotos_salvas: uploadResult.urls,
        },
        error: `POSTGRES_ERROR: ${n8nResult.error}`
      }, { status: 207 }); // 207 Multi-Status
    }

    console.log(`[SAVE-PHOTOS] Processo concluído com sucesso`);

    // 5. Retorna sucesso completo
    return NextResponse.json({
      success: true,
      message: `${uploadResult.urls.length} fotos salvas com sucesso no R2 e PostgreSQL`,
      data: {
        session_id,
        fotos_salvas: uploadResult.urls,
        postgres_response: n8nResult.response,
      }
    }, { status: 200 });

  } catch (error) {
    console.error('[SAVE-PHOTOS] Erro interno:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

/**
 * GET /api/save-photos?session_id=xxx
 * Endpoint para recuperar URLs de fotos salvas no PostgreSQL
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get('session_id');

    if (!session_id) {
      return NextResponse.json({
        success: false,
        message: 'session_id é obrigatório',
        error: 'MISSING_SESSION_ID'
      }, { status: 400 });
    }

    // TODO: Implementar consulta ao PostgreSQL via N8N
    // Por enquanto retorna placeholder
    return NextResponse.json({
      success: false,
      message: 'Funcionalidade de consulta ainda não implementada',
      error: 'NOT_IMPLEMENTED'
    }, { status: 501 });

  } catch (error) {
    console.error('[SAVE-PHOTOS] Erro ao consultar fotos:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}