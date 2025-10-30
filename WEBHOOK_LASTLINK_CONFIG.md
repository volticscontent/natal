# Configuração do Webhook LastLink

## 📋 Informações do Webhook

### URL do Webhook
```
https://seu-dominio.com/api/pos-compra/lastlink
```

### Método HTTP
```
POST
```

### Content-Type
```
application/json
```

### Autenticação
```
Authorization: Bearer 4b5b99dcad3c4d6bbaa1ad5a85f15bfd
```
ou
```
Authorization: 4b5b99dcad3c4d6bbaa1ad5a85f15bfd
```

## 🔧 Configuração no Painel da LastLink

1. **Acesse o painel da LastLink**
2. **Vá em Configurações → Webhooks**
3. **Adicione um novo webhook com:**
   - **URL:** `https://seu-dominio.com/api/pos-compra/lastlink`
   - **Método:** `POST`
   - **Token:** `4b5b99dcad3c4d6bbaa1ad5a85f15bfd`
   - **Content-Type:** `application/json`

4. **Selecione os eventos que deseja receber:**
   - ✅ `Purchase_Order_Confirmed` - Compra confirmada e paga
   - ✅ `Payment_Refund` - Pagamento reembolsado
   - ✅ `Payment_Chargeback` - Chargeback do pagamento
   - ✅ `Purchase_Request_Canceled` - Pedido cancelado
   - ✅ `Subscription_Canceled` - Assinatura cancelada
   - ✅ `Abandoned_Cart` - Carrinho abandonado

## 🔐 Segurança

O webhook implementa as seguintes validações de segurança:

1. **Validação de Content-Type** - Aceita apenas `application/json`
2. **Validação de Token** - Verifica o token de autenticação no header `Authorization`
3. **Validação de Payload** - Verifica a estrutura dos dados recebidos
4. **Prevenção de Duplicatas** - Evita processar o mesmo evento múltiplas vezes

## 📊 Eventos Suportados

| Evento | Descrição | Ação |
|--------|-----------|------|
| `Purchase_Order_Confirmed` | Compra confirmada e paga | Dispara pixels de conversão |
| `Payment_Refund` | Pagamento reembolsado | Log de reembolso |
| `Payment_Chargeback` | Chargeback do pagamento | Log de chargeback |
| `Purchase_Request_Canceled` | Pedido cancelado | Log de cancelamento |
| `Subscription_Canceled` | Assinatura cancelada | Log de cancelamento |
| `Abandoned_Cart` | Carrinho abandonado | Dispara remarketing |

## 🔍 Logs e Monitoramento

O webhook gera logs detalhados para cada etapa do processamento:

1. **Validação de Content-Type**
2. **Validação de Token**
3. **Parsing do Payload**
4. **Validação de Dados**
5. **Processamento do Evento**
6. **Disparo de Pixels**

## 🧪 Teste do Webhook

Para testar o webhook, você pode usar o seguinte comando curl:

```bash
curl -X POST https://seu-dominio.com/api/pos-compra/lastlink \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 4b5b99dcad3c4d6bbaa1ad5a85f15bfd" \
  -d '{
    "event_type": "Purchase_Order_Confirmed",
    "data": {
      "order_id": "test-123",
      "customer_email": "test@example.com",
      "total_amount": 99.90,
      "currency": "BRL"
    }
  }'
```

## ⚠️ Importante

- Mantenha o token seguro e não o compartilhe
- Configure HTTPS em produção
- Monitore os logs regularmente
- Teste o webhook após qualquer alteração