// Server-Side Tracking para máxima correspondência
// Conversions API (Facebook) + Enhanced Conversions (Google)

import crypto from 'crypto';

// Tipos para Server-Side Tracking
type EventParameters = Record<string, string | number | boolean | undefined>;
type UserDataInput = {
  email?: string | number;
  phone?: string | number;
  first_name?: string | number;
  last_name?: string | number;
  city?: string | number;
  state?: string | number;
  zip_code?: string | number;
  country?: string | number;
  external_id?: string | number;
  [key: string]: string | number | undefined;
};
type EventDataInput = Record<string, string | number | boolean | undefined>;
type PurchaseData = {
  value?: number;
  currency?: string;
  transaction_id?: string;
  items?: Array<Record<string, string | number>>;
};
type LeadData = Record<string, string | number | undefined>;
type ContentData = {
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  value?: number;
  currency?: string;
};

interface ServerSideEventData {
  event_name: string;
  event_time: number;
  user_data: {
    email?: string;
    phone?: string;
    first_name?: string;
    last_name?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
    external_id?: string;
    client_ip_address?: string;
    client_user_agent?: string;
    fbc?: string; // Facebook Click ID
    fbp?: string; // Facebook Browser ID
  };
  custom_data?: {
    value?: number;
    currency?: string;
    content_ids?: string[];
    content_type?: string;
    content_name?: string;
    content_category?: string;
    num_items?: number;
    order_id?: string;
    delivery_category?: string;
  };
  event_source_url?: string;
  action_source: 'website' | 'email' | 'app' | 'phone_call' | 'chat' | 'physical_store' | 'system_generated' | 'other';
}

interface GoogleEnhancedConversionData {
  email?: string;
  phone_number?: string;
  first_name?: string;
  last_name?: string;
  street?: string;
  city?: string;
  region?: string;
  postal_code?: string;
  country?: string;
}

// Função para hash SHA-256 (necessário para alguns dados)
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Normalizar dados do usuário
function normalizeUserData(userData: UserDataInput) {
  const normalized: Record<string, string> = {};
  
  if (userData.email) {
    normalized.email = String(userData.email).toLowerCase().trim();
  }
  
  if (userData.phone) {
    // Remover caracteres não numéricos e adicionar código do país se necessário
    const phone = String(userData.phone).replace(/\D/g, '');
    normalized.phone = phone.startsWith('55') ? phone : `55${phone}`;
  }
  
  if (userData.first_name) {
    normalized.first_name = String(userData.first_name).toLowerCase().trim();
  }
  
  if (userData.last_name) {
    normalized.last_name = String(userData.last_name).toLowerCase().trim();
  }
  
  if (userData.city) {
    normalized.city = String(userData.city).toLowerCase().trim();
  }
  
  if (userData.state) {
    normalized.state = String(userData.state).toLowerCase().trim();
  }
  
  if (userData.zip_code) {
    normalized.zip_code = String(userData.zip_code).replace(/\D/g, '');
  }
  
  if (userData.country) {
    normalized.country = String(userData.country).toLowerCase().trim();
  }
  
  return normalized;
}

// Obter dados do cliente (IP, User Agent, etc.)
function getClientData(request?: Request) {
  if (typeof window !== 'undefined') {
    // Client-side
    return {
      client_ip_address: '', // Será preenchido pelo servidor
      client_user_agent: navigator.userAgent,
      event_source_url: window.location.href
    };
  } else if (request) {
    // Server-side
    return {
      client_ip_address: request.headers.get('x-forwarded-for') || 
                        request.headers.get('x-real-ip') || 
                        'unknown',
      client_user_agent: request.headers.get('user-agent') || '',
      event_source_url: request.url
    };
  }
  
  return {};
}

