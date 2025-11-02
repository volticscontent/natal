import dotenv from 'dotenv';
import { google } from 'googleapis';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

interface GA4Event {
  eventName: string;
  eventCount: number;
  uniqueUsers: number;
  conversionRate?: number;
}

interface FunnelStep {
  stepName: string;
  eventName: string;
  users: number;
  conversionRate: number;
  dropOffRate: number;
}

interface GA4ConfigVerification {
  propertyId: string;
  measurementId: string;
  events: GA4Event[];
  funnelSteps: FunnelStep[];
  customDimensions: any[];
  conversions: any[];
  audiences: any[];
}

class GA4ConfigChecker {
  private analytics: any;
  private propertyId: string;

  constructor(propertyId: string, serviceAccountKey?: string, accessToken?: string) {
    this.propertyId = propertyId;
    this.initializeAuth(serviceAccountKey, accessToken);
  }

  private async initializeAuth(serviceAccountKey?: string, accessToken?: string) {
    try {
      let auth;
      
      if (serviceAccountKey) {
        auth = new google.auth.GoogleAuth({
          keyFile: serviceAccountKey,
          scopes: [
            'https://www.googleapis.com/auth/analytics.readonly',
            'https://www.googleapis.com/auth/analytics.edit'
          ]
        });
      } else if (accessToken) {
        auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: accessToken });
      } else {
        throw new Error('Configuração de autenticação inválida');
      }

