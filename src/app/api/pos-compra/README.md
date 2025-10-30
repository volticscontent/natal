# API de Pós-Compra

Esta API gerencia os webhooks de pós-compra dos gateways de pagamento LastLink e CartPanda, processando eventos de vendas, reembolsos, cancelamentos e outras ações relacionadas ao ciclo de vida dos pedidos.

## Estrutura da API

```
src/app/api/pos-compra/
├── route.ts              # Endpoint principal com informações da API
├── types.ts              # Tipos TypeScript para os payloads
├── utils.ts              # Utilitários para validação e processamento
├── lastlink/
│   └── route.ts          # Webhook específico do LastLink
├── cartpanda/
│   └── route.ts          # Webhook específico do CartPanda
└── README.md             # Esta documentação
```

## Endpoints Disponíveis

### 1. LastLink Webhook
**URL:** `/api/pos-compra/lastlink`  
**Método:** `POST`  
**Content-Type:** `application/json`

#### Eventos Suportados:
- `Purchase_Order_Confirmed` - Compra confirmada e paga
- `Payment_Refund` - Pagamento reembolsado
- `Payment_Chargeback` - Chargeback do pagamento
- `Purchase_Request_Canceled` - Pedido cancelado
- `Subscription_Canceled` - Assinatura cancelada
- `Abandoned_Cart` - Carrinho abandonado
- E outros eventos do LastLink

#### Exemplo de Payload:
```json
{
  "event_type": "Purchase_Order_Confirmed",
  "event_id": "evt_123456789",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "order_id": "order_123",
    "product_id": "prod_456",
    "customer": {
      "id": "cust_789",
      "name": "João Silva",
      "email": "joao@email.com",
      "phone": "11999999999"
    },
    "payment": {
      "id": "pay_321",
      "status": "paid",
      "amount": 97.00,
      "currency": "BRL",
      "method": "credit_card"
    }
  }
}
```

### 2. CartPanda Webhook
**URL:** `/api/pos-compra/cartpanda`  
**Método:** `POST`  
**Content-Type:** `application/json`

#### Eventos Suportados:
- `order.paid` - Pedido pago com sucesso
- `order.created` - Novo pedido criado
- `order.updated` - Pedido atualizado
- `order.refunded` - Pedido reembolsado
- `product.created` - Produto criado
- `product.updated` - Produto atualizado
- `product.deleted` - Produto deletado

#### Exemplo de Payload:
```json
{
  "event": "order.paid",
  "event_id": "evt_987654321",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "order_id": "cp_order_123",
    "product_id": "cp_prod_456",
    "customer": {
      "id": "cp_cust_789",
      "name": "Maria Santos",
      "email": "maria@email.com",
      "phone": "11888888888"
    },
    "payment": {
      "id": "cp_pay_321",
      "status": "paid",
      "amount": 127.50,
      "currency": "BRL",
      "method": "pix"
    },
    "items": [
      {
        "id": "item_1",
        "product_id": "cp_prod_456",
        "name": "Produto Exemplo",
        "quantity": 1,
        "price": 127.50,
        "total": 127.50
      }
    ],
    "totals": {
      "subtotal": 127.50,
      "discount": 0,
      "shipping": 0,
      "tax": 0,
      "total": 127.50
    }
  }
}
```

## Configuração dos Webhooks

### 1. LastLink
1. Acesse o painel do LastLink
2. Vá em Configurações > Webhooks
3. Adicione a URL: `https://seudominio.com/api/pos-compra/lastlink`
4. Selecione os eventos desejados
5. Salve a configuração

### 2. CartPanda
1. Acesse o painel do CartPanda
2. Vá em Configurações > Webhooks
3. Adicione a URL: `https://seudominio.com/api/pos-compra/cartpanda`
4. Selecione os eventos desejados
5. Salve a configuração

## Processamento dos Eventos

### Fluxo de Processamento:
1. **Recebimento:** Webhook recebe o payload JSON
2. **Validação:** Verifica estrutura e campos obrigatórios
3. **Sanitização:** Limpa e normaliza os dados
4. **Processamento:** Executa lógica específica por evento
5. **Integração:** Dispara pixels, emails e outras integrações
6. **Resposta:** Retorna confirmação de processamento

