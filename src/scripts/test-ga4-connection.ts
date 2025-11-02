#!/usr/bin/env tsx

/**
 * 🔍 TESTE DE CONEXÃO GA4 API
 * 
 * Script para verificar se a conexão com a GA4 API está funcionando
 * com as credenciais reais da conta do usuário.
 */

import { BetaAnalyticsDataClient } from '@google-analytics/data';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

interface GA4ConnectionTest {
  success: boolean;
  propertyId?: string;
  error?: string;
  accountInfo?: {
    propertyName: string;
    timeZone: string;
    currencyCode: string;
  };
  basicMetrics?: {
    totalUsers: number;
    sessions: number;
    pageviews: number;
    dateRange: string;
  };
}

class GA4ConnectionTester {
  private analyticsDataClient: BetaAnalyticsDataClient;
  private propertyId: string;

  constructor() {
    // Verificar se as variáveis de ambiente estão configuradas
    this.propertyId = process.env.GA4_PROPERTY_ID || '';
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || '';

    if (!this.propertyId) {
      throw new Error('❌ GA4_PROPERTY_ID não encontrado no .env.local');
    }

    if (!credentialsPath) {
      throw new Error('❌ GOOGLE_APPLICATION_CREDENTIALS não encontrado no .env.local');
    }

    console.log('🔧 Configurando cliente GA4...');
    console.log(`📊 Property ID: ${this.propertyId}`);
    console.log(`🔐 Credenciais: ${credentialsPath}`);

    // Inicializar cliente
    this.analyticsDataClient = new BetaAnalyticsDataClient({
      keyFilename: credentialsPath,
    });
  }

