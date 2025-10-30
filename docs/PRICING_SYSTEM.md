# Sistema de Preços - Recadinhos do Papai Noel

## 📊 Visão Geral do Sistema de Preços

O sistema utiliza **dois provedores de checkout** com preços diferenciados por região:
- **LastLink**: Brasil (BRL) - Preços mais altos
- **CartPanda**: Internacional (USD) - Preços mais baixos

## 💰 Tabela de Preços Completa

### 🎥 Produtos Principais (Vídeos)

| Produto | LastLink (BRL) | CartPanda (USD) | Desconto |
|---------|----------------|-----------------|----------|
| **1 Criança** | R$ 49,99 ~~R$ 69,99~~ | $29.99 ~~$49.99~~ | 29% OFF |
| **2 Crianças** | R$ 59,99 ~~R$ 79,99~~ | $39.99 ~~$59.99~~ | 25% OFF |
| **3+ Crianças** | R$ 69,99 ~~R$ 99,99~~ | $49.99 ~~$69.99~~ | 30% OFF |

### 🎁 Order Bumps (Complementos)

| Complemento | LastLink (BRL) | CartPanda (USD) | Economia no Combo |
|-------------|----------------|-----------------|-------------------|
| **Qualidade 4K** | R$ 12,00 | $4.99 | - |
| **Entrega Rápida** | R$ 12,00 | $2.99 | - |
| **Foto da Criança** | R$ 14,90 | $4.99 | - |
| **Combo Completo** | R$ 29,99 | $9.99 | R$ 8,91 / $2.98 |

### 💡 Cálculo do Combo
- **Individual**: R$ 38,90 (12+12+14,90) / $12.97 (4.99+2.99+4.99)
- **Combo**: R$ 29,99 / $9.99
- **Economia**: R$ 8,91 / $2.98

## 🔗 URLs de Checkout LastLink

### 📹 Vídeo 1 Criança
| Configuração | Código LastLink |
|--------------|-----------------|
| **Base** (sem complementos) | `C0EE44F93` |
| **+ 4K** | `CDA6777BF` |
| **+ Entrega Rápida** | `C4611BC02` |
| **+ Foto** | `C4240D0D9` |
| **+ 4K + Entrega Rápida** | `CD130B4F2` |
| **+ 4K + Foto** | `C9C9B03E3` |
| **+ Entrega Rápida + Foto** | `CDA157BB1` |
| **+ Todos (4K + Entrega + Foto)** | `C87D15C87` |
| **+ Combo** | `CC81F4813` |

### 📹 Vídeo 2 Crianças
| Configuração | Código LastLink |
|--------------|-----------------|
| **Base** (sem complementos) | `C93ACA8B6` |
| **+ 4K** | `C45ED916B` |
| **+ Entrega Rápida** | `CC4DC9AE4` |
| **+ Foto** | `C73BCEC41` |
| **+ 4K + Entrega Rápida** | `CAE24A1A8` |
| **+ 4K + Foto** | `C083D7CE5` |
| **+ Entrega Rápida + Foto** | `CCD33E991` |
| **+ Todos (4K + Entrega + Foto)** | `C2A46559E` |
| **+ Combo** | `CD9EFF4C9` |

### 📹 Vídeo 3+ Crianças
| Configuração | Código LastLink |
|--------------|-----------------|
| **Base** (sem complementos) | `C81BBAC35` |
| **+ 4K** | `C45ED916B` |
| **+ Entrega Rápida** | `CF799CB6D` |
| **+ Foto** | `C50663D83` |
| **+ 4K + Entrega Rápida** | `C0AEA4D21` |
| **+ 4K + Foto** | `C7C011D46` |
| **+ Entrega Rápida + Foto** | `C7D6B6AE2` |
| **+ Todos (4K + Entrega + Foto)** | `C8BAACD7C` |
| **+ Combo** | `CA196C8C0` |

## ⚙️ Lógica de Cálculo de Preços

### 🎯 Algoritmo de Seleção de URL

O sistema usa a seguinte **ordem de prioridade** para mapear as seleções:

```typescript
// Prioridade decrescente
1. withCombo      // Combo completo (maior economia)
2. withAll        // Todas as opções individuais
3. with4KAndFastDelivery
4. with4KAndPhoto
5. withFastDeliveryAndPhoto
6. with4K         // Opções individuais
7. withFastDelivery
8. withPhoto
9. base           // Sem complementos
```

### 💻 Implementação do Cálculo

#### LastLink (Brasil)
```typescript
const calculateLastLinkPricing = (persData) => {
  const basePrice = getBaseVideoPrice(); // 49.99, 59.99 ou 69.99
  const photoPrice = 14.90; // Preço por foto adicional
  const photoCount = persData.fotos?.length || 0;
  
  return {
    basePrice,
    additionalCosts: photoCount * photoPrice,
    total: basePrice + (photoCount * photoPrice),
    currency: 'BRL'
  };
};
```