### Ações Automáticas:
- ✅ Liberação de acesso a produtos
- 📧 Envio de emails de confirmação
- 📊 Disparo de pixels de conversão (Facebook, Google, TikTok)
- 📈 Registro de eventos no Google Analytics 4
- 🔄 Sincronização com CRM/Email Marketing
- 📝 Log estruturado para monitoramento

## Integrações Disponíveis

### Marketing Pixels:
- **Facebook Pixel:** Conversions API
- **Google Ads:** Conversions API  
- **TikTok Pixel:** Events API
- **Google Analytics 4:** Measurement Protocol

### Configuração (variáveis de ambiente):
```env
# Marketing Pixels
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=123456789
NEXT_PUBLIC_GOOGLE_ADS_ID=AW-123456789
NEXT_PUBLIC_TIKTOK_PIXEL_ID=ABC123DEF456
NEXT_PUBLIC_GA4_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
```

## Monitoramento e Logs

### Estrutura de Log:
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "gateway": "lastlink",
  "event": "Purchase_Order_Confirmed",
  "status": "success",
  "order_id": "order_123",
  "customer_email": "joao@email.com",
  "amount": 97.00
}
```

### Verificação de Status:
- **LastLink:** `GET /api/pos-compra/lastlink`
- **CartPanda:** `GET /api/pos-compra/cartpanda`

## Tratamento de Erros

### Códigos de Resposta:
- `200` - Processamento bem-sucedido
- `400` - Payload inválido ou malformado
- `500` - Erro interno do servidor

### Exemplo de Resposta de Erro:
```json
{
  "success": false,
  "error": "Payload inválido: event_type é obrigatório",
  "message": "Falha ao processar webhook do LastLink"
}
```

## Segurança

### Recomendações:
1. **Validação de Origem:** Verificar IPs dos gateways
2. **Assinatura HMAC:** Validar autenticidade dos payloads
3. **Rate Limiting:** Limitar número de requests
4. **Sanitização:** Limpar dados de entrada
5. **Logs de Auditoria:** Registrar todas as operações

### Implementação de HMAC (exemplo):
```typescript
import crypto from 'crypto';

function validateHMAC(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

## Desenvolvimento e Testes

### Testando Localmente:
1. Use ngrok para expor localhost: `ngrok http 3000`
2. Configure a URL do webhook: `https://abc123.ngrok.io/api/pos-compra/lastlink`
3. Monitore os logs no console

### Ferramentas Úteis:
- **Webhook.site:** Para testar payloads
- **Postman:** Para simular requests
- **ngrok:** Para expor localhost
- **curl:** Para testes via linha de comando

### Exemplo de Teste com curl:
```bash
curl -X POST https://localhost:3000/api/pos-compra/lastlink \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "Purchase_Order_Confirmed",
    "event_id": "test_123",
    "timestamp": "2024-01-15T10:30:00Z",
    "data": {
      "order_id": "test_order_123",
      "customer": {
        "email": "test@email.com",
        "name": "Teste"
      },
      "payment": {
        "amount": 97.00,
        "status": "paid"
      }
    }
  }'
```

## Próximos Passos

### Melhorias Futuras:
- [ ] Implementar retry automático para falhas
- [ ] Adicionar cache Redis para eventos duplicados
- [ ] Criar dashboard de monitoramento
- [ ] Implementar alertas por email/Slack
- [ ] Adicionar métricas detalhadas
- [ ] Criar testes automatizados
- [ ] Implementar rate limiting
- [ ] Adicionar validação HMAC

### Integrações Adicionais:
- [ ] CRM (HubSpot, Pipedrive, etc.)
- [ ] Email Marketing (Mailchimp, SendGrid, etc.)
- [ ] Automação (Zapier, Make, etc.)
- [ ] Analytics (Mixpanel, Amplitude, etc.)
- [ ] Notificações (Slack, Discord, etc.)

---

**Desenvolvido para o projeto Recadinhos do Papai Noel**  
**Última atualização:** Janeiro 2024