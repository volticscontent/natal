#!/usr/bin/env tsx

/**
 * 🎯 ANÁLISE AUTOMATIZADA COMPLETA DO FUNIL - GA4 API
 * 
 * Script para análise detalhada do funil de conversão usando dados reais
 * da conta GA4 do usuário. Gera relatório completo com insights e recomendações.
 */

import { BetaAnalyticsDataClient } from '@google-analytics/data';
import * as dotenv from 'dotenv';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

interface FunnelStep {
  name: string;
  eventName: string;
  users: number;
  sessions: number;
  events: number;
  conversionRate: number;
  dropOffRate: number;
  dropOffUsers: number;
}

interface FunnelAnalysis {
  totalUsers: number;
  totalSessions: number;
  totalRevenue: number;
  averageOrderValue: number;
  overallConversionRate: number;
  steps: FunnelStep[];
  insights: string[];
  recommendations: string[];
  dateRange: string;
}

interface DeviceAnalysis {
  device: string;
  users: number;
  conversionRate: number;
  revenue: number;
}

interface TrafficSourceAnalysis {
  source: string;
  medium: string;
  users: number;
  conversionRate: number;
  revenue: number;
}

class GA4FunnelAnalyzer {
  private analyticsDataClient: BetaAnalyticsDataClient;
  private propertyId: string;

  constructor() {
    this.propertyId = process.env.GA4_PROPERTY_ID || '';
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || '';

    if (!this.propertyId || !credentialsPath) {
      throw new Error('❌ Configurações GA4 não encontradas. Verifique .env.local');
    }

    this.analyticsDataClient = new BetaAnalyticsDataClient({
      keyFilename: credentialsPath,
    });
  }

  /**
   * Analisa o funil principal de conversão
   */
  async analyzeFunnel(days: number = 30): Promise<FunnelAnalysis> {
    console.log(`🔍 Analisando funil dos últimos ${days} dias...`);

    // Definir etapas do funil baseadas na configuração GTM
    const funnelSteps = [
      { name: 'Landing Page', eventName: 'page_view' },
      { name: 'CTA Click', eventName: 'select_promotion' },
      { name: 'Personalização Iniciada', eventName: 'form_start' },
      { name: 'Produto Visualizado', eventName: 'view_item' },
      { name: 'Adicionado ao Carrinho', eventName: 'add_to_cart' },
      { name: 'Checkout Iniciado', eventName: 'begin_checkout' },
      { name: 'Compra Finalizada', eventName: 'purchase' },
    ];

    const steps: FunnelStep[] = [];
    let previousUsers = 0;

    // Analisar cada etapa do funil
    for (let i = 0; i < funnelSteps.length; i++) {
      const step = funnelSteps[i];
      console.log(`   📊 Analisando: ${step.name}...`);

      const stepData = await this.getStepData(step.eventName, days);
      
      const conversionRate = previousUsers > 0 ? (stepData.users / previousUsers) * 100 : 100;
      const dropOffRate = previousUsers > 0 ? 100 - conversionRate : 0;
      const dropOffUsers = previousUsers > 0 ? previousUsers - stepData.users : 0;

      steps.push({
        name: step.name,
        eventName: step.eventName,
        users: stepData.users,
        sessions: stepData.sessions,
        events: stepData.events,
        conversionRate: i === 0 ? 100 : conversionRate,
        dropOffRate: i === 0 ? 0 : dropOffRate,
        dropOffUsers: i === 0 ? 0 : dropOffUsers,
      });

      previousUsers = stepData.users;
    }

    // Obter dados de receita
    const revenueData = await this.getRevenueData(days);
    
    // Calcular métricas gerais
    const totalUsers = steps[0]?.users || 0;
    const finalUsers = steps[steps.length - 1]?.users || 0;
    const overallConversionRate = totalUsers > 0 ? (finalUsers / totalUsers) * 100 : 0;

    // Gerar insights e recomendações
    const insights = this.generateInsights(steps, revenueData);
    const recommendations = this.generateRecommendations(steps, revenueData);

    return {
      totalUsers,
      totalSessions: steps[0]?.sessions || 0,
      totalRevenue: revenueData.totalRevenue,
      averageOrderValue: revenueData.averageOrderValue,
      overallConversionRate,
      steps,
      insights,
      recommendations,
      dateRange: `Últimos ${days} dias`,
    };
  }

