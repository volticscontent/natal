# 📊 Guia de Configuração do Google Analytics 4 (GA4)

## Step 1: Configuração Inicial do GA4

### 1.1 Criar Conta no Google Analytics
1. Acesse [Google Analytics](https://analytics.google.com/)
2. Clique em "Começar a medir"
3. Configure sua conta:
   - **Nome da conta**: Recadinhos do Papai Noel
   - **País**: Brasil
   - **Moeda**: Real brasileiro (BRL)

### 1.2 Criar Propriedade GA4
1. Nome da propriedade: `Recadinhos do Papai Noel - Website`
2. Fuso horário: `(GMT-03:00) Brasília`
3. Moeda: `Real brasileiro (BRL)`
4. Categoria da empresa: `Varejo/E-commerce`

### 1.3 Configurar Stream de Dados
1. Selecione "Web"
2. URL do site: `https://seudominio.com`
3. Nome do stream: `Website Principal`
4. **Anote o MEASUREMENT_ID** (formato: G-XXXXXXXXXX)

---

## Step 2: Configuração das Variáveis de Ambiente

### 2.1 Arquivo .env.local
```bash
# Google Analytics 4
GA4_MEASUREMENT_ID="G-XXXXXXXXXX"  # Substitua pelo seu ID
GA4_PROPERTY_ID="511164510"        # Já configurado
NEXT_PUBLIC_GA4_MEASUREMENT_ID="G-XXXXXXXXXX"

# Google Tag Manager (Opcional)
NEXT_PUBLIC_GTM_ID="GTM-XXXXXXX"   # Se usar GTM

# Ambiente
NODE_ENV="production"              # Para produção
NEXT_PUBLIC_ENVIRONMENT="production"
```

### 2.2 Verificar Configuração Atual
Seu arquivo `.env.local` já possui:
- ✅ `GA4_PROPERTY_ID="511164510"`

**Adicione as variáveis em falta:**

---

## Step 3: Implementação e Verificação

### 3.1 Verificar Código de Tracking
O projeto já possui implementação do GA4 em:
- `src/hooks/useDataLayer.ts` - Hook para eventos
- `src/components/tracking/GTMManager.tsx` - Gerenciador do GTM
- `src/app/layout.tsx` - Script do GA4

### 3.2 Eventos Configurados
✅ **Eventos já implementados:**
- `page_view` - Visualização de página
- `cta_click` - Cliques em CTAs
- `engagement` - Engajamento do usuário
- `carta_iniciada` - Início do processo
- `funnel_step_completed` - Etapas do funil
- `personalization_step_interaction` - Interações de personalização

### 3.3 Testar Implementação

#### Método 1: Google Analytics DebugView
1. Acesse GA4 → Configure → DebugView
2. Abra seu site em modo debug:
   ```
   https://seusite.com?debug_mode=1
   ```
3. Verifique se os eventos aparecem em tempo real

#### Método 2: Extensão do Chrome
1. Instale "Google Analytics Debugger"
2. Ative a extensão
3. Navegue pelo site e verifique o console

#### Método 3: Relatórios em Tempo Real
1. GA4 → Relatórios → Tempo real
2. Navegue pelo site
3. Verifique usuários ativos e eventos

---

## 🔧 Configurações Avançadas

### Eventos Personalizados Recomendados
```javascript
// Exemplo de evento personalizado
gtag('event', 'video_personalizado_criado', {
  'custom_parameter_1': 'valor',
  'value': 49.99,
  'currency': 'BRL'
});
```

### Conversões Importantes
Configure como conversões no GA4:
- `carta_iniciada` - Início do funil
- `purchase` - Compra realizada
- `video_personalizado_criado` - Conversão principal

### Audiências Sugeridas
1. **Usuários Engajados**: Visitaram 3+ páginas
2. **Carrinho Abandonado**: Iniciaram mas não finalizaram
3. **Compradores**: Completaram purchase
4. **Retornantes**: Visitaram nos últimos 30 dias

---

## 📈 Métricas Importantes para Acompanhar

### KPIs Principais
- **Taxa de Conversão**: % de visitantes que criam vídeo
- **Valor Médio do Pedido**: Receita média por transação
- **Funil de Conversão**: Etapas do processo de criação
- **Origem do Tráfego**: De onde vêm os usuários

### Relatórios Personalizados
1. **Funil de Personalização**
   - Etapa 1: Página inicial
   - Etapa 2: Início da personalização
   - Etapa 3: Finalização do pedido

2. **Performance por Dispositivo**
   - Desktop vs Mobile
   - Taxa de conversão por dispositivo

---

## 🚀 Próximos Passos

1. **Configurar Enhanced E-commerce**
   - Tracking de produtos
   - Carrinho de compras
   - Checkout process

2. **Integrar com Google Ads**
   - Importar conversões
   - Criar audiências para remarketing

3. **Configurar Data Studio**
   - Dashboards personalizados
   - Relatórios automatizados

---

## 🔍 Troubleshooting

### Problemas Comuns
1. **Eventos não aparecem**: Verificar MEASUREMENT_ID
2. **Dados atrasados**: GA4 pode ter delay de até 24h
3. **Filtros**: Verificar se não há filtros bloqueando dados

### Comandos de Debug
```javascript
// Verificar se GA4 está carregado
console.log(window.gtag);

// Verificar dataLayer
console.log(window.dataLayer);

// Enviar evento de teste
gtag('event', 'test_event', {
  'custom_parameter': 'test_value'
});
```

---

## 📞 Suporte

- **Documentação GA4**: [developers.google.com/analytics](https://developers.google.com/analytics)
- **Centro de Ajuda**: [support.google.com/analytics](https://support.google.com/analytics)
- **Comunidade**: [Google Analytics Community](https://support.google.com/analytics/community)