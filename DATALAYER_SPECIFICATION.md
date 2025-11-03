# 📊 Especificação Completa da DataLayer - Recadinhos do Papai Noel

## 🎯 Visão Geral

Esta especificação define um sistema de **DataLayer inteligente e diferenciado por página**, permitindo tagueamento excepcional e fácil identificação de eventos em todas as plataformas de marketing digital.

### 🔑 Princípios Fundamentais
- **Diferenciação por Página**: Cada página tem eventos únicos e identificáveis
- **Hierarquia de Prioridade**: Eventos críticos, importantes e informativos
- **Compatibilidade Universal**: GA4, Meta Ads, TikTok Ads, Google Ads
- **Conformidade LGPD**: Dados anonimizados e consentimento

---

## 🏗️ Arquitetura da DataLayer

### Estrutura Base do Evento
```javascript
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  // Identificação única do evento
  event: 'page_specific_event_name',
  
  // Contexto da página
  page_context: {
    page_type: 'landing_page|step_1|step_2|step_3|checkout|thank_you',
    page_name: 'Nome legível da página',
    page_url: window.location.href,
    page_title: document.title,
    locale: 'pt|en|es'
  },
  
  // Dados do usuário (anonimizados)
  user_data: {
    session_id: 'uuid_v4',
    client_id: 'ga_client_id',
    user_agent_hash: 'hash_md5',
    timestamp: Date.now()
  },
  
  // UTMs e parâmetros de campanha
  campaign_data: {
    utm_source: 'source',
    utm_medium: 'medium', 
    utm_campaign: 'campaign',
    utm_term: 'term',
    utm_content: 'content',
    gclid: 'google_click_id',
    fbclid: 'facebook_click_id'
  },
  
  // Dados específicos do evento
  event_data: {
    // Varia conforme o tipo de evento
  }
});
```

---

## 📄 Eventos por Página

### 🏠 **Landing Page** (`page_type: 'landing_page'`)

#### 1. Page View
```javascript
{
  event: 'landing_page_view',
  event_data: {
    content_type: 'landing_page',
    content_id: 'home_page',
    referrer: document.referrer,
    scroll_depth: 0,
    time_on_page: 0
  }
}
```

#### 2. CTA Clicks (Diferenciados por Seção)
```javascript
// Hero Section
{
  event: 'landing_cta_click',
  event_data: {
    cta_type: 'primary',
    cta_text: 'Criar Vídeo Personalizado',
    cta_position: 'hero_section',
    cta_id: 'hero_create_video',
    destination: '/pers/1'
  }
}

// Product Carousel
{
  event: 'landing_cta_click',
  event_data: {
    cta_type: 'product',
    cta_text: 'Ver Produto',
    cta_position: 'product_carousel',
    cta_id: 'product_carousel_cta',
    product_position: 1
  }
}

// Video Section
{
  event: 'landing_cta_click',
  event_data: {
    cta_type: 'secondary',
    cta_text: 'Assistir Vídeo',
    cta_position: 'video_section',
    cta_id: 'video_section_watch'
  }
}
```

#### 3. Video Engagement
```javascript
{
  event: 'landing_video_engagement',
  event_data: {
    video_type: 'promotional',
    video_id: 'hero_video',
    action: 'play|pause|complete',
    progress_percentage: 25,
    duration_watched: 15000
  }
}
```

#### 4. Scroll Depth
```javascript
{
  event: 'landing_scroll_depth',
  event_data: {
    scroll_percentage: 25, // 25%, 50%, 75%, 100%
    sections_viewed: ['hero', 'products', 'video'],
    time_to_scroll: 30000
  }
}
```

### 🎯 **Step 1 - Quantidade** (`page_type: 'step_1'`)

#### 1. Page View
```javascript
{
  event: 'step_1_page_view',
  event_data: {
    content_type: 'personalization_step',
    step_number: 1,
    step_name: 'quantity_selection',
    funnel_position: 'step_1_of_3'
  }
}
```

#### 2. Quantity Selection
```javascript
{
  event: 'step_1_quantity_selected',
  event_data: {
    quantity_selected: 2,
    price_per_unit: 29.90,
    total_price: 59.80,
    discount_percentage: 15,
    selection_time: 5000 // tempo até seleção
  }
}
```

#### 3. Navigation
```javascript
{
  event: 'step_1_navigation',
  event_data: {
    action: 'continue|back',
    destination: '/pers/2',
    form_completion: 100,
    time_on_step: 45000
  }
}
```

### 🛍️ **Step 2 - Order Bumps** (`page_type: 'step_2'`)

#### 1. Page View
```javascript
{
  event: 'step_2_page_view',
  event_data: {
    content_type: 'order_bumps',
    step_number: 2,
    available_bumps: ['bump_1', 'bump_2', 'bump_3'],
    base_order_value: 59.80
  }
}
```

#### 2. Order Bump Interaction
```javascript
{
  event: 'step_2_bump_interaction',
  event_data: {
    bump_id: 'calendario_advento',
    bump_name: 'Calendário do Advento',
    action: 'add|remove',
    bump_price: 19.90,
    new_total: 79.70,
    interaction_time: 2000
  }
}
```

