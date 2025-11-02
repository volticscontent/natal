# 🛠️ Configuração Manual do GTM - Facebook e TikTok Tags

## ✅ Status Atual

O script automático criou com sucesso:
- **Workspace ID: 4** ("Auto Setup 2025-11-01T21-06-37")
- ✅ Todas as variáveis necessárias (Facebook Pixel ID, TikTok Pixel ID, GA4 Measurement ID, etc.)
- ✅ Todos os triggers necessários
- ✅ Tags básicas do Facebook e TikTok
- ⚠️ Algumas tags avançadas falharam devido ao limite de quota da API

## 🎯 Tags que Precisam ser Verificadas/Criadas Manualmente

### Facebook Pixel Tags
1. **Facebook Pixel - Base Code** ✅ (Criada)
2. **Facebook Pixel - ViewContent** ✅ (Criada)
3. **Facebook Pixel - InitiateCheckout** ✅ (Criada)
4. **Facebook Pixel - Purchase** ✅ (Criada)
5. **Facebook Pixel - Lead** ✅ (Criada)

### TikTok Pixel Tags
1. **TikTok Pixel - Base Code** ✅ (Criada)
2. **TikTok Pixel - ViewContent** ✅ (Criada)
3. **TikTok Pixel - InitiateCheckout** ✅ (Criada)
4. **TikTok Pixel - CompletePayment** ✅ (Criada)
5. **TikTok Pixel - SubmitForm** ✅ (Criada)

## 🔧 Como Acessar e Verificar no GTM

### 1. Acessar o GTM
1. Vá para [Google Tag Manager](https://tagmanager.google.com/)
2. Selecione a conta: **6321301049**
3. Selecione o container: **233737414**
4. Acesse o workspace: **"Auto Setup 2025-11-01T21-06-37" (ID: 4)**

### 2. Verificar Tags Criadas
1. No menu lateral, clique em **"Tags"**
2. Procure pelas tags com os nomes:
   - Facebook Pixel - Base Code
   - Facebook Pixel - ViewContent
   - Facebook Pixel - InitiateCheckout
   - Facebook Pixel - Purchase
   - Facebook Pixel - Lead
   - TikTok Pixel - Base Code
   - TikTok Pixel - ViewContent
   - TikTok Pixel - InitiateCheckout
   - TikTok Pixel - CompletePayment
   - TikTok Pixel - SubmitForm

### 3. Verificar Configuração das Tags

#### Para Tags do Facebook Pixel:
- **Tipo**: Custom HTML
- **HTML**: Deve conter o código do Facebook Pixel com ID `{{Facebook Pixel ID}}`
- **Triggers**: Configurados conforme o evento (pageview, cta_click, etc.)

#### Para Tags do TikTok Pixel:
- **Tipo**: Custom HTML
- **HTML**: Deve conter o código do TikTok Pixel com ID `{{TikTok Pixel ID}}`
- **Triggers**: Configurados conforme o evento

## 🚀 Próximos Passos

### 1. Publicar o Workspace
1. No GTM, clique em **"Submit"** (Enviar)
2. Adicione uma descrição: "Configuração inicial Facebook e TikTok Pixels"
3. Clique em **"Publish"** (Publicar)

### 2. Testar as Tags
1. Ative o modo **"Preview"** no GTM
2. Acesse seu site: http://localhost:3000
3. Verifique se as tags estão disparando corretamente
4. Use as ferramentas de debug:
   - Facebook Pixel Helper (extensão do Chrome)
   - TikTok Pixel Helper (extensão do Chrome)

### 3. Verificar no Site
Após publicar, as tags devem aparecer na extensão do gerenciador de tags quando você acessar o site.

## 🔍 Variáveis Disponíveis

As seguintes variáveis já estão configuradas e podem ser usadas nas tags:

| Variável | Tipo | Valor |
|----------|------|-------|
| Facebook Pixel ID | Constant | 1356770055844803 |
| TikTok Pixel ID | Constant | (Configurar quando disponível) |
| GA4 Measurement ID | Constant | G-QJYSNGTHG4 |
| CTA Name | Data Layer | cta_name |
| CTA Location | Data Layer | cta_location |
| CTA Type | Data Layer | cta_type |
| Purchase Value | Data Layer | purchase_value |
| Transaction ID | Data Layer | transaction_id |

## 🎯 Triggers Disponíveis

| Trigger | Tipo | Condição |
|---------|------|----------|
| All Pages | Page View | Todas as páginas |
| CTA Click Trigger | Custom Event | event = 'cta_click' |
| Purchase Trigger | Custom Event | event = 'purchase' |
| Lead Generation Trigger | Custom Event | event = 'generate_lead' |
| Form Interaction Trigger | Custom Event | event = 'form_interaction' |

## ⚠️ Observações Importantes

1. **TikTok Pixel**: Atualmente comentado no .env.local. Descomente e adicione um ID válido quando disponível.
2. **Quota da API**: Aguarde alguns minutos antes de tentar criar mais tags via API.
3. **Teste sempre**: Use o modo Preview antes de publicar.
4. **Backup**: O workspace atual preserva todas as configurações anteriores.

## 🆘 Troubleshooting

### Tags não aparecem na extensão:
1. Verifique se o workspace foi publicado
2. Limpe o cache do navegador
3. Verifique se o GTM ID está correto no código

### Tags não disparam:
1. Verifique os triggers no modo Preview
2. Confirme se os eventos estão sendo enviados para o dataLayer
3. Verifique se as variáveis estão configuradas corretamente

### Erros de pixel:
1. Verifique se os IDs dos pixels estão corretos
2. Use as extensões de debug (Facebook Pixel Helper, TikTok Pixel Helper)
3. Verifique o console do navegador para erros JavaScript