import { NextRequest, NextResponse } from 'next/server';
import { serverSideTracking } from '@/lib/serverSideTracking';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event_name, user_data, event_data } = body;

    if (!event_name || !user_data) {
      return NextResponse.json(
        { error: 'event_name e user_data são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar dados do usuário
    if (!user_data.email && !user_data.phone) {
      return NextResponse.json(
        { error: 'Email ou telefone são obrigatórios para Enhanced Conversions' },
        { status: 400 }
      );
    }

    // Executar tracking baseado no tipo de evento
    switch (event_name.toLowerCase()) {
      case 'purchase':
        await serverSideTracking.purchase(user_data, event_data, request);
        break;
        
      case 'lead':
        await serverSideTracking.lead(user_data, event_data, request);
        break;
        
      case 'completeregistration':
        await serverSideTracking.completeRegistration(user_data, request);
        break;
        
      case 'viewcontent':
        await serverSideTracking.viewContent(user_data, event_data, request);
        break;
        
      default:
        // Para eventos personalizados, usar a função genérica
        const { sendServerSideEvent } = await import('@/lib/serverSideTracking');
        await sendServerSideEvent(event_name, user_data, event_data, request);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Evento enviado com sucesso para todas as plataformas',
      event_name,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro no server-side tracking:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

// Endpoint para validar configuração
export async function GET() {
  const config = {
    facebook_configured: !!(process.env.FACEBOOK_ACCESS_TOKEN && process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID),
    google_configured: !!(process.env.GA4_MEASUREMENT_ID && process.env.GA4_API_SECRET),
    tiktok_configured: !!(process.env.TIKTOK_ACCESS_TOKEN && process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID),
    environment: process.env.NODE_ENV
  };

  return NextResponse.json({
    message: 'Server-Side Tracking API',
    configuration: config,
    endpoints: {
      track: '/api/tracking (POST)',
      validate: '/api/tracking (GET)'
    },
    required_env_vars: {
      facebook: ['FACEBOOK_ACCESS_TOKEN', 'NEXT_PUBLIC_FACEBOOK_PIXEL_ID'],
      google: ['GA4_MEASUREMENT_ID', 'GA4_API_SECRET'],
      tiktok: ['TIKTOK_ACCESS_TOKEN', 'NEXT_PUBLIC_TIKTOK_PIXEL_ID']
    }
  });
}