  /**
   * Testa a conexão básica com a API
   */
  async testBasicConnection(): Promise<GA4ConnectionTest> {
    try {
      console.log('\n🔍 Testando conexão básica...');

      // Fazer uma consulta simples para testar a conexão
      const [response] = await this.analyticsDataClient.runReport({
        property: `properties/${this.propertyId}`,
        dateRanges: [
          {
            startDate: '7daysAgo',
            endDate: 'today',
          },
        ],
        metrics: [
          { name: 'totalUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
        ],
      });

      // Extrair métricas básicas
      const row = response.rows?.[0];
      const basicMetrics = {
        totalUsers: parseInt(row?.metricValues?.[0]?.value || '0'),
        sessions: parseInt(row?.metricValues?.[1]?.value || '0'),
        pageviews: parseInt(row?.metricValues?.[2]?.value || '0'),
        dateRange: 'Últimos 7 dias',
      };

      console.log('✅ Conexão estabelecida com sucesso!');
      console.log('📊 Métricas básicas obtidas:');
      console.log(`   👥 Usuários: ${basicMetrics.totalUsers.toLocaleString()}`);
      console.log(`   📱 Sessões: ${basicMetrics.sessions.toLocaleString()}`);
      console.log(`   📄 Pageviews: ${basicMetrics.pageviews.toLocaleString()}`);

      return {
        success: true,
        propertyId: this.propertyId,
        basicMetrics,
      };

    } catch (error: any) {
      console.error('❌ Erro na conexão:', error.message);
      
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Testa se os eventos customizados estão sendo capturados
   */
  async testCustomEvents(): Promise<void> {
    try {
      console.log('\n🎯 Testando eventos customizados...');

      const [response] = await this.analyticsDataClient.runReport({
        property: `properties/${this.propertyId}`,
        dateRanges: [
          {
            startDate: '30daysAgo',
            endDate: 'today',
          },
        ],
        dimensions: [
          { name: 'eventName' },
        ],
        metrics: [
          { name: 'eventCount' },
        ],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            inListFilter: {
              values: [
                'select_promotion',
                'begin_checkout',
                'purchase',
                'generate_lead',
                'form_start',
                'add_to_cart',
                'view_item',
                'step_progress',
                'quantity_selected',
              ],
            },
          },
        },
        orderBys: [
          {
            metric: { metricName: 'eventCount' },
            desc: true,
          },
        ],
      });

      console.log('📊 Eventos customizados encontrados:');
      
      if (response.rows && response.rows.length > 0) {
        response.rows.forEach((row) => {
          const eventName = row.dimensionValues?.[0]?.value || 'Unknown';
          const eventCount = parseInt(row.metricValues?.[0]?.value || '0');
          console.log(`   🎯 ${eventName}: ${eventCount.toLocaleString()} eventos`);
        });
      } else {
        console.log('   ⚠️  Nenhum evento customizado encontrado nos últimos 30 dias');
        console.log('   💡 Verifique se o GTM está publicado e os eventos estão sendo disparados');
      }

    } catch (error: any) {
      console.error('❌ Erro ao buscar eventos customizados:', error.message);
    }
  }

  /**
   * Verifica se Enhanced Ecommerce está configurado
   */
  async testEcommerceEvents(): Promise<void> {
    try {
      console.log('\n🛒 Testando Enhanced Ecommerce...');

      const [response] = await this.analyticsDataClient.runReport({
        property: `properties/${this.propertyId}`,
        dateRanges: [
          {
            startDate: '30daysAgo',
            endDate: 'today',
          },
        ],
        dimensions: [
          { name: 'eventName' },
        ],
        metrics: [
          { name: 'eventCount' },
          { name: 'totalRevenue' },
        ],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            inListFilter: {
              values: [
                'purchase',
                'begin_checkout',
                'add_to_cart',
                'remove_from_cart',
                'view_item',
                'view_item_list',
                'select_item',
              ],
            },
          },
        },
        orderBys: [
          {
            metric: { metricName: 'eventCount' },
            desc: true,
          },
        ],
      });

      console.log('💰 Eventos de E-commerce encontrados:');
      
      if (response.rows && response.rows.length > 0) {
        let totalRevenue = 0;
        
        response.rows.forEach((row) => {
          const eventName = row.dimensionValues?.[0]?.value || 'Unknown';
          const eventCount = parseInt(row.metricValues?.[0]?.value || '0');
          const revenue = parseFloat(row.metricValues?.[1]?.value || '0');
          
          console.log(`   💳 ${eventName}: ${eventCount.toLocaleString()} eventos`);
          if (revenue > 0) {
            console.log(`      💰 Receita: R$ ${revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
            totalRevenue += revenue;
          }
        });

        if (totalRevenue > 0) {
          console.log(`\n💰 Receita total (30 dias): R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        }
      } else {
        console.log('   ⚠️  Nenhum evento de e-commerce encontrado');
      }

    } catch (error: any) {
      console.error('❌ Erro ao buscar eventos de e-commerce:', error.message);
    }
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 TESTE DE CONEXÃO GA4 API');
  console.log('================================\n');

  try {
    const tester = new GA4ConnectionTester();
    
    // Teste básico de conexão
    const connectionResult = await tester.testBasicConnection();
    
    if (!connectionResult.success) {
      console.log('\n❌ FALHA NA CONEXÃO');
      console.log('Verifique:');
      console.log('1. Se o arquivo de credenciais está no local correto');
      console.log('2. Se o Property ID está correto no .env.local');
      console.log('3. Se a service account tem permissão no GA4');
      console.log('4. Se a API do Google Analytics está ativada no Google Cloud');
      return;
    }

    // Testes adicionais se a conexão básica funcionou
    await tester.testCustomEvents();
    await tester.testEcommerceEvents();

    console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!');
    console.log('🎯 Sua conta GA4 está pronta para análise automatizada do funil.');
    console.log('\n📋 Próximo passo: Execute `npm run analyze-funnel` para análise completa.');

  } catch (error: any) {
    console.error('\n❌ ERRO CRÍTICO:', error.message);
    console.log('\n🔧 SOLUÇÕES:');
    console.log('1. Verifique se o arquivo .env.local existe e está configurado');
    console.log('2. Confirme se o arquivo de credenciais JSON está na pasta credentials/');
    console.log('3. Verifique se as dependências foram instaladas: npm install');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

export { GA4ConnectionTester };