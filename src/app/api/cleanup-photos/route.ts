import { NextRequest, NextResponse } from 'next/server';
import { previewCleanup, executeCleanup, CleanupResult } from '@/lib/photo-cleanup';

// Interface para requisição de cleanup
interface CleanupRequest {
  action: 'preview' | 'execute';
  max_age_days?: number;
  create_backup?: boolean;
  dry_run?: boolean;
}

// Interface para resposta do cleanup
interface CleanupResponse {
  success: boolean;
  message: string;
  data?: CleanupResult;
  error?: string;
}

/**
 * POST /api/cleanup-photos
 * Endpoint para gerenciar cleanup de fotos órfãs
 */
export async function POST(request: NextRequest): Promise<NextResponse<CleanupResponse>> {
  try {
    const body: CleanupRequest = await request.json();
    const { action, max_age_days = 30, create_backup = true, dry_run } = body;

    // Validação da ação
    if (!action || !['preview', 'execute'].includes(action)) {
      return NextResponse.json({
        success: false,
        message: 'Ação inválida. Use "preview" ou "execute"',
        error: 'INVALID_ACTION'
      }, { status: 400 });
    }

    console.log(`[CLEANUP-API] Iniciando ${action} com max_age_days=${max_age_days}`);

    let result: CleanupResult;

    // Executa a ação solicitada
    switch (action) {
      case 'preview':
        result = await previewCleanup(max_age_days);
        break;
        
      case 'execute':
        // Validação adicional para execução real
        if (dry_run !== false) {
          return NextResponse.json({
            success: false,
            message: 'Para executar cleanup real, defina dry_run=false explicitamente',
            error: 'SAFETY_CHECK_FAILED'
          }, { status: 400 });
        }
        
        result = await executeCleanup(max_age_days, create_backup);
        break;
        
      default:
        throw new Error('Ação não implementada');
    }

    // Determina status da resposta
    const statusCode = result.success ? 200 : 500;
    const message = result.success 
      ? `${action === 'preview' ? 'Preview' : 'Cleanup'} concluído com sucesso`
      : `Erro durante ${action}`;

    return NextResponse.json({
      success: result.success,
      message,
      data: result
    }, { status: statusCode });

  } catch (error) {
    console.error('[CLEANUP-API] Erro:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

/**
 * GET /api/cleanup-photos?action=preview&max_age_days=30
 * Endpoint para preview rápido via GET
 */
export async function GET(request: NextRequest): Promise<NextResponse<CleanupResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'preview';
    const maxAgeDays = parseInt(searchParams.get('max_age_days') || '30');

    // Apenas permite preview via GET por segurança
    if (action !== 'preview') {
      return NextResponse.json({
        success: false,
        message: 'Apenas preview é permitido via GET. Use POST para outras ações',
        error: 'GET_PREVIEW_ONLY'
      }, { status: 400 });
    }

    console.log(`[CLEANUP-API] Preview via GET com max_age_days=${maxAgeDays}`);

    const result = await previewCleanup(maxAgeDays);

    return NextResponse.json({
      success: result.success,
      message: 'Preview concluído',
      data: result
    }, { status: result.success ? 200 : 500 });

  } catch (error) {
    console.error('[CLEANUP-API] Erro no GET:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}