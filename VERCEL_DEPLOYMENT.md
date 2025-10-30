# Configuração de Deploy no Vercel

## Variáveis de Ambiente Obrigatórias

Para que a seção de personalização funcione corretamente no Vercel, você precisa configurar as seguintes variáveis de ambiente no painel do Vercel:

### 1. Configurações Gerais
```
NODE_ENV=production
NEXT_PUBLIC_APP_URL_PROD=https://seu-dominio.vercel.app
```

### 2. Cloudflare R2 (CRÍTICO para upload de fotos)
```
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=sua_access_key_do_r2
R2_SECRET_ACCESS_KEY=sua_secret_key_do_r2
R2_BUCKET_NAME=recadinhos-fotos
R2_PUBLIC_URL=https://seu-dominio-personalizado.com
```

### 3. N8N Webhook (CRÍTICO para salvar dados)
```
N8N_WEBHOOK_URL=https://n8n.landcriativa.com/webhook/estrutura
N8N_WEBHOOK_JWT_SECRET=recadinhos-papai-noel-jwt-secret-2024-production-key
```

### 4. Configurações de Checkout
```
NEXT_PUBLIC_LASTLINK_BASE_URL=https://lastlink.com.br
NEXT_PUBLIC_CARTPANDA_BASE_URL=https://cartpanda.com
NEXT_PUBLIC_CARTPANDA_PRODUCT_ID=seu_product_id
NEXT_PUBLIC_CARTPANDA_API_KEY=sua_api_key
```

### 5. Pixels de Marketing (Opcionais mas recomendados)
```
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=seu_pixel_id
FACEBOOK_ACCESS_TOKEN=seu_access_token
NEXT_PUBLIC_GA4_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
NEXT_PUBLIC_TIKTOK_PIXEL_ID=seu_tiktok_pixel_id
```

## Passos para Configurar no Vercel

1. **Acesse o painel do Vercel**
   - Vá para https://vercel.com/dashboard
   - Selecione seu projeto

2. **Configure as variáveis de ambiente**
   - Vá para Settings > Environment Variables
   - Adicione cada variável listada acima
   - Certifique-se de marcar "Production", "Preview" e "Development" conforme necessário

3. **Redeploy o projeto**
   - Após adicionar todas as variáveis, faça um novo deploy
   - Vá para Deployments > ... > Redeploy

## Problemas Comuns e Soluções

### 1. Upload de fotos não funciona
- **Causa**: Variáveis do R2 não configuradas ou incorretas
- **Solução**: Verifique se todas as variáveis R2_* estão corretas

### 2. Dados não são salvos
- **Causa**: N8N webhook não configurado
- **Solução**: Verifique N8N_WEBHOOK_URL e N8N_WEBHOOK_JWT_SECRET

### 3. Timeout nas APIs
- **Causa**: Funções do Vercel têm timeout padrão de 10s
- **Solução**: O arquivo vercel.json já está configurado com maxDuration: 30

### 4. CORS errors
- **Causa**: Configurações de CORS não aplicadas
- **Solução**: O arquivo vercel.json já inclui headers CORS necessários

## Verificação de Funcionamento

Após o deploy, teste:

1. **Acesse a rota de personalização**: `/pt/pers/1`
2. **Teste o upload de fotos** na etapa correspondente
3. **Verifique os logs** no painel do Vercel em Functions > View Function Logs
4. **Confirme no N8N** se os dados estão sendo recebidos

## Arquivos de Configuração

- `vercel.json`: Configurações específicas do Vercel
- `next.config.ts`: Configurações do Next.js otimizadas para Vercel
- `.env.example`: Template com todas as variáveis necessárias

## Suporte

Se ainda houver problemas:
1. Verifique os logs das funções no Vercel
2. Teste as APIs individualmente usando ferramentas como Postman
3. Confirme se o R2 e N8N estão acessíveis externamente