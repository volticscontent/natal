# Sistema de Personalização - Comportamento Ideal

## Visão Geral

O sistema de personalização dos "Recadinhos do Papai Noel" é um fluxo de 3 etapas que coleta dados do usuário e gera URLs de checkout personalizadas baseadas nas seleções feitas.

## Fluxo Principal

### 1. Step 1 - Quantidade de Crianças
- **Objetivo**: Definir quantas crianças receberão mensagens (1-3)
- **Dados coletados**: `quantidade_criancas: number`
- **Validação**: Mínimo 1, máximo 3 crianças
- **Storage**: Salvo em `localStorage` com chave `STORAGE_KEYS.PERS_DATA`

### 2. Step 2 - Order Bumps
- **Objetivo**: Seleção de complementos/upgrades
- **Opções disponíveis**:
  - `4k-quality`: Qualidade 4K
  - `fast-delivery`: Entrega Rápida
  - `child-photo`: Foto da Criança
  - `combo-addons`: Combo Completo
- **Dados coletados**: `order_bumps: string[]`
- **Validação**: Máximo 4 seleções simultâneas

### 3. Step 3 - Dados das Crianças + Contato
- **Dados das crianças**:
  - `nome: string` (obrigatório)
  - `foto?: string` (Base64 ou URL, opcional)
  - `idade?: number` (opcional)
  - `comportamento?: string` (opcional)
- **Dados de contato**:
  - `nome: string` (obrigatório)
  - `email: string` (obrigatório)
  - `telefone: string` (obrigatório)
  - `cnpj?: string` (opcional para PJ)

## Tipos de Dados

### Interface Principal - PersData
```typescript
interface PersData {
  quantidade_criancas: number;
  children: Crianca[];
  mensagem: string;
  incluir_fotos: boolean;
  fotos?: string[];
  order_bumps: string[];
  observacoes?: string;
  contato?: ContactData;
}
```

### Interface Criança
```typescript
interface Crianca {
  nome: string;
  foto?: string;
  idade?: number;
  comportamento?: string;
}
```

### Interface OrderBumpSelection
```typescript
interface OrderBumpSelection {
  '4k-quality': boolean;
  'fast-delivery': boolean;
  'child-photo': boolean;
  'combo-addons': boolean;
}
```

## Sistema de Checkout

### Hooks Principais

#### useCheckoutUrlGenerator
- **Responsabilidade**: Orquestrar o processo de checkout
- **Funcionalidades**:
  - Validar dados de personalização
  - Determinar provider (LastLink vs CartPanda)
  - Gerar URL final de checkout
  - Redirecionar usuário

#### useLastLinkUrlMapper
- **Responsabilidade**: Mapear seleções para URLs específicas da LastLink
- **Lógica de mapeamento**:
  1. **Combo** → `withCombo` (prioridade máxima)
  2. **Todas opções** → `withAll`
  3. **4K + Fast** → `with4KAndFastDelivery`
  4. **4K + Photo** → `with4KAndPhoto`
  5. **Fast + Photo** → `withFastDeliveryAndPhoto`
  6. **Individuais** → `with4K`, `withFastDelivery`, `withPhoto`
  7. **Nenhuma** → `base`

### Providers de Checkout

#### LastLink (Brasil)
- **Moeda**: BRL
- **Dados específicos**: CPF obrigatório
- **Região**: Brasil
- **Validação**: Dados brasileiros (CPF, telefone BR)

#### CartPanda (Internacional)
- **Moeda**: USD
- **Dados específicos**: Country code
- **Região**: Global (US, CA, GB, AU, ES, FR, DE)
- **Validação**: Dados internacionais

## Persistência de Dados

### LocalStorage
- **Chave**: `STORAGE_KEYS.PERS_DATA`
- **Formato**: JSON serializado
- **Ciclo de vida**: Persiste entre sessões
- **Limpeza**: Automática após checkout bem-sucedido

### Estrutura de Storage
```typescript
const STORAGE_KEYS = {
  SESSION_DATA: 'pers_session_data',
  PERS_DATA: 'pers_personalization_data',
  CURRENT_STEP: 'pers_current_step',
} as const;
```

## Validações

### Pré-checkout
1. **Dados obrigatórios**:
   - Quantidade de crianças válida (1-3)
   - Nome de todas as crianças
   - Dados de contato completos
   - Mensagem personalizada

2. **URLs do produto**:
   - Verificar se produto tem URLs configuradas
   - Validar mapeamento de order bumps
   - Confirmar provider disponível

3. **Dados específicos do provider**:
   - **LastLink**: CPF válido para Brasil
   - **CartPanda**: Country code para internacional

## Fluxo de Erro

### Cenários de Erro
1. **Dados incompletos**: Retorna para step anterior
2. **URLs não configuradas**: Erro de configuração
3. **Provider indisponível**: Fallback ou erro
4. **Validação falhou**: Mensagem específica ao usuário

### Tratamento
- Mensagens de erro contextuais
- Preservação de dados já inseridos
- Opção de retry automático
- Logs para debugging

## Otimizações

### Performance
- Memoização de funções de geração de URL
- Lazy loading de providers
- Debounce em inputs de formulário
- Validação assíncrona

### UX
- Salvamento automático de dados
- Indicador de progresso
- Navegação entre steps
- Preview de seleções

## Monitoramento

### Métricas Importantes
- Taxa de conversão por step
- Abandono em cada etapa
- Erros de validação mais comuns
- Performance de geração de URLs
- Sucesso de checkout por provider

### Debug
- Logs estruturados em desenvolvimento
- Função `debugCartPanda()` e `debugLastLink()`
- Validação de configuração em tempo real
- Testes de integração com providers

## Considerações de Segurança

### Dados Sensíveis
- CPF/CNPJ não persistidos em localStorage
- Fotos em Base64 com limite de tamanho
- Sanitização de inputs de usuário
- Validação de tipos TypeScript

### APIs Externas
- Timeout configurável para requests
- Retry automático em falhas temporárias
- Validação de responses
- Rate limiting awareness