#### CartPanda (Internacional)
```typescript
const calculateCartPandaPricing = (persData) => {
  const basePrice = getBaseVideoPrice(); // 29.99, 39.99 ou 49.99
  const photoPrice = 4.99; // Preço por foto adicional
  const photoCount = persData.fotos?.length || 0;
  
  // Aplicar lógica de order bumps
  let additionalCosts = 0;
  
  if (persData.orderBumps?.includes('4k')) {
    additionalCosts += 4.99;
  }
  
  if (persData.orderBumps?.includes('fastDelivery')) {
    additionalCosts += 2.99;
  }
  
  if (persData.orderBumps?.includes('photo')) {
    additionalCosts += 4.99;
  }
  
  // Verificar se é combo completo (economia)
  if (persData.orderBumps?.includes('combo')) {
    additionalCosts = 9.99; // Preço fixo do combo
  }
  
  // Adicionar custo de fotos extras
  additionalCosts += photoCount * photoPrice;
  
  return {
    basePrice,
    additionalCosts,
    total: basePrice + additionalCosts,
    currency: 'USD'
  };
};
```

### 🔄 Seleção Automática de Provider

```typescript
const getCheckoutProvider = (locale, country) => {
  // Brasil sempre usa LastLink
  if (country === 'BR' || locale === 'pt') {
    return 'lastlink';
  }
  
  // Outros países usam CartPanda
  return 'cartpanda';
};
```

## 📋 Estrutura de Dados de Preços

### 🏷️ Interface ProductPricing
```typescript
interface ProductPricing {
  price: number;           // Preço atual
  originalPrice?: number;  // Preço original (riscado)
  currency: string;        // 'BRL' ou 'USD'
}
```

### 🛒 Payload de Checkout
```typescript
// LastLink
interface LastLinkPayload {
  pricing: {
    base_price: number;      // Preço base do vídeo
    additional_costs: number; // Custos de fotos extras
    total: number;           // Total final
    currency: 'BRL';
  };
}

// CartPanda
interface CartPandaPayload {
  pricing: {
    base_price: number;      // Preço base do vídeo
    additional_costs: number; // Custos de fotos extras
    total: number;           // Total final
    currency: 'USD';
  };
}
```

## 🎨 Exibição de Preços na UI

### 💸 Formatação de Moeda
```typescript
// Brasil (LastLink)
const formatBRL = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Internacional (CartPanda)
const formatUSD = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
};
```

### 📊 Componente de Preço
```typescript
const PriceDisplay = ({ pricing, showOriginal = true }) => {
  const { price, originalPrice, currency } = pricing;
  const formatter = currency === 'BRL' ? formatBRL : formatUSD;
  
  return (
    <div className="price-display">
      <span className="current-price">{formatter(price)}</span>
      {showOriginal && originalPrice && (
        <span className="original-price">{formatter(originalPrice)}</span>
      )}
    </div>
  );
};
```

## 🔍 Debugging e Monitoramento

### 🐛 Funções de Debug
```typescript
// Debug LastLink
const debugLastLink = (persData) => {
  console.log('LastLink Pricing:', calculateLastLinkPricing(persData));
};

// Debug CartPanda
const debugCartPanda = (persData) => {
  console.log('CartPanda Pricing:', calculateCartPandaPricing(persData));
};
```

### 📈 Métricas Importantes
- **Taxa de conversão por faixa de preço**
- **Uptake de order bumps** (% que seleciona complementos)
- **Valor médio do pedido** (AOV)
- **Comparação de performance** LastLink vs CartPanda
- **Abandono por step** de preço

## 🚨 Validações de Preço

### ✅ Verificações Obrigatórias
1. **Produto existe** e tem preços configurados
2. **Provider disponível** para a região
3. **URLs de checkout** configuradas
4. **Moeda correta** para o provider
5. **Cálculos consistentes** entre frontend e backend

### ⚠️ Tratamento de Erros
```typescript
const validatePricing = (product, provider) => {
  if (!product.pricing[provider]) {
    throw new Error(`Pricing not configured for ${provider}`);
  }
  
  if (!product.checkoutUrls?.[provider]) {
    throw new Error(`Checkout URLs not configured for ${provider}`);
  }
  
  return true;
};
```

## 🔄 Atualizações de Preço

### 📝 Processo de Atualização
1. **Atualizar** `products.json`
2. **Verificar** URLs de checkout na LastLink
3. **Testar** cálculos em desenvolvimento
4. **Validar** formatação de moeda
5. **Deploy** e monitorar conversões

### 🎯 Estratégias de Preço
- **Preços psicológicos** (.99, .90)
- **Descontos atrativos** (25-30% OFF)
- **Combos com economia real**
- **Diferenciação regional** (BRL vs USD)
- **Testes A/B** de preços