#### 3. Add to Cart
```javascript
{
  event: 'step_2_add_to_cart',
  event_data: {
    currency: 'BRL',
    value: 79.70,
    items: [
      {
        item_id: 'video_personalizado',
        item_name: 'Vídeo Personalizado',
        category: 'main_product',
        quantity: 2,
        price: 59.80
      },
      {
        item_id: 'calendario_advento',
        item_name: 'Calendário do Advento',
        category: 'order_bump',
        quantity: 1,
        price: 19.90
      }
    ]
  }
}
```

### 📝 **Step 3 - Dados** (`page_type: 'step_3'`)

#### 1. Page View
```javascript
{
  event: 'step_3_page_view',
  event_data: {
    content_type: 'data_collection',
    step_number: 3,
    required_fields: 8,
    cart_value: 79.70
  }
}
```

#### 2. Form Interaction
```javascript
{
  event: 'step_3_form_interaction',
  event_data: {
    field_name: 'child_name_1',
    field_type: 'text',
    action: 'focus|blur|change',
    form_completion_percentage: 25,
    validation_status: 'valid|invalid|pending'
  }
}
```

#### 3. Form Submission
```javascript
{
  event: 'step_3_form_submit',
  event_data: {
    submission_status: 'success|error',
    form_completion_time: 180000,
    fields_completed: 8,
    validation_errors: 0,
    children_count: 2,
    contact_method: 'email'
  }
}
```

#### 4. Begin Checkout
```javascript
{
  event: 'step_3_begin_checkout',
  event_data: {
    currency: 'BRL',
    value: 79.70,
    checkout_method: 'cartpanda',
    funnel_completion_time: 300000,
    items: [/* array de produtos */]
  }
}
```

### 💳 **Checkout Redirect** (`page_type: 'checkout'`)

#### 1. Checkout Initiated
```javascript
{
  event: 'checkout_initiated',
  event_data: {
    checkout_provider: 'cartpanda',
    redirect_url: 'https://checkout.cartpanda.com/...',
    order_value: 79.70,
    redirect_time: Date.now()
  }
}
```

### 🎉 **Thank You Page** (`page_type: 'thank_you'`)

#### 1. Purchase Completed
```javascript
{
  event: 'purchase_completed',
  event_data: {
    transaction_id: 'TXN_123456',
    currency: 'BRL',
    value: 79.70,
    order_id: 'ORDER_789',
    customer_id: 'CUST_456',
    items: [/* produtos comprados */],
    payment_method: 'credit_card'
  }
}
```

#### 2. Social Share
```javascript
{
  event: 'thank_you_social_share',
  event_data: {
    platform: 'whatsapp|facebook',
    share_type: 'purchase_celebration',
    order_value: 79.70
  }
}
```

---

## 🎯 Configuração por Plataforma

### 📊 **Google Analytics 4**

#### Configuração Principal (Funil Detalhado)
```javascript
// gtag config
gtag('config', 'GA_MEASUREMENT_ID_1', {
  custom_map: {
    'custom_parameter_1': 'page_type',
    'custom_parameter_2': 'step_number',
    'custom_parameter_3': 'cta_position'
  }
});

// Eventos personalizados
gtag('event', 'landing_cta_click', {
  page_type: 'landing_page',
  cta_position: 'hero_section',
  cta_text: 'Criar Vídeo',
  value: 0
});
```

#### Configuração Secundária (Conversões)
```javascript
// gtag config para conversões
gtag('config', 'GA_MEASUREMENT_ID_2', {
  send_page_view: false // Apenas eventos de conversão
});

// Apenas eventos críticos
gtag('event', 'purchase', {
  transaction_id: 'TXN_123',
  value: 79.70,
  currency: 'BRL'
});
```

### 📘 **Meta Ads (Facebook)**

#### Pixel Base
```javascript
fbq('init', 'PIXEL_ID');
fbq('track', 'PageView');

// Eventos personalizados com parâmetros
fbq('track', 'ViewContent', {
  content_type: 'landing_page',
  content_ids: ['home_page'],
  content_name: 'Landing Page View',
  value: 0,
  currency: 'BRL'
});
```

#### Conversions API
```javascript
// Dados para server-side tracking
{
  event_name: 'Purchase',
  event_time: Math.floor(Date.now() / 1000),
  user_data: {
    em: 'hashed_email',
    ph: 'hashed_phone',
    client_ip_address: 'user_ip',
    client_user_agent: 'user_agent'
  },
  custom_data: {
    currency: 'BRL',
    value: 79.70,
    content_ids: ['video_personalizado'],
    content_type: 'product'
  }
}
```

### 🎵 **TikTok Ads**

```javascript
ttq.load('TIKTOK_PIXEL_ID');
ttq.page();

// Eventos personalizados
ttq.track('ViewContent', {
  content_type: 'landing_page',
  content_id: 'home_page',
  value: 0,
  currency: 'BRL'
});

ttq.track('CompletePayment', {
  content_type: 'product',
  content_id: 'video_personalizado',
  value: 79.70,
  currency: 'BRL'
});
```

