# 🔧 GUIA DE CONFIGURAÇÃO GA4 API - CONTA REAL

## 📋 RESUMO DA CONFIGURAÇÃO GTM ATUAL

### ✅ **CONFIGURAÇÃO GTM COMPLETA**
Sua configuração do GTM está **100% completa** e pronta para GA4! Encontrei:

**🎯 Triggers Configurados (12):**
- ✅ `pageview` - Todas as páginas
- ✅ `cta_click_trigger` - Cliques em CTAs
- ✅ `personalization_step_trigger` - Etapas de personalização
- ✅ `form_interaction_trigger` - Interações com formulários
- ✅ `purchase_trigger` - Compras finalizadas
- ✅ `lead_trigger` - Geração de leads
- ✅ `view_item_trigger` - Visualização de produtos
- ✅ `add_to_cart_trigger` - Adicionar ao carrinho
- ✅ `begin_checkout_trigger` - Início do checkout
- ✅ `remove_from_cart_trigger` - Remover do carrinho
- ✅ `view_item_list_trigger` - Lista de produtos
- ✅ `select_item_trigger` - Seleção de item

**📊 Tags GA4 Configuradas (15):**
- ✅ `ga4_config` - Configuração principal
- ✅ `ga4_pageview` - Visualizações de página
- ✅ `ga4_cta_click` - Cliques em CTA (select_promotion)
- ✅ `ga4_personalization_step` - Etapas de personalização
- ✅ `ga4_purchase` - Compras (Enhanced Ecommerce)
- ✅ `ga4_lead` - Geração de leads
- ✅ `ga4_form_interaction` - Interações com formulários
- ✅ `ga4_view_item` - Visualização de produtos
- ✅ `ga4_add_to_cart` - Adicionar ao carrinho
- ✅ `ga4_begin_checkout` - Início do checkout
- ✅ `ga4_remove_from_cart` - Remover do carrinho
- ✅ `ga4_scroll_engagement` - Engajamento por scroll
- ✅ `ga4_time_engagement` - Engajamento por tempo
- ✅ `ga4_video_engagement` - Engajamento com vídeo
- ✅ `ga4_search` - Pesquisas

**🎨 Eventos Customizados Implementados:**
- ✅ `quantity_selected` - Seleção de quantidade
- ✅ `step_progress` - Progresso entre etapas
- ✅ `funnel_step` - Etapas do funil
- ✅ `funnel_abandonment` - Abandono do funil
- ✅ `funnel_conversion` - Conversões do funil

---

## 🚀 CONFIGURAÇÃO DA GA4 API

### **PASSO 1: Configurar Google Cloud Project**

1. **Acesse o Google Cloud Console:**
   ```
   https://console.cloud.google.com/
   ```

2. **Crie um novo projeto ou selecione existente:**
   - Nome sugerido: "Natal-Personalizado-Analytics"

3. **Ative a API do Google Analytics:**
   ```
   https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com
   ```

### **PASSO 2: Criar Service Account**

1. **Vá para IAM & Admin > Service Accounts:**
   ```
   https://console.cloud.google.com/iam-admin/serviceaccounts
   ```

2. **Criar Service Account:**
   - Nome: `ga4-analytics-reader`
   - Descrição: `Service account para leitura de dados GA4`

3. **Baixar chave JSON:**
   - Clique na service account criada
   - Vá em "Keys" > "Add Key" > "Create new key"
   - Escolha "JSON" e baixe o arquivo

### **PASSO 3: Configurar Permissões GA4**

1. **No Google Analytics 4:**
   - Vá em Admin > Property > Property Access Management
   - Clique em "+" para adicionar usuário
   - Adicione o email da service account (ex: `ga4-analytics-reader@projeto.iam.gserviceaccount.com`)
   - Permissão: **Viewer** (suficiente para leitura)

### **PASSO 4: Obter IDs Necessários**

1. **Property ID:**
   - No GA4: Admin > Property Settings
   - Copie o "Property ID" (ex: `123456789`)

2. **Measurement ID:**
   - No GA4: Admin > Data Streams > Web
   - Copie o "Measurement ID" (ex: `G-XXXXXXXXXX`)

---

## 🔐 CONFIGURAÇÃO NO PROJETO

### **PASSO 1: Adicionar Credenciais**

1. **Criar pasta para credenciais:**
   ```bash
   mkdir credentials
   ```

2. **Mover arquivo JSON:**
   ```bash
   # Mova o arquivo baixado para:
   credentials/ga4-service-account.json
   ```

3. **Adicionar ao .gitignore:**
   ```bash
   echo "credentials/" >> .gitignore
   ```

### **PASSO 2: Configurar Variáveis de Ambiente**

Crie arquivo `.env.local`:
```env
# GA4 API Configuration
GA4_PROPERTY_ID=123456789
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
GOOGLE_APPLICATION_CREDENTIALS=./credentials/ga4-service-account.json

# GTM Configuration (se necessário)
GTM_CONTAINER_ID=GTM-XXXXXXX
```

### **PASSO 3: Atualizar package.json**

Adicione script para análise:
```json
{
  "scripts": {
    "analyze-funnel": "tsx src/scripts/ga4-real-analysis.ts",
    "test-ga4": "tsx src/scripts/test-ga4-connection.ts"
  }
}
```

---

## 📊 SCRIPTS CRIADOS

### **1. Teste de Conexão**
```bash
npm run test-ga4
```
Verifica se a conexão com GA4 está funcionando.

### **2. Análise Completa do Funil**
```bash
npm run analyze-funnel
```
Gera relatório completo com dados reais da sua conta.

---

## 🎯 PRÓXIMOS PASSOS

1. **Configure as credenciais** seguindo os passos acima
2. **Execute o teste** de conexão
3. **Rode a análise** completa do funil
4. **Revise o relatório** gerado com dados reais

---

## 🔍 EVENTOS QUE SERÃO ANALISADOS

Com sua configuração atual, vamos analisar:

### **Funil Principal:**
1. `page_view` → Visitantes únicos
2. `select_promotion` → Cliques em CTA
3. `begin_checkout` → Início personalização
4. `form_start` → Interações com formulário
5. `add_to_cart` → Adição ao carrinho
6. `begin_checkout` → Início checkout
7. `purchase` → Compras finalizadas

### **Métricas Avançadas:**
- **Engajamento:** scroll, tempo na página, vídeo
- **Comportamento:** view_item, remove_from_cart
- **Conversões:** generate_lead, purchase
- **Abandono:** Por etapa do funil

### **Segmentações:**
- Por fonte de tráfego
- Por dispositivo (mobile/desktop)
- Por localização geográfica
- Por horário/dia da semana

---

## ⚠️ IMPORTANTE

- **Nunca commite** o arquivo JSON de credenciais
- **Use .env.local** para variáveis sensíveis
- **Teste primeiro** com dados limitados
- **Monitore quotas** da API do Google

---

*Configuração preparada para análise automatizada completa do funil com dados reais da sua conta GA4!*