/**
 * 🎯 Configuração de Funis GA4 - Recadinhos do Papai Noel
 * 
 * Este arquivo contém as configurações específicas para funis de conversão
 * no Google Analytics 4, incluindo eventos personalizados e métricas de conversão.
 */

// 📊 Tipos de dados para funis
export interface FunnelStep {
  name: string;
  event: string;
  conditions?: Record<string, any>;
  description?: string;
}

export interface FunnelConfig {
  id: string;
  name: string;
  description: string;
  steps: FunnelStep[];
  conversionWindow?: number; // em dias
}

// 🎯 Configuração do Funil Principal de Conversão
export const MAIN_CONVERSION_FUNNEL: FunnelConfig = {
  id: 'main_conversion_funnel',
  name: 'Funil Principal - Recadinhos do Papai Noel',
  description: 'Jornada completa do cliente desde a homepage até a compra',
  conversionWindow: 30,
  steps: [
    {
      name: 'Página Inicial',
      event: 'page_view',
      conditions: {
        page_location: 'contains /pt OR /en OR /es',
        page_title: 'contains Recadinhos do Papai Noel'
      },
      description: 'Usuário visualiza a página inicial'
    },
    {
      name: 'Engajamento com Conteúdo',
      event: 'scroll',
      conditions: {
        percent_scrolled: '>=50'
      },
      description: 'Usuário demonstra interesse scrollando pelo menos 50%'
    },
    {
      name: 'Início da Personalização',
      event: 'begin_checkout',
      conditions: {
        page_location: 'contains /pers'
      },
      description: 'Usuário inicia o processo de personalização'
    },
    {
      name: 'Seleção de Produto',
      event: 'add_to_cart',
      conditions: {
        item_category: 'main_product'
      },
      description: 'Usuário seleciona quantidade de crianças'
    },
    {
      name: 'Dados Preenchidos',
      event: 'generate_lead',
      conditions: {
        lead_source: 'website'
      },
      description: 'Usuário preenche dados das crianças e contato'
    },
    {
      name: 'Compra Finalizada',
      event: 'purchase',
      conditions: {
        currency: 'BRL OR USD'
      },
      description: 'Usuário completa a compra'
    }
  ]
};

// 📹 Funil de Engajamento de Vídeo
export const VIDEO_ENGAGEMENT_FUNNEL: FunnelConfig = {
  id: 'video_engagement_funnel',
  name: 'Engajamento de Vídeo',
  description: 'Jornada de engajamento com conteúdo de vídeo',
  conversionWindow: 7,
  steps: [
    {
      name: 'Visualização da Página',
      event: 'page_view',
      description: 'Usuário acessa página com vídeo'
    },
    {
      name: 'Início do Vídeo',
      event: 'video_start',
      conditions: {
        video_title: 'contains promotional OR demo'
      },
      description: 'Usuário inicia reprodução do vídeo'
    },
    {
      name: '25% do Vídeo',
      event: 'video_progress',
      conditions: {
        video_percent: 25
      },
      description: 'Usuário assiste 25% do vídeo'
    },
    {
      name: '50% do Vídeo',
      event: 'video_progress',
      conditions: {
        video_percent: 50
      },
      description: 'Usuário assiste 50% do vídeo'
    },
    {
      name: 'Vídeo Completo',
      event: 'video_complete',
      description: 'Usuário assiste o vídeo completo'
    },
    {
      name: 'CTA Clicado',
      event: 'select_promotion',
      conditions: {
        promotion_name: 'video_cta'
      },
      description: 'Usuário clica no CTA após o vídeo'
    }
  ]
};

// 🛒 Funil de Personalização Detalhado
export const PERSONALIZATION_FUNNEL: FunnelConfig = {
  id: 'personalization_funnel',
  name: 'Processo de Personalização',
  description: 'Jornada detalhada através do processo de personalização',
  conversionWindow: 1,
  steps: [
    {
      name: 'Entrada na Personalização',
      event: 'page_view',
      conditions: {
        page_location: 'contains /pers'
      },
      description: 'Usuário acessa a área de personalização'
    },
    {
      name: 'Etapa 1 - Visualização de Produtos',
      event: 'view_item_list',
      conditions: {
        item_list_name: 'product_selection'
      },
      description: 'Usuário visualiza opções de quantidade de crianças'
    },
    {
      name: 'Etapa 1 - Seleção de Quantidade',
      event: 'select_item',
      conditions: {
        item_category: 'main_product'
      },
      description: 'Usuário seleciona quantidade de crianças'
    },
    {
      name: 'Etapa 2 - Visualização de Upsells',
      event: 'view_promotion',
      conditions: {
        promotion_name: 'order_bumps'
      },
      description: 'Usuário visualiza order bumps'
    },
    {
      name: 'Etapa 3 - Início do Formulário',
      event: 'form_start',
      conditions: {
        form_name: 'children_data'
      },
      description: 'Usuário inicia preenchimento dos dados'
    },
    {
      name: 'Etapa 3 - Formulário Completo',
      event: 'form_submit',
      conditions: {
        form_name: 'children_data'
      },
      description: 'Usuário completa o formulário'
    },
    {
      name: 'Redirecionamento para Checkout',
      event: 'begin_checkout',
      conditions: {
        checkout_step: 1
      },
      description: 'Usuário é redirecionado para checkout externo'
    }
  ]
};

