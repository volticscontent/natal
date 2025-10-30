import { NextRequest, NextResponse } from 'next/server';
import { uploadMultiplePhotos } from '@/lib/r2-upload';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extrai session_id
    const sessionId = formData.get('session_id') as string;
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID é obrigatório' },
        { status: 400 }
      );
    }

    // Extrai arquivos
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('photo_') && value instanceof File) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nenhuma foto foi enviada' },
        { status: 400 }
      );
    }

    if (files.length > 3) {
      return NextResponse.json(
        { success: false, error: 'Máximo de 3 fotos permitidas' },
        { status: 400 }
      );
    }

    // Faz upload das fotos
    const uploadResult = await uploadMultiplePhotos(files, sessionId);

    if (!uploadResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erro no upload das fotos',
          details: uploadResult.errors 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${uploadResult.urls.length} foto(s) enviada(s) com sucesso`,
      data: {
        urls: uploadResult.urls,
        count: uploadResult.urls.length,
        session_id: sessionId,
      },
    });

  } catch (error) {
    console.error('Erro na API de upload:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// Método para gerar URLs pré-assinadas (opcional)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    const fileName = searchParams.get('file_name');
    const contentType = searchParams.get('content_type');

    if (!sessionId || !fileName || !contentType) {
      return NextResponse.json(
        { success: false, error: 'Parâmetros obrigatórios: session_id, file_name, content_type' },
        { status: 400 }
      );
    }

    const { generatePresignedUrl } = await import('@/lib/r2-upload');
    const result = await generatePresignedUrl(fileName, sessionId, contentType);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      presigned_url: result.url,
      session_id: sessionId,
    });

  } catch (error) {
    console.error('Erro ao gerar URL pré-assinada:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}