  /**
   * Obtém dados de uma etapa específica do funil
   */
  private async getStepData(eventName: string, days: number) {
    const [response] = await this.analyticsDataClient.runReport({
      property: `properties/${this.propertyId}`,
      dateRanges: [
        {
          startDate: `${days}daysAgo`,
          endDate: 'today',
        },
      ],
      metrics: [
        { name: 'totalUsers' },
        { name: 'sessions' },
        { name: 'eventCount' },
      ],
      dimensionFilter: eventName !== 'page_view' ? {
        filter: {
          fieldName: 'eventName',
          stringFilter: {
            value: eventName,
            matchType: 'EXACT',
          },
        },
      } : undefined,
    });

    const row = response.rows?.[0];
    return {
      users: parseInt(row?.metricValues?.[0]?.value || '0'),
      sessions: parseInt(row?.metricValues?.[1]?.value || '0'),
      events: parseInt(row?.metricValues?.[2]?.value || '0'),
    };
  }

  /**
   * Obtém dados de receita
   */
  private async getRevenueData(days: number) {
    const [response] = await this.analyticsDataClient.runReport({
      property: `properties/${this.propertyId}`,
      dateRanges: [
        {
          startDate: `${days}daysAgo`,
          endDate: 'today',
        },
      ],
      metrics: [
        { name: 'totalRevenue' },
        { name: 'purchaseRevenue' },
        { name: 'transactions' },
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: {
            value: 'purchase',
            matchType: 'EXACT',
          },
        },
      },
    });

    const row = response.rows?.[0];
    const totalRevenue = parseFloat(row?.metricValues?.[0]?.value || '0');
    const transactions = parseInt(row?.metricValues?.[2]?.value || '0');
    const averageOrderValue = transactions > 0 ? totalRevenue / transactions : 0;