// 💰 Funil de Order Bumps
export const ORDER_BUMPS_FUNNEL: FunnelConfig = {
  id: 'order_bumps_funnel',
  name: 'Conversão de Order Bumps',
  description: 'Análise de conversão de produtos complementares',
  conversionWindow: 1,
  steps: [
    {
      name: 'Visualização de Upsells',
      event: 'view_promotion',
      conditions: {
        promotion_name: 'order_bumps'
      },
      description: 'Usuário visualiza opções de upsell'
    },
    {
      name: 'Seleção de Qualidade 4K',
      event: 'select_promotion',
      conditions: {
        promotion_id: '4k-quality'
      },
      description: 'Usuário seleciona upgrade para 4K'
    },
    {
      name: 'Seleção de Entrega Rápida',
      event: 'select_promotion',
      conditions: {
        promotion_id: 'fast-delivery'
      },
      description: 'Usuário seleciona entrega rápida'
    },
    {
      name: 'Seleção de Fotos Personalizadas',
      event: 'select_promotion',
      conditions: {
        promotion_id: 'child-photo'
      },
      description: 'Usuário adiciona fotos personalizadas'
    },
    {
      name: 'Combo Completo',
      event: 'select_promotion',
      conditions: {
        promotion_id: 'combo'
      },
      description: 'Usuário seleciona combo com todos os extras'
    }
  ]
};

// 📱 Funil Mobile vs Desktop
export const DEVICE_COMPARISON_FUNNEL: FunnelConfig = {
  id: 'device_comparison_funnel',
  name: 'Comparação Mobile vs Desktop',
  description: 'Análise de conversão por tipo de dispositivo',
  conversionWindow: 30,
  steps: [
    {
      name: 'Sessão Iniciada',
      event: 'session_start',
      description: 'Usuário inicia sessão no site'
    },
    {
      name: 'Página Inicial Visualizada',
      event: 'page_view',
      conditions: {
        page_location: 'contains /pt OR /en OR /es'
      },
      description: 'Usuário visualiza homepage'
    },
    {
      name: 'Engajamento Alto',
      event: 'user_engagement',
      conditions: {
        engagement_time_msec: '>=30000'
      },
      description: 'Usuário demonstra alto engajamento (30s+)'
    },
    {
      name: 'Início da Conversão',
      event: 'begin_checkout',
      description: 'Usuário inicia processo de conversão'
    },
    {
      name: 'Conversão Completa',
      event: 'purchase',
      description: 'Usuário completa a compra'
    }
  ]
};

// 🎯 Lista de todos os funis configurados
export const ALL_FUNNELS: FunnelConfig[] = [
  MAIN_CONVERSION_FUNNEL,
  VIDEO_ENGAGEMENT_FUNNEL,
  PERSONALIZATION_FUNNEL,
  ORDER_BUMPS_FUNNEL,
  DEVICE_COMPARISON_FUNNEL
];

// 📊 Configuração de Eventos Personalizados para Funis
export const FUNNEL_EVENTS = {
  // Eventos de progresso no funil
  funnel_step_completed: {
    event_category: 'funnel',
    event_label: 'step_completed',
    custom_parameters: {
      funnel_id: 'string',
      step_name: 'string',
      step_number: 'number',
      completion_time: 'number'
    }
  },

  // Eventos de abandono
  funnel_abandonment: {
    event_category: 'funnel',
    event_label: 'abandonment',
    custom_parameters: {
      funnel_id: 'string',
      exit_step: 'string',
      time_spent: 'number',
      abandonment_reason: 'string'
    }
  },

  // Eventos de conversão
  funnel_conversion: {
    event_category: 'funnel',
    event_label: 'conversion',
    custom_parameters: {
      funnel_id: 'string',
      conversion_value: 'number',
      conversion_time: 'number',
      steps_completed: 'number'
    }
  }
};

// 🔧 Utilitários para tracking de funis
export const FunnelUtils = {
  /**
   * Gera evento de progresso no funil
   */
  trackFunnelStep: (funnelId: string, stepName: string, stepNumber: number) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'funnel_step_completed', {
        funnel_id: funnelId,
        step_name: stepName,
        step_number: stepNumber,
        completion_time: Date.now()
      });
    }
  },

  /**
   * Gera evento de abandono do funil
   */
  trackFunnelAbandonment: (funnelId: string, exitStep: string, timeSpent: number) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'funnel_abandonment', {
        funnel_id: funnelId,
        exit_step: exitStep,
        time_spent: timeSpent,
        abandonment_reason: 'user_exit'
      });
    }
  },

  /**
   * Gera evento de conversão do funil
   */
  trackFunnelConversion: (funnelId: string, conversionValue: number, stepsCompleted: number) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'funnel_conversion', {
        funnel_id: funnelId,
        conversion_value: conversionValue,
        conversion_time: Date.now(),
        steps_completed: stepsCompleted
      });
    }
  }
};

// 📈 Configuração de Métricas Calculadas
export const FUNNEL_METRICS = {
  // Taxa de conversão por funil
  conversionRate: (funnelId: string) => ({
    name: `${funnelId}_conversion_rate`,
    formula: `funnel_conversion[funnel_id="${funnelId}"] / session_start`,
    description: `Taxa de conversão do funil ${funnelId}`
  }),

  // Tempo médio de conversão
  averageConversionTime: (funnelId: string) => ({
    name: `${funnelId}_avg_conversion_time`,
    formula: `AVG(funnel_conversion.conversion_time[funnel_id="${funnelId}"])`,
    description: `Tempo médio de conversão do funil ${funnelId}`
  }),

  // Taxa de abandono por etapa
  abandonmentRate: (funnelId: string, stepName: string) => ({
    name: `${funnelId}_${stepName}_abandonment_rate`,
    formula: `funnel_abandonment[funnel_id="${funnelId}"][exit_step="${stepName}"] / funnel_step_completed[funnel_id="${funnelId}"][step_name="${stepName}"]`,
    description: `Taxa de abandono na etapa ${stepName} do funil ${funnelId}`
  })
};

export default {
  ALL_FUNNELS,
  FUNNEL_EVENTS,
  FunnelUtils,
  FUNNEL_METRICS
};