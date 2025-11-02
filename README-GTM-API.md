# Configuração Automática do GTM via API

Este projeto inclui um sistema completo para configurar automaticamente o Google Tag Manager via API, incluindo tags do Facebook Pixel, TikTok Pixel e Google Analytics 4.

## 🚀 Configuração Rápida

### 1. Instalar Dependências

```bash
npm install googleapis
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env.local` e configure:

```bash
# IDs do GTM
GTM_ACCOUNT_ID=123456789
GTM_CONTAINER_ID=12345678

# Autenticação (escolha uma opção)
GTM_SERVICE_ACCOUNT_PATH=./gtm-service-account.json
# ou
GTM_ACCESS_TOKEN=ya29.a0AfH6SMC...

# IDs dos Pixels
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=123456789012345
NEXT_PUBLIC_TIKTOK_PIXEL_ID=C4A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 3. Configurar Autenticação

#### Opção A: Service Account (Recomendado)

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um Service Account
3. Baixe o arquivo JSON da chave
4. Coloque o arquivo na raiz do projeto
5. Configure `GTM_SERVICE_ACCOUNT_PATH` no `.env.local`

#### Opção B: Access Token

1. Use o [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Autorize o escopo: `https://www.googleapis.com/auth/tagmanager.edit.containers`
3. Obtenha o Access Token
4. Configure `GTM_ACCESS_TOKEN` no `.env.local`

## 🛠️ Uso

### Configuração Automática Completa

```bash
# Executar configuração completa
npm run setup-gtm

# Modo simulação (dry-run)
npm run setup-gtm:dry-run

# Modo verbose (mais detalhes)
npm run setup-gtm:verbose
```

### Configuração Manual via Código

```typescript
import { setupGTMAutomatically } from './src/lib/gtm-api-client';

const result = await setupGTMAutomatically({
  accountId: 'your_account_id',
  containerId: 'your_container_id',
  serviceAccountKey: './service-account.json'
});

if (result.success) {
  console.log('GTM configurado com sucesso!');
  console.log('Workspace ID:', result.workspaceId);
  console.log('Versão publicada:', result.versionId);
} else {
  console.error('Erros:', result.errors);
}
```

## 📋 O que é Configurado Automaticamente

### Variáveis GTM
- `FB_PIXEL_ID` - ID do Facebook Pixel
- `TIKTOK_PIXEL_ID` - ID do TikTok Pixel  
- `GA4_MEASUREMENT_ID` - ID do Google Analytics 4
- `UTM_SOURCE` - Fonte UTM da URL
- `UTM_MEDIUM` - Meio UTM da URL
- `UTM_CAMPAIGN` - Campanha UTM da URL
- `SESSION_ID` - ID da sessão personalizado

### Triggers GTM
- `Page View` - Visualização de página
- `CTA Click` - Clique em CTAs
- `Form Submit` - Envio de formulários
- `Scroll Tracking` - Rastreamento de scroll
- `Time on Page` - Tempo na página
- `Personalization Step` - Etapas de personalização

### Tags Configuradas

#### Facebook Pixel
- **Base Pixel** - PageView automático
- **CTA Click** - Rastreamento de cliques em CTAs
- **Form Submit** - Rastreamento de envios de formulário
- **Purchase** - Eventos de conversão

#### TikTok Pixel
- **Base Pixel** - PageView automático
- **CTA Click** - Rastreamento de cliques
- **Form Submit** - Rastreamento de formulários
- **Complete Payment** - Eventos de conversão

#### Google Analytics 4
- **Base Tag** - Configuração principal
- **CTA Click** - Eventos de clique
- **Form Submit** - Eventos de formulário
- **Scroll Tracking** - Rastreamento de engajamento

## 🔧 Configuração Avançada

### Personalizar Tags

Edite o arquivo `src/lib/gtm-config.ts` para personalizar:

```typescript
// Adicionar nova tag
export const CUSTOM_TAGS: GTMTagConfig[] = [
  {
    tagId: 'custom_tag_1',
    tagName: 'Minha Tag Personalizada',
    tagType: 'customHtml',
    triggers: ['page_view'],
    parameters: {
      html: '<script>console.log("Tag personalizada");</script>'
    }
  }
];
```

### Adicionar Novos Triggers

```typescript
// Adicionar novo trigger
export const CUSTOM_TRIGGERS: GTMTriggerConfig[] = [
  {
    triggerId: 'custom_trigger_1',
    triggerName: 'Meu Trigger Personalizado',
    triggerType: 'customEvent',
    conditions: {
      eventName: 'meu_evento_personalizado'
    }
  }
];
```

## 🧪 Testes

### Validar Configuração

```bash
# Testar configuração sem aplicar mudanças
npm run setup-gtm:dry-run
```

### Debug no GTM

1. Acesse o [GTM](https://tagmanager.google.com/)
2. Ative o modo Preview
3. Teste os eventos no seu site
4. Verifique se as tags estão disparando corretamente

### Verificar Data Layer

```javascript
// No console do navegador
console.log(window.dataLayer);

// Verificar eventos específicos
window.dataLayer.push({
  event: 'cta_click',
  cta_text: 'Teste',
  cta_url: '/teste'
});
```

## 🚨 Troubleshooting

### Erro de Autenticação
- Verifique se o Service Account tem permissões corretas
- Confirme se o Access Token não expirou
- Verifique se o escopo está correto

### Tags não Disparando
- Confirme se os triggers estão configurados corretamente
- Verifique se os eventos estão sendo enviados para o dataLayer
- Use o modo Preview do GTM para debug

### Erro de Permissões
- Verifique se o Service Account tem acesso ao container GTM
- Confirme se o usuário tem permissões de edição no GTM

## 📚 Recursos Adicionais

- [Documentação da API do GTM](https://developers.google.com/tag-manager/api/v2)
- [Guia de Service Accounts](https://cloud.google.com/iam/docs/service-accounts)
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
- [GTM Developer Guide](https://developers.google.com/tag-manager/devguide)

## 🤝 Suporte

Para problemas ou dúvidas:
1. Verifique os logs de erro detalhados
2. Execute em modo verbose: `npm run setup-gtm:verbose`
3. Consulte a documentação oficial do GTM
4. Verifique as permissões de API