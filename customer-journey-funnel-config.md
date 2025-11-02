# 🎯 Configuração Completa de Funis GA4 - Recadinhos do Papai Noel

## 📊 Mapeamento da Jornada do Cliente

### 🔄 Fluxo Principal da Conversão

```
AWARENESS → INTEREST → CONSIDERATION → INTENT → PURCHASE → RETENTION
    ↓         ↓           ↓            ↓         ↓          ↓
 Homepage → Video → Personalization → Checkout → Thank You → Follow-up
```

### 🛣️ Etapas Detalhadas da Jornada

#### 1. **AWARENESS** - Página Inicial (`/[locale]`)
- **Objetivo**: Despertar interesse no produto
- **Eventos GA4 Configurados**:
  - `page_view` - Visualização da página inicial
  - `video_engagement` - Interação com vídeo promocional
  - `scroll` - Profundidade de scroll (25%, 50%, 75%, 100%)
  - `user_engagement` - Tempo na página

#### 2. **INTEREST** - Seções de Engajamento
- **Objetivo**: Educar sobre o produto e criar desejo
- **Eventos GA4 Configurados**:
  - `view_promotion` - Visualização de banners promocionais
  - `select_promotion` - Clique em CTAs promocionais
  - `video_play` - Reprodução do vídeo demonstrativo
  - `video_progress` - Progresso do vídeo (25%, 50%, 75%, 100%)

#### 3. **CONSIDERATION** - Início da Personalização (`/[locale]/pers`)
- **Objetivo**: Capturar intenção de compra
- **Eventos GA4 Configurados**:
  - `begin_checkout` - Início do processo de personalização
  - `view_item_list` - Visualização de opções de produtos
  - `select_item` - Seleção de quantidade de crianças

#### 4. **INTENT** - Processo de Personalização
- **Etapa 1** - Quantidade de Crianças (`/[locale]/pers/1`):
  - `view_item` - Visualização de produto específico
  - `add_to_cart` - Seleção de quantidade de crianças
  
- **Etapa 2** - Order Bumps (`/[locale]/pers/2`):
  - `view_promotion` - Visualização de upsells
  - `select_promotion` - Seleção de order bumps
  - `add_to_cart` - Adição de complementos

- **Etapa 3** - Dados das Crianças (`/[locale]/pers/3`):
  - `form_start` - Início do preenchimento de dados
  - `form_submit` - Envio dos dados das crianças
  - `generate_lead` - Captura de dados de contato

#### 5. **PURCHASE** - Checkout Externo
- **Objetivo**: Finalizar a compra
- **Eventos GA4 Configurados**:
  - `begin_checkout` - Redirecionamento para checkout
  - `add_payment_info` - Adição de informações de pagamento
  - `purchase` - Compra finalizada (via webhook)

#### 6. **RETENTION** - Pós-Compra (`/[locale]/obrigado/[provider]`)
- **Objetivo**: Confirmar compra e incentivar compartilhamento
- **Eventos GA4 Configurados**:
  - `purchase` - Confirmação da compra
  - `share` - Compartilhamento nas redes sociais
  - `view_item` - Visualização de produtos relacionados

## 🎯 Configuração de Funis GA4

### 🔥 Funil Principal de Conversão

```javascript
// Configuração do Funil Principal no GA4
const mainConversionFunnel = {
  name: "Funil Principal - Recadinhos do Papai Noel",
  steps: [
    {
      name: "Página Inicial",
      event: "page_view",
      conditions: {
        page_location: "contains /pt OR /en OR /es",
        page_title: "contains Recadinhos do Papai Noel"
      }
    },
    {
      name: "Engajamento com Vídeo",
      event: "video_play",
      conditions: {
        video_title: "contains promotional OR demo"
      }
    },
    {
      name: "Início da Personalização",
      event: "begin_checkout",
      conditions: {
        page_location: "contains /pers"
      }
    },
    {
      name: "Seleção de Produto",
      event: "add_to_cart",
      conditions: {
        item_category: "main_product"
      }
    },
    {
      name: "Dados Preenchidos",
      event: "form_submit",
      conditions: {
        form_name: "children_data"
      }
    },
    {
      name: "Compra Finalizada",
      event: "purchase",
      conditions: {
        currency: "BRL OR USD"
      }
    }
  ]
};
```

### 📈 Funis Secundários

#### 1. **Funil de Engajamento de Vídeo**
```javascript
const videoEngagementFunnel = {
  name: "Engajamento de Vídeo",
  steps: [
    { name: "Visualização da Página", event: "page_view" },
    { name: "Início do Vídeo", event: "video_play" },
    { name: "25% do Vídeo", event: "video_progress", video_percent: 25 },
    { name: "50% do Vídeo", event: "video_progress", video_percent: 50 },
    { name: "Vídeo Completo", event: "video_complete" },
    { name: "CTA Clicado", event: "select_promotion" }
  ]
};
```