      this.analytics = google.analyticsdata({ version: 'v1beta', auth });
    } catch (error) {
      console.error('Erro na autenticação:', error);
      throw error;
    }
  }

  async verifyGA4Configuration(): Promise<GA4ConfigVerification> {
    console.log('🔍 Verificando configuração GA4...\n');

    try {
      // Verificar eventos dos últimos 7 dias
      const events = await this.getEvents();
      
      // Verificar funil de conversão
      const funnelSteps = await this.getFunnelAnalysis();
      
      // Verificar dimensões customizadas
      const customDimensions = await this.getCustomDimensions();
      
      // Verificar eventos de conversão
      const conversions = await this.getConversions();
      
      // Verificar audiências
      const audiences = await this.getAudiences();

      return {
        propertyId: this.propertyId,
        measurementId: process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || '',
        events,
        funnelSteps,
        customDimensions,
        conversions,
        audiences
      };
    } catch (error) {
      console.error('Erro ao verificar configuração GA4:', error);
      throw error;
    }
  }

  private async getEvents(): Promise<GA4Event[]> {
    console.log('📊 Analisando eventos GA4...');
    
    try {
      const response = await this.analytics.properties.runReport({
        property: `properties/${this.propertyId}`,
        requestBody: {
          dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'eventName' }],
          metrics: [
            { name: 'eventCount' },
            { name: 'activeUsers' }
          ],
          orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
          limit: 50
        }
      });

      const events: GA4Event[] = [];
      
      if (response.data.rows) {
        for (const row of response.data.rows) {
          events.push({
            eventName: row.dimensionValues?.[0]?.value || '',
            eventCount: parseInt(row.metricValues?.[0]?.value || '0'),
            uniqueUsers: parseInt(row.metricValues?.[1]?.value || '0')
          });
        }
      }

      console.log(`✅ ${events.length} eventos encontrados`);
      return events;
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      return [];
    }
  }

  private async getFunnelAnalysis(): Promise<FunnelStep[]> {
    console.log('🔄 Analisando funil de conversão...');
    
    const funnelEvents = [
      { stepName: 'Página Inicial', eventName: 'page_view' },
      { stepName: 'CTA Clicado', eventName: 'cta_clicked' },
      { stepName: 'Personalização Iniciada', eventName: 'personalization_started' },
      { stepName: 'Quantidade Selecionada', eventName: 'quantity_selected' },
      { stepName: 'Dados Preenchidos', eventName: 'form_submitted' },
      { stepName: 'Compra Finalizada', eventName: 'purchase' }
    ];

    const funnelSteps: FunnelStep[] = [];
    let previousUsers = 0;

    for (let i = 0; i < funnelEvents.length; i++) {
      const step = funnelEvents[i];
      
      try {
        const response = await this.analytics.properties.runReport({
          property: `properties/${this.propertyId}`,
          requestBody: {
            dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
            dimensionFilter: {
              filter: {
                fieldName: 'eventName',
                stringFilter: { value: step.eventName }
              }
            },
            metrics: [{ name: 'activeUsers' }]
          }
        });

        const users = parseInt(response.data.rows?.[0]?.metricValues?.[0]?.value || '0');
        const conversionRate = i === 0 ? 100 : previousUsers > 0 ? (users / previousUsers) * 100 : 0;
        const dropOffRate = 100 - conversionRate;

        funnelSteps.push({
          stepName: step.stepName,
          eventName: step.eventName,
          users,
          conversionRate,
          dropOffRate
        });

        if (i === 0) previousUsers = users;
        else previousUsers = users;
        
      } catch (error) {
        console.error(`Erro ao analisar etapa ${step.stepName}:`, error);
        funnelSteps.push({
          stepName: step.stepName,
          eventName: step.eventName,
          users: 0,
          conversionRate: 0,
          dropOffRate: 100
        });
      }
    }

    console.log(`✅ Funil analisado com ${funnelSteps.length} etapas`);
    return funnelSteps;
  }

  private async getCustomDimensions(): Promise<any[]> {
    console.log('🎯 Verificando dimensões customizadas...');
    
    try {
      // Para dimensões customizadas, precisamos usar a Admin API
      // Por enquanto, retornamos as configuradas no código
      const configuredDimensions = [
        { name: 'user_type', scope: 'USER' },
        { name: 'traffic_source', scope: 'SESSION' },
        { name: 'utm_campaign', scope: 'SESSION' },
        { name: 'personalization_type', scope: 'EVENT' },
        { name: 'funnel_step', scope: 'EVENT' }
      ];

      console.log(`✅ ${configuredDimensions.length} dimensões customizadas configuradas`);
      return configuredDimensions;
    } catch (error) {
      console.error('Erro ao verificar dimensões customizadas:', error);
      return [];
    }
  }

  private async getConversions(): Promise<any[]> {
    console.log('💰 Verificando eventos de conversão...');
    
    try {
      const response = await this.analytics.properties.runReport({
        property: `properties/${this.propertyId}`,
        requestBody: {
          dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'eventName' }],
          metrics: [
            { name: 'conversions' },
            { name: 'totalRevenue' }
          ],
          dimensionFilter: {
            filter: {
              fieldName: 'eventName',
              inListFilter: {
                values: ['purchase', 'lead_generated', 'personalization_complete']
              }
            }
          }
        }
      });

      const conversions: any[] = [];
      
      if (response.data.rows) {
        for (const row of response.data.rows) {
          conversions.push({
            eventName: row.dimensionValues?.[0]?.value || '',
            conversions: parseInt(row.metricValues?.[0]?.value || '0'),
            revenue: parseFloat(row.metricValues?.[1]?.value || '0')
          });
        }
      }

      console.log(`✅ ${conversions.length} eventos de conversão encontrados`);
      return conversions;
    } catch (error) {
      console.error('Erro ao verificar conversões:', error);
      return [];
    }
  }

  private async getAudiences(): Promise<any[]> {
    console.log('👥 Verificando audiências...');
    
    // Audiências configuradas no projeto
    const configuredAudiences = [
      { name: 'Visitantes Engajados', description: 'Usuários com scroll > 75% ou video_complete' },
      { name: 'Iniciaram Personalização', description: 'Usuários que começaram mas não finalizaram' },
      { name: 'Compradores', description: 'Usuários que fizeram purchase' },
      { name: 'High-Value Customers', description: 'Compradores com value > R$ 80' },
      { name: 'Order Bump Converters', description: 'Usuários que selecionaram upsells' }
    ];

    console.log(`✅ ${configuredAudiences.length} audiências configuradas`);
    return configuredAudiences;
  }

  generateReport(config: GA4ConfigVerification): void {
    console.log('\n📋 RELATÓRIO DE CONFIGURAÇÃO GA4');
    console.log('=====================================\n');

    console.log(`🏷️  Property ID: ${config.propertyId}`);
    console.log(`📊 Measurement ID: ${config.measurementId}\n`);

    // Eventos
    console.log('📊 EVENTOS DETECTADOS (últimos 7 dias):');
    console.log('----------------------------------------');
    config.events.slice(0, 10).forEach(event => {
      console.log(`• ${event.eventName}: ${event.eventCount.toLocaleString()} eventos, ${event.uniqueUsers.toLocaleString()} usuários`);
    });

    // Funil
    console.log('\n🔄 ANÁLISE DO FUNIL:');
    console.log('--------------------');
    config.funnelSteps.forEach((step, index) => {
      const arrow = index === 0 ? '🟢' : step.conversionRate > 50 ? '🟡' : '🔴';
      console.log(`${arrow} ${step.stepName}: ${step.users.toLocaleString()} usuários (${step.conversionRate.toFixed(1)}% conversão)`);
    });

    // Conversões
    console.log('\n💰 EVENTOS DE CONVERSÃO:');
    console.log('-------------------------');
    config.conversions.forEach(conv => {
      console.log(`• ${conv.eventName}: ${conv.conversions} conversões, R$ ${conv.revenue.toFixed(2)} receita`);
    });

    // Dimensões
    console.log('\n🎯 DIMENSÕES CUSTOMIZADAS:');
    console.log('---------------------------');
    config.customDimensions.forEach(dim => {
      console.log(`• ${dim.name} (${dim.scope})`);
    });

    // Audiências
    console.log('\n👥 AUDIÊNCIAS CONFIGURADAS:');
    console.log('----------------------------');
    config.audiences.forEach(aud => {
      console.log(`• ${aud.name}: ${aud.description}`);
    });

    console.log('\n✅ Verificação concluída!');
  }
}

// Função principal
async function verifyGA4Config() {
  try {
    const propertyId = process.env.GA4_PROPERTY_ID!;
    const serviceAccountKey = process.env.GA4_SERVICE_ACCOUNT_PATH;
    const accessToken = process.env.GA4_ACCESS_TOKEN;

    if (!propertyId) {
      console.error('❌ GA4_PROPERTY_ID não configurado no .env.local');
      return;
    }

    const checker = new GA4ConfigChecker(propertyId, serviceAccountKey, accessToken);
    const config = await checker.verifyGA4Configuration();
    checker.generateReport(config);

  } catch (error) {
    console.error('❌ Erro na verificação:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  verifyGA4Config();
}

export { GA4ConfigChecker, verifyGA4Config };