    return {
      totalRevenue,
      transactions,
      averageOrderValue,
    };
  }

  /**
   * Analisa performance por dispositivo
   */
  async analyzeByDevice(days: number = 30): Promise<DeviceAnalysis[]> {
    console.log('📱 Analisando performance por dispositivo...');

    const [response] = await this.analyticsDataClient.runReport({
      property: `properties/${this.propertyId}`,
      dateRanges: [
        {
          startDate: `${days}daysAgo`,
          endDate: 'today',
        },
      ],
      dimensions: [
        { name: 'deviceCategory' },
      ],
      metrics: [
        { name: 'totalUsers' },
        { name: 'totalRevenue' },
        { name: 'transactions' },
      ],
      orderBys: [
        {
          metric: { metricName: 'totalUsers' },
          desc: true,
        },
      ],
    });

    return response.rows?.map((row) => {
      const device = row.dimensionValues?.[0]?.value || 'Unknown';
      const users = parseInt(row.metricValues?.[0]?.value || '0');
      const revenue = parseFloat(row.metricValues?.[1]?.value || '0');
      const transactions = parseInt(row.metricValues?.[2]?.value || '0');
      const conversionRate = users > 0 ? (transactions / users) * 100 : 0;

      return {
        device,
        users,
        conversionRate,
        revenue,
      };
    }) || [];
  }

  /**
   * Analisa performance por fonte de tráfego
   */
  async analyzeByTrafficSource(days: number = 30): Promise<TrafficSourceAnalysis[]> {
    console.log('🌐 Analisando performance por fonte de tráfego...');

    const [response] = await this.analyticsDataClient.runReport({
      property: `properties/${this.propertyId}`,
      dateRanges: [
        {
          startDate: `${days}daysAgo`,
          endDate: 'today',
        },
      ],
      dimensions: [
        { name: 'sessionSource' },
        { name: 'sessionMedium' },
      ],
      metrics: [
        { name: 'totalUsers' },
        { name: 'totalRevenue' },
        { name: 'transactions' },
      ],
      orderBys: [
        {
          metric: { metricName: 'totalUsers' },
          desc: true,
        },
      ],
      limit: 10,
    });

    return response.rows?.map((row) => {
      const source = row.dimensionValues?.[0]?.value || 'Unknown';
      const medium = row.dimensionValues?.[1]?.value || 'Unknown';
      const users = parseInt(row.metricValues?.[0]?.value || '0');
      const revenue = parseFloat(row.metricValues?.[1]?.value || '0');
      const transactions = parseInt(row.metricValues?.[2]?.value || '0');
      const conversionRate = users > 0 ? (transactions / users) * 100 : 0;

      return {
        source,
        medium,
        users,
        conversionRate,
        revenue,
      };
    }) || [];
  }

  /**
   * Gera insights baseados nos dados do funil
   */
  private generateInsights(steps: FunnelStep[], revenueData: any): string[] {
    const insights: string[] = [];

    // Identificar maior gargalo
    let maxDropOff = 0;
    let maxDropOffStep = '';
    
    steps.forEach((step, index) => {
      if (index > 0 && step.dropOffRate > maxDropOff) {
        maxDropOff = step.dropOffRate;
        maxDropOffStep = step.name;
      }
    });

    if (maxDropOffStep) {
      insights.push(`🚨 GARGALO CRÍTICO: ${maxDropOffStep} tem ${maxDropOff.toFixed(1)}% de abandono`);
    }

    // Analisar conversão geral
    const overallConversion = steps[steps.length - 1]?.conversionRate || 0;
    if (overallConversion < 2) {
      insights.push(`⚠️ Taxa de conversão geral muito baixa: ${overallConversion.toFixed(2)}%`);
    } else if (overallConversion > 5) {
      insights.push(`✅ Excelente taxa de conversão: ${overallConversion.toFixed(2)}%`);
    }

    // Analisar receita
    if (revenueData.averageOrderValue > 0) {
      insights.push(`💰 Ticket médio: R$ ${revenueData.averageOrderValue.toFixed(2)}`);
    }

    // Identificar etapas com boa performance
    steps.forEach((step, index) => {
      if (index > 0 && step.dropOffRate < 20) {
        insights.push(`✅ ${step.name} tem boa retenção: ${(100 - step.dropOffRate).toFixed(1)}%`);
      }
    });

    return insights;
  }

  /**
   * Gera recomendações baseadas nos dados
   */
  private generateRecommendations(steps: FunnelStep[], revenueData: any): string[] {
    const recommendations: string[] = [];

    // Recomendações baseadas nos gargalos
    steps.forEach((step, index) => {
      if (index > 0 && step.dropOffRate > 50) {
        recommendations.push(`🔧 URGENTE: Otimizar ${step.name} - ${step.dropOffRate.toFixed(1)}% de abandono`);
        
        switch (step.eventName) {
          case 'select_promotion':
            recommendations.push('   • Melhorar visibilidade e copy dos CTAs');
            recommendations.push('   • Testar diferentes posicionamentos');
            break;
          case 'form_start':
            recommendations.push('   • Simplificar formulário de personalização');
            recommendations.push('   • Adicionar indicadores de progresso');
            break;
          case 'begin_checkout':
            recommendations.push('   • Reduzir etapas do checkout');
            recommendations.push('   • Destacar opções de pagamento (PIX)');
            break;
          case 'purchase':
            recommendations.push('   • Adicionar elementos de confiança');
            recommendations.push('   • Otimizar processo de pagamento');
            break;
        }
      }
    });

    // Recomendações gerais
    recommendations.push('📊 Implementar testes A/B nas etapas críticas');
    recommendations.push('🎯 Criar campanhas de retargeting para usuários que abandonaram');
    recommendations.push('📱 Otimizar experiência mobile (se aplicável)');
    recommendations.push('⚡ Melhorar velocidade de carregamento');

    return recommendations;
  }

  /**
   * Gera relatório completo em Markdown
   */
  generateReport(analysis: FunnelAnalysis, deviceData: DeviceAnalysis[], trafficData: TrafficSourceAnalysis[]): string {
    const now = new Date().toLocaleString('pt-BR');
    
    let report = `# 🎯 ANÁLISE COMPLETA DO FUNIL - DADOS REAIS GA4\n\n`;
    report += `**Gerado em:** ${now}\n`;
    report += `**Período:** ${analysis.dateRange}\n`;
    report += `**Property ID:** ${this.propertyId}\n\n`;

    // Resumo executivo
    report += `## 📊 RESUMO EXECUTIVO\n\n`;
    report += `- **👥 Total de Usuários:** ${analysis.totalUsers.toLocaleString()}\n`;
    report += `- **📱 Total de Sessões:** ${analysis.totalSessions.toLocaleString()}\n`;
    report += `- **💰 Receita Total:** R$ ${analysis.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
    report += `- **🎯 Taxa de Conversão Geral:** ${analysis.overallConversionRate.toFixed(2)}%\n`;
    report += `- **💳 Ticket Médio:** R$ ${analysis.averageOrderValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n`;

    // Funil detalhado
    report += `## 🔄 FUNIL DE CONVERSÃO DETALHADO\n\n`;
    report += `| Etapa | Usuários | Taxa Conversão | Drop-off | Usuários Perdidos |\n`;
    report += `|-------|----------|----------------|----------|-----------------|\n`;
    
    analysis.steps.forEach((step) => {
      report += `| ${step.name} | ${step.users.toLocaleString()} | ${step.conversionRate.toFixed(1)}% | ${step.dropOffRate.toFixed(1)}% | ${step.dropOffUsers.toLocaleString()} |\n`;
    });

    // Insights
    report += `\n## 💡 INSIGHTS PRINCIPAIS\n\n`;
    analysis.insights.forEach((insight) => {
      report += `- ${insight}\n`;
    });

    // Performance por dispositivo
    if (deviceData.length > 0) {
      report += `\n## 📱 PERFORMANCE POR DISPOSITIVO\n\n`;
      report += `| Dispositivo | Usuários | Taxa Conversão | Receita |\n`;
      report += `|-------------|----------|----------------|----------|\n`;
      
      deviceData.forEach((device) => {
        report += `| ${device.device} | ${device.users.toLocaleString()} | ${device.conversionRate.toFixed(2)}% | R$ ${device.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} |\n`;
      });
    }

    // Performance por fonte de tráfego
    if (trafficData.length > 0) {
      report += `\n## 🌐 PERFORMANCE POR FONTE DE TRÁFEGO\n\n`;
      report += `| Fonte | Meio | Usuários | Taxa Conversão | Receita |\n`;
      report += `|-------|------|----------|----------------|----------|\n`;
      
      trafficData.slice(0, 10).forEach((traffic) => {
        report += `| ${traffic.source} | ${traffic.medium} | ${traffic.users.toLocaleString()} | ${traffic.conversionRate.toFixed(2)}% | R$ ${traffic.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} |\n`;
      });
    }

    // Recomendações
    report += `\n## 🚀 RECOMENDAÇÕES DE OTIMIZAÇÃO\n\n`;
    analysis.recommendations.forEach((recommendation, index) => {
      report += `${index + 1}. ${recommendation}\n`;
    });

    // Próximos passos
    report += `\n## 📋 PRÓXIMOS PASSOS\n\n`;
    report += `### PRIORIDADE ALTA (1-2 semanas)\n`;
    report += `- [ ] Otimizar etapa com maior drop-off\n`;
    report += `- [ ] Implementar testes A/B\n`;
    report += `- [ ] Melhorar velocidade de carregamento\n\n`;
    
    report += `### PRIORIDADE MÉDIA (2-4 semanas)\n`;
    report += `- [ ] Otimizar experiência mobile\n`;
    report += `- [ ] Criar campanhas de retargeting\n`;
    report += `- [ ] Implementar elementos de confiança\n\n`;
    
    report += `### PRIORIDADE BAIXA (1-2 meses)\n`;
    report += `- [ ] Análise de cohort\n`;
    report += `- [ ] Segmentação avançada\n`;
    report += `- [ ] Personalização baseada em comportamento\n\n`;

    // Impacto estimado
    const potentialImprovement = analysis.overallConversionRate * 2; // Estimativa conservadora
    const potentialRevenue = (analysis.totalRevenue / analysis.overallConversionRate) * potentialImprovement;
    const additionalRevenue = potentialRevenue - analysis.totalRevenue;

    report += `## 💰 IMPACTO FINANCEIRO ESTIMADO\n\n`;
    report += `**Cenário Conservador (dobrar conversão):**\n`;
    report += `- Taxa de conversão atual: ${analysis.overallConversionRate.toFixed(2)}%\n`;
    report += `- Taxa de conversão otimizada: ${potentialImprovement.toFixed(2)}%\n`;
    report += `- Receita adicional mensal: R$ ${additionalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
    report += `- ROI estimado: ${((additionalRevenue / analysis.totalRevenue) * 100).toFixed(0)}%\n\n`;

    report += `---\n\n`;
    report += `*Relatório gerado automaticamente pela análise GA4 API*\n`;
    report += `*Para dúvidas ou suporte, consulte a documentação do projeto*`;

    return report;
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 INICIANDO ANÁLISE COMPLETA DO FUNIL');
  console.log('=====================================\n');

  try {
    const analyzer = new GA4FunnelAnalyzer();
    
    // Executar análises
    console.log('📊 Executando análises...\n');
    
    const [funnelAnalysis, deviceData, trafficData] = await Promise.all([
      analyzer.analyzeFunnel(30),
      analyzer.analyzeByDevice(30),
      analyzer.analyzeByTrafficSource(30),
    ]);

    // Gerar relatório
    console.log('\n📝 Gerando relatório...');
    const report = analyzer.generateReport(funnelAnalysis, deviceData, trafficData);
    
    // Salvar relatório
    const reportPath = join(process.cwd(), 'RELATORIO-FUNIL-REAL-GA4.md');
    writeFileSync(reportPath, report, 'utf8');
    
    console.log(`✅ Relatório salvo em: ${reportPath}`);
    
    // Mostrar resumo no console
    console.log('\n🎯 RESUMO DA ANÁLISE:');
    console.log(`👥 Total de Usuários: ${funnelAnalysis.totalUsers.toLocaleString()}`);
    console.log(`💰 Receita Total: R$ ${funnelAnalysis.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    console.log(`🎯 Taxa de Conversão: ${funnelAnalysis.overallConversionRate.toFixed(2)}%`);
    console.log(`💳 Ticket Médio: R$ ${funnelAnalysis.averageOrderValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    
    console.log('\n📊 Principais Insights:');
    funnelAnalysis.insights.slice(0, 3).forEach((insight) => {
      console.log(`   ${insight}`);
    });

    console.log('\n✅ ANÁLISE CONCLUÍDA COM SUCESSO!');
    console.log(`📄 Relatório completo disponível em: RELATORIO-FUNIL-REAL-GA4.md`);

  } catch (error: any) {
    console.error('\n❌ ERRO NA ANÁLISE:', error.message);
    console.log('\n🔧 VERIFICAÇÕES:');
    console.log('1. Execute primeiro: npm run test-ga4');
    console.log('2. Confirme se as credenciais estão configuradas');
    console.log('3. Verifique se há dados suficientes na conta GA4');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

export { GA4FunnelAnalyzer };