#### 2. **Funil de Personalização**
```javascript
const personalizationFunnel = {
  name: "Processo de Personalização",
  steps: [
    { name: "Entrada na Personalização", event: "page_view", page_location: "contains /pers" },
    { name: "Etapa 1 - Quantidade", event: "view_item_list" },
    { name: "Etapa 2 - Order Bumps", event: "view_promotion" },
    { name: "Etapa 3 - Dados", event: "form_start" },
    { name: "Checkout Iniciado", event: "begin_checkout" }
  ]
};
```

#### 3. **Funil de Order Bumps**
```javascript
const orderBumpsFunnel = {
  name: "Conversão de Order Bumps",
  steps: [
    { name: "Visualização de Upsells", event: "view_promotion" },
    { name: "Seleção de 4K", event: "select_promotion", promotion_name: "4k-quality" },
    { name: "Seleção de Entrega Rápida", event: "select_promotion", promotion_name: "fast-delivery" },
    { name: "Seleção de Fotos", event: "select_promotion", promotion_name: "child-photo" },
    { name: "Combo Selecionado", event: "select_promotion", promotion_name: "combo" }
  ]
};
```

## 🔧 Eventos Personalizados Configurados

### 📊 Eventos de E-commerce
```javascript
// Eventos já implementados no código
const ecommerceEvents = {
  // Visualização de produtos
  view_item: {
    currency: "BRL",
    value: "product_price",
    items: [{ item_id, item_name, item_category, price, quantity }]
  },
  
  // Adição ao carrinho
  add_to_cart: {
    currency: "BRL", 
    value: "total_value",
    items: "cart_items"
  },
  
  // Início do checkout
  begin_checkout: {
    currency: "BRL",
    value: "cart_total",
    items: "checkout_items"
  },
  
  // Compra finalizada
  purchase: {
    transaction_id: "order_id",
    value: "order_total",
    currency: "BRL",
    items: "purchased_items"
  }
};
```

### 🎯 Eventos de Conversão
```javascript
const conversionEvents = {
  // Lead generation
  generate_lead: {
    currency: "BRL",
    value: "lead_value",
    lead_source: "website"
  },
  
  // Personalização completa
  personalization_complete: {
    step_count: "total_steps",
    completion_time: "time_seconds",
    conversion_type: "completion"
  },
  
  // Engajamento de vídeo
  video_engagement: {
    video_title: "video_name",
    video_action: "play|pause|complete",
    video_progress: "percentage"
  }
};
```

## 📈 Métricas e KPIs Configurados

### 🎯 Conversões Principais
- **Taxa de Conversão Geral**: `purchase` / `page_view` (homepage)
- **Taxa de Conversão do Funil**: `purchase` / `begin_checkout`
- **Valor Médio do Pedido**: Média do `value` em eventos `purchase`
- **Taxa de Abandono**: Usuários que não completam após `begin_checkout`

### 📊 Métricas de Engajamento
- **Engajamento de Vídeo**: `video_complete` / `video_play`
- **Profundidade de Scroll**: Distribuição dos eventos `scroll`
- **Tempo de Sessão**: Duração média das sessões
- **Taxa de Rejeição**: Sessões com apenas 1 `page_view`

### 💰 Métricas de Revenue
- **Revenue por Sessão**: `purchase.value` / sessões
- **Revenue por Usuário**: `purchase.value` / usuários únicos
- **Taxa de Conversão de Order Bumps**: Seleções de upsells / visualizações

## 🔄 Configuração de Enhanced Conversions

### 👤 Dados de Usuário Capturados
```javascript
const enhancedConversionsData = {
  user_data: {
    email_address: "hashed_email",
    phone_number: "hashed_phone", 
    first_name: "hashed_first_name",
    last_name: "hashed_last_name"
  },
  attribution_data: {
    utm_source: "traffic_source",
    utm_medium: "traffic_medium",
    utm_campaign: "campaign_name"
  }
};
```

## 🎨 Configuração de Audiências

### 🎯 Audiências Personalizadas
1. **Visitantes Engajados**: Usuários com `video_complete` ou `scroll` > 75%
2. **Iniciaram Personalização**: Usuários com `begin_checkout` mas sem `purchase`
3. **Compradores**: Usuários com evento `purchase`
4. **High-Value Customers**: Compradores com `value` > R$ 80
5. **Order Bump Converters**: Usuários que selecionaram upsells

## 🚀 Próximos Passos

### ✅ Implementação Imediata
1. ✅ Eventos básicos de e-commerce configurados
2. ✅ Tracking de personalização implementado
3. ✅ Enhanced Conversions configurado
4. ✅ Webhooks de pós-compra funcionando

### 🔄 Otimizações Futuras
1. **Configurar Funis no GA4 Interface**: Criar os funis na interface do GA4
2. **Implementar Remarketing**: Configurar audiências para campanhas
3. **A/B Testing**: Testar variações de CTAs e fluxos
4. **Attribution Modeling**: Analisar jornadas multi-touch

---

## 📞 Suporte Técnico

Para dúvidas sobre a implementação:
- **Documentação GA4**: [Google Analytics 4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
- **GTM Setup**: Configurações em `src/lib/gtm-config.ts`
- **Event Tracking**: Implementação em `src/hooks/useDataLayer.ts`