// Facebook Conversions API
export async function sendFacebookConversion(eventData: ServerSideEventData) {
  if (!process.env.FACEBOOK_ACCESS_TOKEN || !process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID) {
    console.warn('Facebook Conversions API: Token ou Pixel ID não configurado');
    return;
  }

  try {
    const payload = {
      data: [{
        event_name: eventData.event_name,
        event_time: eventData.event_time,
        user_data: normalizeUserData(eventData.user_data),
        custom_data: eventData.custom_data,
        event_source_url: eventData.event_source_url,
        action_source: eventData.action_source
      }],
      test_event_code: process.env.FACEBOOK_TEST_EVENT_CODE // Para testes
    };

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID}/events`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.FACEBOOK_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`Facebook API Error: ${JSON.stringify(result)}`);
    }

    console.log('Facebook Conversion enviada:', result);
    return result;
    
  } catch (error) {
    console.error('Erro ao enviar Facebook Conversion:', error);
    throw error;
  }
}

// Google Enhanced Conversions (Measurement Protocol GA4)
export async function sendGoogleEnhancedConversion(
  eventName: string,
  userData: GoogleEnhancedConversionData,
  eventParams: EventParameters = {}
) {
  if (!process.env.GA4_MEASUREMENT_ID || !process.env.GA4_API_SECRET) {
    console.warn('Google Enhanced Conversions: Measurement ID ou API Secret não configurado');
    return;
  }

  try {
    const clientId = eventParams.client_id || `${Date.now()}.${Math.random()}`;
    
    const payload = {
      client_id: clientId,
      user_id: eventParams.user_id,
      timestamp_micros: (Date.now() * 1000).toString(),
      user_properties: {
        session_id: { value: eventParams.session_id }
      },
      events: [{
        name: eventName,
        params: {
          ...eventParams,
          // Enhanced Conversions - dados hasheados
          user_data: {
            email_address: userData.email ? await sha256(userData.email) : undefined,
            phone_number: userData.phone_number ? await sha256(userData.phone_number) : undefined,
            first_name: userData.first_name ? await sha256(userData.first_name) : undefined,
            last_name: userData.last_name ? await sha256(userData.last_name) : undefined,
            street: userData.street ? await sha256(userData.street) : undefined,
            city: userData.city ? await sha256(userData.city) : undefined,
            region: userData.region ? await sha256(userData.region) : undefined,
            postal_code: userData.postal_code ? await sha256(userData.postal_code) : undefined,
            country: userData.country ? await sha256(userData.country) : undefined
          }
        }
      }]
    };

    const response = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${process.env.GA4_MEASUREMENT_ID}&api_secret=${process.env.GA4_API_SECRET}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      throw new Error(`Google API Error: ${response.status} ${response.statusText}`);
    }

    console.log('Google Enhanced Conversion enviada');
    return true;
    
  } catch (error) {
    console.error('Erro ao enviar Google Enhanced Conversion:', error);
    throw error;
  }
}

// TikTok Events API
export async function sendTikTokEvent(eventData: EventDataInput) {
  if (!process.env.TIKTOK_ACCESS_TOKEN || !process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID) {
    console.warn('TikTok Events API: Token ou Pixel ID não configurado');
    return;
  }

  try {
    const payload = {
      pixel_code: process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID,
      event: eventData.event_name,
      event_id: eventData.event_id || `${Date.now()}_${Math.random()}`,
      timestamp: eventData.event_time || Math.floor(Date.now() / 1000),
      context: {
        user_agent: eventData.user_data?.client_user_agent,
        ip: eventData.user_data?.client_ip_address,
        page: {
          url: eventData.event_source_url
        },
        user: {
          email: eventData.user_data?.email,
          phone: eventData.user_data?.phone,
          external_id: eventData.user_data?.external_id
        }
      },
      properties: eventData.custom_data || {}
    };

    const response = await fetch('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
      method: 'POST',
      headers: {
        'Access-Token': process.env.TIKTOK_ACCESS_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`TikTok API Error: ${JSON.stringify(result)}`);
    }

    console.log('TikTok Event enviado:', result);
    return result;
    
  } catch (error) {
    console.error('Erro ao enviar TikTok Event:', error);
    throw error;
  }
}

// Função principal para enviar para todas as plataformas
export async function sendServerSideEvent(
  eventName: string,
  userData: UserDataInput,
  eventData: EventDataInput = {},
  request?: Request
) {
  const clientData = getClientData(request);
  const eventTime = Math.floor(Date.now() / 1000);
  
  // Preparar dados base
  const baseEventData: ServerSideEventData = {
    event_name: eventName,
    event_time: eventTime,
    user_data: {
      ...normalizeUserData(userData),
      ...clientData
    },
    custom_data: eventData,
    action_source: 'website',
    ...clientData
  };

  const promises = [];

  // Facebook Conversions API
  promises.push(
    sendFacebookConversion(baseEventData).catch(error => 
      console.error('Facebook Conversion falhou:', error)
    )
  );

  // Google Enhanced Conversions
  promises.push(
    sendGoogleEnhancedConversion(eventName, userData, {
      ...eventData,
      client_id: eventData.client_id,
      session_id: eventData.session_id
    }).catch(error => 
      console.error('Google Enhanced Conversion falhou:', error)
    )
  );

  // TikTok Events API
  promises.push(
    sendTikTokEvent({
      ...baseEventData,
      event_id: eventData.event_id
    }).catch(error => 
      console.error('TikTok Event falhou:', error)
    )
  );

  // Executar todas as chamadas em paralelo
  await Promise.allSettled(promises);
}

// Funções específicas para eventos comuns
export const serverSideTracking = {
  // Compra
  purchase: async (userData: UserDataInput, purchaseData: PurchaseData, request?: Request) => {
    await sendServerSideEvent('Purchase', userData, {
      value: purchaseData.value,
      currency: purchaseData.currency || 'BRL',
      content_ids: purchaseData.items?.map((item: Record<string, string | number>) => item.item_id) || [],
      content_type: 'product',
      num_items: purchaseData.items?.length || 1,
      order_id: purchaseData.transaction_id,
      ...purchaseData
    }, request);
  },

  // Lead
  lead: async (userData: UserDataInput, leadData: LeadData = {}, request?: Request) => {
    await sendServerSideEvent('Lead', userData, {
      content_name: leadData.form_name || 'Contact Form',
      content_category: leadData.category || 'lead_generation',
      ...leadData
    }, request);
  },

  // Cadastro
  completeRegistration: async (userData: UserDataInput, request?: Request) => {
    await sendServerSideEvent('CompleteRegistration', userData, {
      content_name: 'User Registration',
      content_category: 'registration'
    }, request);
  },

  // Visualização de conteúdo
  viewContent: async (userData: UserDataInput, contentData: ContentData, request?: Request) => {
    await sendServerSideEvent('ViewContent', userData, {
      content_ids: [contentData.content_id],
      content_type: contentData.content_type || 'product',
      content_name: contentData.content_name,
      content_category: contentData.content_category,
      value: contentData.value,
      currency: contentData.currency || 'BRL'
    }, request);
  }
};

export default serverSideTracking;