# Sistema de Payload para Geração de Vídeos

## Estrutura da Tabela `pedidos_videos`

### Campos Principais

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| `id` | `serial4` | PRIMARY KEY, AUTO INCREMENT | Identificador único do pedido |
| `session_id` | `varchar(100)` | DEFAULT | ID da sessão do usuário |
| `nome` | `varchar(150)` | DEFAULT | Nome do cliente |
| `email` | `varchar(200)` | DEFAULT | Email do cliente |
| `telefone` | `varchar(20)` | DEFAULT | Telefone do cliente |
| `cpf` | `varchar(15)` | DEFAULT | CPF do cliente |
| `mensagem_personalizada` | `text` | DEFAULT | Mensagem personalizada para o vídeo |
| `numero_whatsapp_site` | `json` | - | Configurações do WhatsApp |
| `criancas` | `jsonb` | - | **Array de crianças (dados principais)** |
| `fotos` | `jsonb` | - | **Array de URLs das fotos** |
| `prioridade` | `varchar(20)` | DEFAULT | Status de prioridade do pedido |
| `pagamento` | `varchar(50)` | DEFAULT | Status do pagamento |
| `status_pedido` | `varchar(30)` | DEFAULT | Status atual do pedido |
| `created_at` | `timestamp` | DEFAULT CURRENT_TIMESTAMP | Data de criação |
| `updated_at` | `timestamp` | DEFAULT CURRENT_TIMESTAMP | Data de atualização |
| `valor_total` | `numeric(10,2)` | - | Valor total do pedido |
| `data_checkout` | `timestamp` | - | Data/hora do checkout |
| `order_bump` | `json` | - | **Order bumps selecionados** |

## Estrutura do Payload para Geração de Vídeo

### 1. Payload Principal

```typescript
interface VideoPayload {
  // Identificação do Pedido
  pedido_id: number;
  session_id: string;
  
  // Dados do Cliente
  cliente: {
    nome: string;
    email: string;
    telefone?: string;
    cpf?: string;
  };
  
  // Configuração do Vídeo
  video_config: {
    tipo_video: 'video-1-crianca' | 'video-2-criancas' | 'video-3-ou-mais-criancas';
    mensagem_personalizada?: string;
    order_bumps: OrderBumpConfig;
  };
  
  // Dados das Crianças (Principal) - Máximo 3 crianças
  criancas: Crianca[]; // Array de 1 a 3 crianças
  
  // Fotos (se order bump "photo" selecionado) - Máximo 3 fotos
  fotos?: string[]; // Array de URLs das fotos (1 a 3)
  
  // Configurações Técnicas
  configuracoes: {
    qualidade: '1080p' | '4k';
    entrega_rapida: boolean;
    prioridade: null | 1; // null = normal, 1 = entrega rápida
  };
  
  // Dados do Pedido
  pedido_info: {
    valor_total: number;
    data_checkout: string;
    status_pagamento: string;
  };
}
```

### 2. Interface das Crianças

```typescript
interface Crianca {
  nome: string; // Nome da criança
  foto_url?: string; // URL da foto (se enviada)
}

// Máximo de 3 crianças por pedido
type CriancasArray = [Crianca] | [Crianca, Crianca] | [Crianca, Crianca, Crianca];
```

### 3. Configuração de Order Bumps

```typescript
interface OrderBumpConfig {
  qualidade_4k: boolean;        // Upgrade para 4K
  entrega_rapida: boolean;      // Entrega em 3h
  foto_personalizada: boolean;  // Incluir foto da criança
  combo_completo: boolean;      // Todos os upgrades
}
```

### 4. Configuração de Upload de Fotos

```typescript
// Fotos são armazenadas como array de URLs (máximo 3)
type FotosArray = string[]; // URLs das fotos no R2

// Configuração para upload no Cloudflare R2
interface R2UploadConfig {
  bucket: string;
  region: string;
  endpoint: string;
  maxFileSize: number; // 10MB
  allowedFormats: string[]; // ['jpeg', 'jpg', 'png', 'webp']
}
```

## Valores Possíveis por Campo

### Status e Prioridades

