# 🚀 Configuração de Produção - Recadinhos Papai Noel

## 📋 Checklist de Deploy

### 1. **Variáveis de Ambiente**
```bash
# Cloudflare R2
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=recadinhos-fotos
R2_PUBLIC_URL=https://your-domain.com

# N8N Webhook
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/your-webhook-id
JWT_SECRET=your-super-secure-jwt-secret-256-bits

# Redis (Vercel KV)
REDIS_URL=redis://default:password@host:port

# Next.js
NODE_ENV=production
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://your-domain.com
```

### 2. **Rate Limiting com Redis**

#### Sistema Distribuído:
- ✅ **Redis**: Armazenamento distribuído para rate limiting
- ✅ **Fallback**: Sistema em memória caso Redis falhe
- ✅ **Conexão**: Singleton com reconexão automática

#### Configurações por Endpoint:
- ✅ **Upload de fotos**: 5 requests/minuto por IP
- ✅ **Webhooks**: 10 requests/minuto por IP  
- ✅ **Geral**: 30 requests/minuto por IP
- ✅ **Headers de rate limit** em todas as respostas

#### Headers de Resposta:
- `X-RateLimit-Limit`: Limite máximo
- `X-RateLimit-Remaining`: Requests restantes
- `X-RateLimit-Reset`: Timestamp do reset
- `Retry-After`: Segundos para tentar novamente (quando limitado)

#### Implementação Redis:
```typescript
// Substitua o store em memória por Redis
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);
```

#### Teste de Conectividade:
```bash
curl https://your-domain.com/api/test-redis
```

### 3. **Configurações de Timeout Otimizadas**

- ✅ **Vercel Functions**: 60 segundos (aumentado de 30s)
- ✅ **N8N Webhook**: 25 segundos (otimizado)
- ✅ **Retry Logic**: 3 tentativas com backoff exponencial
- ✅ **Circuit Breaker**: 5 falhas para abrir circuito

### 4. **Upload de Fotos Otimizado**

- ✅ **Throttling**: 500ms entre uploads sequenciais
- ✅ **Limite**: Máximo 3 fotos por sessão
- ✅ **Tamanho**: Máximo 10MB por foto
- ✅ **Formatos**: JPEG, PNG, WEBP, HEIC, HEIF

### 5. **Monitoramento e Logs**

#### Métricas Importantes:
```typescript
// Implementar em produção
- Rate limit hits por endpoint
- Tempo de resposta do N8N webhook
- Taxa de sucesso/falha dos uploads
- Estado do circuit breaker
- Uso de memória das functions
```

#### Logs Estruturados:
```typescript
// Exemplo de log estruturado
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: 'info',
  service: 'photo-upload',
  sessionId: 'xxx',
  action: 'upload_success',
  duration: 1234,
  fileSize: 2048576
}));
```

### 6. **Configurações de Segurança**

- ✅ **HTTPS obrigatório** (Strict-Transport-Security)
- ✅ **Headers de segurança** (XSS, CSRF, etc.)
- ✅ **Validação de tipos de arquivo**
- ✅ **Sanitização de nomes de arquivo**
- ✅ **JWT para autenticação de webhooks**

### 7. **Performance**

#### Otimizações Implementadas:
- ✅ **Compressão gzip** habilitada
- ✅ **Cache de imagens** otimizado
- ✅ **Bundle splitting** configurado
- ✅ **Lazy loading** de componentes

#### CDN e Cache:
```typescript
// Headers de cache otimizados
'Cache-Control': 'public, max-age=31536000, immutable' // Para assets estáticos
'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=86400' // Para API
```

### 8. **Backup e Recuperação**

#### R2 Storage:
- Configure **lifecycle policies** para arquivos antigos
- Implemente **backup automático** para outro bucket
- Configure **versioning** se necessário

#### Database:
- Configure **backups automáticos** diários
- Teste **procedimentos de restore**
- Monitore **integridade dos dados**

### 9. **Alertas e Monitoramento**

#### Configurar alertas para:
- Taxa de erro > 5%
- Tempo de resposta > 10s
- Rate limit hits > 100/min
- Circuit breaker aberto
- Falhas no webhook N8N

#### Ferramentas Recomendadas:
- **Vercel Analytics** para métricas básicas
- **Sentry** para error tracking
- **Uptime Robot** para monitoramento de disponibilidade
- **Grafana + Prometheus** para métricas avançadas

### 10. **Testes de Carga**

#### Cenários de Teste:
```bash
# Teste de upload de fotos
ab -n 100 -c 10 -T 'multipart/form-data' https://your-domain.com/api/save-photos

# Teste de webhook
ab -n 200 -c 20 -T 'application/json' https://your-domain.com/api/webhook

# Teste de rate limiting
ab -n 500 -c 50 https://your-domain.com/api/save-photos
```

### 11. **Rollback Plan**

#### Em caso de problemas:
1. **Revert** para versão anterior no Vercel
2. **Desabilitar** rate limiting temporariamente
3. **Aumentar** timeouts se necessário
4. **Ativar** modo de manutenção
5. **Notificar** usuários via status page

## 🔧 Comandos Úteis

```bash
# Deploy para produção
vercel --prod

# Verificar logs em tempo real
vercel logs your-deployment-url --follow

# Testar rate limiting localmente
npm run dev
curl -X POST http://localhost:3000/api/save-photos

# Verificar configurações
vercel env ls
```

## 📊 Métricas de Sucesso

- **Uptime**: > 99.9%
- **Tempo de resposta**: < 3s (95th percentile)
- **Taxa de erro**: < 1%
- **Upload success rate**: > 98%
- **N8N webhook success rate**: > 95%

## 🚨 Troubleshooting

### Rate Limit Issues:
```bash
# Verificar logs de rate limit
grep "Rate limit exceeded" /var/log/app.log

# Ajustar limites se necessário
# Editar src/lib/rate-limiter.ts
```

### Upload Failures:
```bash
# Verificar configurações R2
vercel env ls | grep R2

# Testar conectividade
curl -I $R2_ENDPOINT
```

### N8N Webhook Issues:
```bash
# Verificar circuit breaker
# Logs mostrarão estado do circuit breaker

# Reset manual se necessário
# Implementar endpoint /api/admin/reset-circuit-breaker
```