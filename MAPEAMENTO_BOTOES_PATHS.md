# Mapeamento Completo de Botões, Paths e Redirecionamentos

## 📋 Índice
1. [Estrutura de Rotas](#estrutura-de-rotas)
2. [Página Principal (Landing Page)](#página-principal-landing-page)
3. [Fluxo de Personalização](#fluxo-de-personalização)
4. [Páginas de Conversão](#páginas-de-conversão)
5. [Componentes Reutilizáveis](#componentes-reutilizáveis)
6. [APIs e Endpoints](#apis-e-endpoints)

---

## 🗂️ Estrutura de Rotas

### Rotas Principais
```
/[locale]                    → Página inicial
/[locale]/pers/[step]        → Fluxo de personalização (steps 1-3)
/[locale]/checkout-redirect  → Redirecionamento para checkout
/[locale]/obrigado          → Página de agradecimento
/[locale]/video             → Página de vídeo do Papai Noel
/[locale]/precos            → Lista de preços
/[locale]/conta             → Login/Conta
/[locale]/gratis            → Produtos gratuitos
/[locale]/calendario-advento → Calendário do advento
/[locale]/avaliacoes        → Avaliações
/[locale]/lista-precos      → Lista de preços
/[locale]/politica-dados    → Política de dados
```

### APIs Disponíveis
```
/api/checkout               → Processamento de checkout
/api/pos-compra            → Pós-compra
/api/tracking              → Eventos de tracking
```

---

## 🏠 Página Principal (Landing Page)

### Header (Componente: Header.tsx)

#### Desktop Navigation
- **Logo** → `Link href="/${currentLocale}"` (Volta para home)
- **Vídeo do Papai Noel** → `Link href="/${currentLocale}/video"`
- **Lista de Preços** → `Link href="/${currentLocale}/precos"`
- **Login/Conta** → `Link href="/${currentLocale}/conta"`
- **Seletor de Idioma** → Dropdown (PT, EN, ES)
- **Carrinho** → Botão (funcionalidade não implementada)

#### Mobile Navigation
- **Menu Hamburger** → Abre menu mobile
- **Logo** → `Link href="/${currentLocale}"` (Volta para home)
- **Carrinho** → Botão mobile (funcionalidade não implementada)

#### Menu Mobile (quando aberto)
- **Vídeo do Papai Noel** → `Link href="/${currentLocale}/video"`
- **Lista de Preços** → `Link href="/${currentLocale}/precos"`
- **Login/Conta** → `Link href="/${currentLocale}/conta"`
- **Seletor de Idioma** → Dropdown mobile

### Hero Section (Componente: HeroSection.tsx)

#### CTAs Principais
- **Botão "Criar Vídeo"** → `onClick={onCtaClick}` → Redireciona para `/[locale]/pers/1`
- **Botão "Assistir Vídeo"** → `onClick={handleWatchVideoClick}` → Abre popup de vídeo

### Seções da Landing Page

#### ProductCarousel
- **Produtos** → `onProductClick={handleCtaClick}` → Redireciona para `/[locale]/pers/1`

#### EspiritoNatalinoSection
- **CTA** → `onCtaClick={handleCtaClick}` → Redireciona para `/[locale]/pers/1`

#### ComoPedirSection
- **CTA** → `onCtaClick={handleCtaClick}` → Redireciona para `/[locale]/pers/1`

#### VideoSection
- **CTA** → `onCtaClick={handleCtaClick}` → Redireciona para `/[locale]/pers/1`

#### CalendarioSection
- **CTA** → `onCtaClick={handleCtaClick}` → Redireciona para `/[locale]/pers/1`

#### DescontoCard
- **CTA** → `onCtaClick={handleCtaClick}` → Redireciona para `/[locale]/pers/1`

#### AvaliacaoEspecialistaSection
- **CTA** → `onCtaClick={handleCtaClick}` → Redireciona para `/[locale]/pers/1`

#### EspalhaBondadeSection
- **CTA** → `onCtaClick={handleCtaClick}` → Redireciona para `/[locale]/pers/1`

### Footer (Componente: FooterSection.tsx)

#### Newsletter
- **Campo Email** → Input para newsletter
- **Botão Inscrever** → `onSubmit` → Processa inscrição na newsletter

#### Links de Produtos
- **Vídeo Papai Noel** → `Link href="/video-papai-noel"`
- **Grátis** → `Link href="/gratis"`
- **Calendário Advento** → `Link href="/calendario-advento"`
- **Avaliações** → `Link href="/avaliacoes"`
- **Lista de Preços** → `Link href="/lista-precos"`
- **Política de Dados** → `Link href="/politica-dados"`

---

## 🎯 Fluxo de Personalização

### Step 1 - Quantidade de Crianças (Step1QuantidadeCriancas.tsx)

#### Navegação
- **Progress Bar** → Mostra progresso (1/3)
- **Cards de Quantidade** → `onClick={handleQuantitySelect}` → Seleciona quantidade
- **Botão Continuar** → `onNext={handleNext}` → Redireciona para `/[locale]/pers/2`

#### Funcionalidades
- Seleção de quantidade (1-6 crianças)
- Cálculo automático de preços
- Validação antes de prosseguir

### Step 2 - Order Bumps (Step2OrderBumps.tsx)

#### Navegação
- **Progress Bar** → Mostra progresso (2/3)
- **Botão Voltar** → `onBack={handlePrevious}` → Redireciona para `/[locale]/pers/1`
- **Botão Continuar** → `onNext={handleNext}` → Redireciona para `/[locale]/pers/3`
- **Botão Pular** → `onSkip={handleSkip}` → Redireciona para `/[locale]/pers/3`

#### Funcionalidades
- Seleção de produtos adicionais (order bumps)
- Toggle de seleção por produto
- Recálculo automático de preços

### Step 3 - Dados das Crianças (Step3DadosCriancas.tsx)

#### Navegação
- **Progress Bar** → Mostra progresso (3/3)
- **Botão Voltar** → `onBack={handlePrevious}` → Redireciona para `/[locale]/pers/2`
- **Botão Finalizar Pedido** → `onNext={handleNext}` → Processa checkout

#### Funcionalidades
- Formulário de dados das crianças
- Validação de CPF
- Dados de contato
- Processamento final do pedido

---

## 💳 Páginas de Conversão

### Checkout Redirect (checkout-redirect/page.tsx)

#### Funcionalidades
- **Redirecionamento Automático** → Redireciona para URL de checkout externa
- **Tracking de Checkout** → `trackCheckoutIniciado()`
- **Fallback Manual** → Botão caso redirecionamento falhe

### Página de Agradecimento (thank_youCartPanda.tsx)

#### Botões de Compartilhamento
- **WhatsApp** → `onClick` → Abre compartilhamento no WhatsApp
- **Facebook** → `onClick` → Abre compartilhamento no Facebook

#### Navegação
- **Voltar ao Início** → `href="/${locale}"` → Retorna para landing page

### Página de Agradecimento Alternativa (thank_youLastLink.tsx)

#### Funcionalidades
- Exibição de dados do pedido
- Confirmação de compra
- Links de retorno

---

## 🔧 Componentes Reutilizáveis

### Navigation (shared/Navigation.tsx)
- **Botão Voltar** → `onBack()` → Volta para step anterior
- **Botão Continuar/Finalizar** → `onNext()` → Avança para próximo step
- **Botão Pular** → `onSkip()` → Pula step atual (quando disponível)

### ProgressBar (shared/ProgressBar.tsx)
- **Indicador Visual** → Mostra progresso atual no funil

### OrderSummary (shared/OrderSummary.tsx)
- **Resumo do Pedido** → Exibe produtos selecionados e preços
- **Cálculos Dinâmicos** → Atualiza automaticamente com seleções

### CheckoutRedirectPopup
- **Popup de Redirecionamento** → Informa sobre redirecionamento para checkout
- **Timeout Automático** → Fecha automaticamente após tempo limite

---

## 🔗 Fluxo de Redirecionamentos

### Fluxo Principal de Conversão
```
Landing Page → Step 1 → Step 2 → Step 3 → Checkout → Thank You
     ↓           ↓        ↓        ↓         ↓         ↓
handleCtaClick  /pers/1  /pers/2  /pers/3  External  /obrigado
```

### Navegação Lateral
```
Header Links:
- /video (Vídeo do Papai Noel)
- /precos (Lista de Preços)  
- /conta (Login/Conta)

Footer Links:
- /video-papai-noel
- /gratis
- /calendario-advento
- /avaliacoes
- /lista-precos
- /politica-dados
```

### Funcionalidades de Tracking
- **UTM Tracking** → Preserva parâmetros UTM em todo o fluxo
- **Session Tracking** → Rastreia sessão do usuário
- **Event Tracking** → Registra eventos de conversão
- **Smart Tracking** → Sistema inteligente de analytics

---

## 📊 Eventos de Tracking Implementados

### Eventos Críticos
- `funnel_start` → Início do funil
- `step_completed` → Conclusão de step
- `add_to_cart` → Adição ao carrinho
- `begin_checkout` → Início do checkout
- `purchase` → Compra finalizada

### Eventos de Engajamento
- `page_view` → Visualização de página
- `form_interaction` → Interação com formulário
- `product_view` → Visualização de produto
- `video_engagement` → Engajamento com vídeo

### Eventos de Otimização
- `scroll_depth` → Profundidade de scroll
- `error_tracking` → Rastreamento de erros
- `exit_intent` → Intenção de saída
- `session_quality` → Qualidade da sessão

---

## 🎯 Pontos Críticos de Conversão

1. **Landing Page CTAs** → Múltiplos pontos de entrada para personalização
2. **Step 1 - Seleção de Quantidade** → Decisão principal do usuário
3. **Step 2 - Order Bumps** → Oportunidade de aumentar AOV
4. **Step 3 - Formulário** → Último ponto antes da conversão
5. **Checkout Redirect** → Transição crítica para pagamento

---

*Documento gerado automaticamente - Última atualização: Janeiro 2025*