```typescript
// prioridade - baseada no order bump de entrega rápida
type Prioridade = null | 1; // null = normal, 1 = entrega rápida

// status_pedido  
type StatusPedido = 'pendente' | 'processando' | 'em_producao' | 'concluido' | 'entregue' | 'cancelado';

// pagamento
type StatusPagamento = 'pendente' | 'aprovado' | 'recusado' | 'estornado' | 'processando';
```

### Configurações de Vídeo

```typescript
// Tipos de vídeo baseados na quantidade de crianças
type TipoVideo = 'video-1-crianca' | 'video-2-criancas' | 'video-3-ou-mais-criancas';

// Qualidades disponíveis
type Qualidade = null | 1;

// Opções de entrega
type TipoEntrega = 'normal' | 'rapida' | 'expressa';
```

## Exemplo de Payload Completo

```json
{
  "pedido_id": 123,
  "session_id": "sess_abc123def456",
  "cliente": {
    "nome": "Maria Silva",
    "email": "maria@email.com",
    "telefone": "+5511999999999",
    "cpf": "123.456.789-00"
  },
  "video_config": {
    "tipo_video": "video-2-criancas",
    "mensagem_personalizada": "Feliz Natal para meus amores!",
    "order_bumps": {
      "qualidade_4k": true,
      "entrega_rapida": false,
      "foto_personalizada": true,
      "combo_completo": false
    }
  },
  "criancas": [
    {
      "nome": "João",
      "foto_url": "https://r2.cloudflare.com/bucket/fotos/joao_123456.jpg"
    },
    {
      "nome": "Ana",
      "foto_url": "https://r2.cloudflare.com/bucket/fotos/ana_789012.jpg"
    },
    {
      "nome": "Pedro",
      "foto_url": "https://r2.cloudflare.com/bucket/fotos/pedro_345678.jpg"
    }
  ],
  "fotos": [
    "https://r2.cloudflare.com/bucket/fotos/joao_123456.jpg",
    "https://r2.cloudflare.com/bucket/fotos/ana_789012.jpg", 
    "https://r2.cloudflare.com/bucket/fotos/pedro_345678.jpg"
  ],
  "configuracoes": {
    "qualidade": "4k",
    "entrega_rapida": false,
    "prioridade": null
  },
  "pedido_info": {
    "valor_total": 86.89,
    "data_checkout": "2024-12-20T15:30:00Z",
    "status_pagamento": "aprovado"
  }
}
```
## Regras de Negócio

### 1. Validações Obrigatórias

- **Nome da criança**: Obrigatório, mínimo 2 caracteres
- **Idade**: Entre 1 e 18 anos
- **Gênero**: Deve ser 'masculino' ou 'feminino'
- **Email do cliente**: Formato válido
- **Tipo de vídeo**: Deve corresponder à quantidade de crianças

### 2. Regras de Order Bumps

- **Foto personalizada**: Requer upload de foto para cada criança
- **4K**: Aumenta tempo de processamento
- **Entrega rápida**: Define prioridade = 1 (caso contrário prioridade = null)
- **Combo completo**: Inclui todos os order bumps com desconto

### 3. Processamento de Fotos

- **Formatos aceitos**: JPEG, PNG, WebP
- **Tamanho máximo**: 10MB por foto
- **Resolução mínima**: 800x600px
- **Processamento**: Redimensionamento automático para 1920x1080

### 4. Estados do Pedido

```
pendente → processando → em_producao → concluido → entregue
    ↓
cancelado (pode acontecer em qualquer estado antes de "concluido")
```

## Integração com Sistema Atual

### Mapeamento dos Dados Existentes

O payload deve ser construído a partir dos dados já coletados no sistema atual:

1. **Dados do formulário** → `cliente` + `criancas`
2. **Order bumps selecionados** → `video_config.order_bumps` + `configuracoes`
   - `entrega_rapida: true` → `prioridade: 1`
   - `entrega_rapida: false` → `prioridade: null`
3. **Fotos enviadas** → `fotos` array
4. **Dados do checkout** → `pedido_info`

### Endpoint de Envio

```typescript
POST /api/video/generate
Content-Type: application/json

{
  // Payload completo conforme estrutura acima
}
```

### Resposta Esperada

```typescript
interface VideoGenerationResponse {
  success: boolean;
  pedido_id: number;
  video_id?: string;
  estimated_completion: string; // ISO date
  status: 'queued' | 'processing' | 'completed' | 'failed';
  message?: string;
}
```