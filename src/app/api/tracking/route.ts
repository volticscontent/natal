import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Ler texto bruto para evitar erro de JSON vazio
    const raw = await request.text();

    // Se corpo estiver vazio, responder de forma segura
    if (!raw || raw.trim() === '') {
      if (process.env.NODE_ENV === 'development') {
        console.warn('📊 [Tracking API] Corpo vazio recebido em POST /api/tracking');
      }
      return NextResponse.json({
        success: true,
        message: 'Nenhum evento enviado',
        processed_events: 0
      });
    }

    // Tentar parsear JSON com fallback
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>;
    } catch (parseError) {
      console.warn('📊 [Tracking API] JSON inválido recebido:', parseError);
      return NextResponse.json(
        { success: false, error: 'JSON inválido no corpo da requisição' },
        { status: 400 }
      );
    }
    const events = Array.isArray((parsed as Record<string, unknown>).events) ? (parsed as { events: unknown[] }).events : [];
    const sessionId = (parsed as Record<string, unknown>).session_id as string | undefined;

    // Log dos eventos de tracking para desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 [Tracking API] Eventos recebidos:', {
        session_id: sessionId,
        events_count: events.length || 0,
        events
      });
    }
    
    // Aqui você pode implementar a lógica para salvar os eventos
    // Por exemplo: salvar em banco de dados, enviar para analytics, etc.
    
    return NextResponse.json({ 
      success: true, 
      message: 'Eventos de tracking recebidos com sucesso',
      processed_events: events.length || 0
    });
    
  } catch (error) {
    console.error('Erro no endpoint de tracking:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Endpoint de tracking ativo',
    timestamp: new Date().toISOString()
  });
}