### 🔍 **Google Ads**

```javascript
// Conversões do Google Ads
gtag('event', 'conversion', {
  send_to: 'AW-CONVERSION_ID/CONVERSION_LABEL',
  value: 79.70,
  currency: 'BRL',
  transaction_id: 'TXN_123'
});

// Enhanced Conversions
gtag('event', 'conversion', {
  send_to: 'AW-CONVERSION_ID/CONVERSION_LABEL',
  user_data: {
    email_address: 'user@email.com',
    phone_number: '+5511999999999'
  }
});
```

---

## 🔄 Fluxo de Envio de Dados

### 1. **Coleta de Dados**
```
Evento Disparado → Validação → Enriquecimento → Fila de Envio
```

### 2. **Priorização**
- **Alta Prioridade**: Envio imediato (conversões, erros críticos)
- **Média Prioridade**: Batch a cada 5 segundos
- **Baixa Prioridade**: Batch a cada 30 segundos

### 3. **Validação em Tempo Real**
```javascript
const validateEvent = (eventData) => {
  const required = ['event', 'page_context', 'user_data', 'timestamp'];
  const missing = required.filter(field => !eventData[field]);
  
  if (missing.length > 0) {
    console.error('Campos obrigatórios ausentes:', missing);
    return false;
  }
  
  return true;
};
```

### 4. **Tratamento de Erros**
```javascript
const handleTrackingError = (error, eventData) => {
  // Log do erro
  console.error('Erro no tracking:', error);
  
  // Tentar reenvio
  setTimeout(() => {
    sendEvent(eventData);
  }, 5000);
  
  // Fallback para localStorage
  localStorage.setItem('failed_events', JSON.stringify([
    ...getFailedEvents(),
    { ...eventData, error: error.message, retry_count: 1 }
  ]));
};
```

---

## 📋 Diferenciação nas Plataformas

### 🎯 **Como Identificar Eventos por Página**

#### No Google Analytics 4
```
Relatórios > Eventos > 
- landing_page_view (Landing Page)
- step_1_page_view (Step 1)
- step_2_page_view (Step 2)
- step_3_page_view (Step 3)
```

#### No Meta Ads Manager
```
Eventos > Eventos Personalizados >
- ViewContent (content_type: landing_page)
- ViewContent (content_type: personalization_step)
- AddToCart (step_2)
- InitiateCheckout (step_3)
```

#### Segmentação Avançada
```javascript
// Exemplo de segmentação por página
const pageSegments = {
  landing_page: {
    ga4_event_prefix: 'landing_',
    fb_content_type: 'landing_page',
    tiktok_content_type: 'homepage'
  },
  step_1: {
    ga4_event_prefix: 'step_1_',
    fb_content_type: 'personalization_step',
    tiktok_content_type: 'product_selection'
  }
  // ... outros steps
};
```

---

## 🛡️ Conformidade LGPD

### Dados Coletados (Anonimizados)
- ✅ Session ID (UUID)
- ✅ Timestamps
- ✅ Comportamento de navegação
- ✅ Interações com elementos
- ❌ Dados pessoais identificáveis (sem consentimento)

### Consentimento
```javascript
const trackWithConsent = (eventData) => {
  const hasConsent = getCookieConsent();
  
  if (hasConsent) {
    // Tracking completo
    sendToAllPlatforms(eventData);
  } else {
    // Tracking básico (apenas essencial)
    sendEssentialTracking(eventData);
  }
};
```

---

## 🚀 Implementação Técnica

### Estrutura de Arquivos
```
src/
├── lib/
│   ├── dataLayer/
│   │   ├── core.ts           # Core da DataLayer
│   │   ├── events.ts         # Definições de eventos
│   │   ├── validators.ts     # Validadores
│   │   ├── platforms/        # Integrações específicas
│   │   │   ├── ga4.ts
│   │   │   ├── facebook.ts
│   │   │   ├── tiktok.ts
│   │   │   └── google-ads.ts
│   │   └── utils.ts          # Utilitários
│   └── tracking/
│       ├── pageTracking.ts   # Tracking por página
│       └── eventQueue.ts     # Fila de eventos
```

### Inicialização
```javascript
// app/layout.tsx
import { DataLayerProvider } from '@/lib/dataLayer/core';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <DataLayerProvider>
          {children}
        </DataLayerProvider>
      </body>
    </html>
  );
}
```

---

## 📊 Métricas e KPIs

### Por Página
- **Landing Page**: Taxa de clique em CTAs, tempo na página, scroll depth
- **Step 1**: Taxa de seleção de quantidade, tempo até decisão
- **Step 2**: Taxa de adição de order bumps, AOV médio
- **Step 3**: Taxa de preenchimento de formulário, taxa de conversão

### Globais
- **Funil Completo**: Taxa de conversão por etapa
- **Qualidade de Tráfego**: Engajamento por fonte
- **Performance de Campanhas**: ROAS por plataforma

---

*Especificação criada para maximizar a diferenciação e rastreabilidade de eventos em todas as páginas do funil de conversão.*