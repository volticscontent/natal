# 🎯 Guia de Configuração de Funis no GA4
## Projeto: Recadinhos do Papai Noel

Este guia fornece instruções passo a passo para configurar funis personalizados no Google Analytics 4 (GA4) para o projeto "Recadinhos do Papai Noel".

## 📊 Funis Configurados no Código

### 1. **Funil Principal de Conversão**
**ID:** `main_conversion_funnel`

**Etapas:**
1. **Página Inicial** (`homepage`)
   - Evento: `page_view` + `homepage_loaded`
   - Localização: Homepage principal

2. **Engajamento com Conteúdo** (`engagement`)
   - Evento: `cta_clicked`
   - Ação: Clique em qualquer CTA

3. **Início da Personalização** (`personalization`)
   - Evento: `page_view` no `/pers/1`
   - Localização: Primeira etapa da personalização

4. **Seleção de Produto** (`product_selection`)
   - Evento: `form_interaction` (quantidade selecionada)
   - Ação: Seleção da quantidade de crianças

5. **Dados Preenchidos** (`lead_generation`)
   - Evento: `form_interaction` (dados completos)
   - Ação: Preenchimento dos dados das crianças

6. **Compra Finalizada** (`purchase`)
   - Evento: `purchase_confirmed`
   - Localização: Página de thank you

### 2. **Funil de Engajamento de Vídeo**
**ID:** `video_engagement_funnel`

**Etapas:**
1. **Visualização da Página** (`page_view`)
2. **Início do Vídeo** (`video_start`)
3. **25% do Vídeo** (`video_25`)
4. **50% do Vídeo** (`video_50`)
5. **Vídeo Completo** (`video_complete`)
6. **CTA Clicado** (`cta_click`)

## 🔧 Configuração no GA4

### Passo 1: Acessar o GA4
1. Acesse [Google Analytics](https://analytics.google.com)
2. Selecione a propriedade do projeto
3. Navegue para **Explorar** > **Análise de funil**

### Passo 2: Criar Funil Principal de Conversão

#### Configuração do Funil:
```
Nome: Funil Principal - Recadinhos do Papai Noel
Tipo: Funil fechado (usuários devem passar por todas as etapas)
```

#### Etapas do Funil:

**Etapa 1: Página Inicial**
```
Nome: Página Inicial
Condição: Evento = page_view
Filtros adicionais: 
  - page_location contém "/"
  - event_name = "homepage_loaded"
```

**Etapa 2: Engajamento**
```
Nome: Engajamento com Conteúdo
Condição: Evento = cta_clicked
Filtros adicionais:
  - cta_source existe
```

**Etapa 3: Personalização**
```
Nome: Início da Personalização
Condição: Evento = page_view
Filtros adicionais:
  - page_location contém "/pers"
```

**Etapa 4: Seleção de Produto**
```
Nome: Seleção de Produto
Condição: Evento = form_interaction
Filtros adicionais:
  - form_name = "quantidade_criancas"
  - interaction_type = "change"
```

**Etapa 5: Lead Generation**
```
Nome: Dados Preenchidos
Condição: Evento = form_interaction
Filtros adicionais:
  - form_name = "dados_criancas"
  - interaction_type = "submit"
```

**Etapa 6: Conversão**
```
Nome: Compra Finalizada
Condição: Evento = purchase_confirmed
Filtros adicionais:
  - transaction_id existe
  - value > 0
```

### Passo 3: Criar Funil de Vídeo

#### Configuração do Funil:
```
Nome: Funil de Engajamento de Vídeo
Tipo: Funil aberto (usuários podem pular etapas)
```

#### Etapas do Funil:

**Etapa 1: Visualização**
```
Nome: Visualização da Página
Condição: Evento = page_view
```

**Etapa 2: Início do Vídeo**
```
Nome: Início do Vídeo
Condição: Evento = video_start
```

**Etapa 3: 25% do Vídeo**
```
Nome: 25% do Vídeo
Condição: Evento = video_progress
Filtros: video_percent = 25
```

**Etapa 4: 50% do Vídeo**
```
Nome: 50% do Vídeo
Condição: Evento = video_progress
Filtros: video_percent = 50
```

**Etapa 5: Vídeo Completo**
```
Nome: Vídeo Completo
Condição: Evento = video_complete
```

**Etapa 6: CTA Clicado**
```
Nome: CTA Clicado
Condição: Evento = cta_clicked
```

## 📈 Métricas e KPIs

### Métricas Principais:
- **Taxa de Conversão Geral**: % de usuários que completam todo o funil
- **Taxa de Abandono por Etapa**: % de usuários que saem em cada etapa
- **Tempo Médio no Funil**: Tempo entre primeira visualização e conversão
- **Valor Médio por Conversão**: Receita média por compra

### Segmentações Recomendadas:
- **Por Fonte de Tráfego**: Orgânico, Pago, Social, Direto
- **Por Dispositivo**: Desktop, Mobile, Tablet
- **Por Localização**: Brasil, Internacional
- **Por Campanha UTM**: utm_campaign, utm_source, utm_medium

## 🎯 Eventos Personalizados Configurados

### Eventos de Funil:
- `funnel_step_completed`: Quando uma etapa é concluída
- `funnel_abandonment`: Quando um usuário abandona o funil
- `funnel_conversion`: Quando uma conversão é finalizada

### Eventos de Negócio:
- `homepage_loaded`: Carregamento da página inicial
- `cta_clicked`: Clique em call-to-action
- `purchase_confirmed`: Confirmação de compra
- `video_start`: Início de reprodução de vídeo
- `video_progress`: Progresso do vídeo (25%, 50%, 100%)

## 🔍 Análises Avançadas

### 1. **Análise de Coorte**
Configure coortes baseadas na data da primeira visualização para analisar retenção e conversão ao longo do tempo.

### 2. **Análise de Atribuição**
Use o modelo de atribuição baseado em dados para entender quais canais contribuem mais para as conversões.

### 3. **Análise de Público**
Crie audiências baseadas no comportamento no funil:
- Usuários que abandonaram na etapa de personalização
- Usuários que assistiram vídeo completo mas não converteram
- Compradores recorrentes

## 🚀 Próximos Passos

1. **Configurar Alertas**: Configure alertas para quedas significativas na taxa de conversão
2. **Dashboards Personalizados**: Crie dashboards específicos para monitoramento diário
3. **Testes A/B**: Use os funis para medir impacto de mudanças no site
4. **Otimização Contínua**: Analise pontos de abandono e otimize essas etapas

## 📞 Suporte

Para dúvidas sobre a implementação técnica, consulte:
- Documentação do GA4: [support.google.com/analytics](https://support.google.com/analytics)
- Código fonte: Arquivos em `/src/lib/ga4-funnel-config.ts` e `/src/hooks/useDataLayer.ts`

---

**Última atualização:** Dezembro 2024  
**Versão:** 1.0  
**Projeto:** Recadinhos do Papai Noel