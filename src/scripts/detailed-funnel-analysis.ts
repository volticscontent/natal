import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { GoogleAuth } from 'google-auth-library';
import { config } from 'dotenv';
import path from 'path';

// Carregar variáveis do .env.local
config({ path: path.resolve(process.cwd(), '.env.local') });

const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID;
const CREDENTIALS_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS;

interface FunnelStep {
  name: string;
  eventName: string;
  description: string;
}

interface FunnelAnalysis {
  step: string;
  users: number;
  sessions: number;
  events: number;
  conversionRate: number;
  dropOffRate: number;
  avgTimeToNext?: number;
}

interface DetailedMetrics {
  totalUsers: number;
  totalSessions: number;
  overallConversionRate: number;
  avgSessionDuration: number;
  bounceRate: number;
  topPages: Array<{ page: string; views: number; users: number }>;
  deviceBreakdown: Array<{ device: string; users: number; conversionRate: number }>;
  trafficSources: Array<{ source: string; users: number; conversionRate: number }>;
}

// Definindo o funil completo
const FUNNEL_STEPS: FunnelStep[] = [
  {
    name: 'Visitantes',
    eventName: 'page_view',
    description: 'Usuários que visitaram o site'
  },
  {
    name: 'Carta Iniciada',
    eventName: 'carta_iniciada',
    description: 'Usuários que começaram a criar uma carta'
  },
  {
    name: 'Carta Personalizada',
    eventName: 'carta_personalizada',
    description: 'Usuários que personalizaram a carta'
  },
  {
    name: 'Carta Escrita',
    eventName: 'carta_escrita',
    description: 'Usuários que terminaram de escrever'
  },
  {
    name: 'Checkout Iniciado',
    eventName: 'checkout_iniciado',
    description: 'Usuários que iniciaram o checkout'
  },
  {
    name: 'Pagamento Processado',
    eventName: 'pagamento_processado',
    description: 'Usuários que processaram o pagamento'
  },
  {
    name: 'Carta Finalizada',
    eventName: 'carta_finalizada',
    description: 'Conversão final - carta completa'
  }
];

async function setupAnalyticsClient() {
  let auth;
  
  if (CREDENTIALS_PATH) {
    auth = new GoogleAuth({
      keyFile: CREDENTIALS_PATH,
      scopes: ['https://www.googleapis.com/auth/analytics.readonly']
    });
  } else {
    auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/analytics.readonly']
    });
  }

  return new BetaAnalyticsDataClient({ auth });
}

async function getFunnelData(days: number = 30): Promise<FunnelAnalysis[]> {
  console.log(`📊 Analisando funil dos últimos ${days} dias...\n`);
  
  const analyticsDataClient = await setupAnalyticsClient();
  const funnelData: FunnelAnalysis[] = [];

  for (let i = 0; i < FUNNEL_STEPS.length; i++) {
    const step = FUNNEL_STEPS[i];
    
    try {
      const [response] = await analyticsDataClient.runReport({
        property: `properties/${GA4_PROPERTY_ID}`,
        dateRanges: [
          {
            startDate: `${days}daysAgo`,
            endDate: 'today',
          },
        ],
        dimensions: [
          { name: 'eventName' }
        ],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'eventCount' }
        ],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            stringFilter: {
              matchType: 'EXACT',
              value: step.eventName
            }
          }
        }
      });

      let users = 0;
      let sessions = 0;
      let events = 0;

      if (response.rows && response.rows.length > 0) {
        const row = response.rows[0];
        users = parseInt(row.metricValues?.[0]?.value || '0');
        sessions = parseInt(row.metricValues?.[1]?.value || '0');
        events = parseInt(row.metricValues?.[2]?.value || '0');
      }

      // Calcular taxa de conversão baseada no step anterior
      const conversionRate = i === 0 ? 100 : 
        funnelData[i-1].users > 0 ? (users / funnelData[i-1].users) * 100 : 0;
      
      const dropOffRate = 100 - conversionRate;

      funnelData.push({
        step: step.name,
        users,
        sessions,
        events,
        conversionRate,
        dropOffRate
      });

      console.log(`${step.name}: ${users} usuários (${conversionRate.toFixed(1)}% conversão)`);

    } catch (error: any) {
      console.error(`❌ Erro ao buscar dados para ${step.name}:`, error.message);
      
      // Adicionar dados vazios para manter a estrutura
      funnelData.push({
        step: step.name,
        users: 0,
        sessions: 0,
        events: 0,
        conversionRate: 0,
        dropOffRate: 100
      });
    }
  }

  return funnelData;
}

async function getDetailedMetrics(days: number = 30): Promise<DetailedMetrics> {
  console.log('\n📈 Coletando métricas detalhadas...\n');
  
  const analyticsDataClient = await setupAnalyticsClient();

  // Métricas gerais
  const [generalResponse] = await analyticsDataClient.runReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
    metrics: [
      { name: 'activeUsers' },
      { name: 'sessions' },
      { name: 'averageSessionDuration' },
      { name: 'bounceRate' }
    ]
  });

  const totalUsers = parseInt(generalResponse.rows?.[0]?.metricValues?.[0]?.value || '0');
  const totalSessions = parseInt(generalResponse.rows?.[0]?.metricValues?.[1]?.value || '0');
  const avgSessionDuration = parseFloat(generalResponse.rows?.[0]?.metricValues?.[2]?.value || '0');
  const bounceRate = parseFloat(generalResponse.rows?.[0]?.metricValues?.[3]?.value || '0');

  // Top páginas
  const [pagesResponse] = await analyticsDataClient.runReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [
      { name: 'screenPageViews' },
      { name: 'activeUsers' }
    ],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 10
  });

  const topPages = pagesResponse.rows?.map(row => ({
    page: row.dimensionValues?.[0]?.value || '',
    views: parseInt(row.metricValues?.[0]?.value || '0'),
    users: parseInt(row.metricValues?.[1]?.value || '0')
  })) || [];

  // Breakdown por dispositivo
  const [deviceResponse] = await analyticsDataClient.runReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
    dimensions: [{ name: 'deviceCategory' }],
    metrics: [{ name: 'activeUsers' }]
  });

  const deviceBreakdown = deviceResponse.rows?.map(row => ({
    device: row.dimensionValues?.[0]?.value || '',
    users: parseInt(row.metricValues?.[0]?.value || '0'),
    conversionRate: 0 // Será calculado depois
  })) || [];

  // Fontes de tráfego
  const [trafficResponse] = await analyticsDataClient.runReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
    dimensions: [{ name: 'sessionDefaultChannelGroup' }],
    metrics: [{ name: 'activeUsers' }],
    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }]
  });

  const trafficSources = trafficResponse.rows?.map(row => ({
    source: row.dimensionValues?.[0]?.value || '',
    users: parseInt(row.metricValues?.[0]?.value || '0'),
    conversionRate: 0 // Será calculado depois
  })) || [];

  // Calcular conversão geral
  const overallConversionRate = totalUsers > 0 ? 
    (await getConversionCount(days) / totalUsers) * 100 : 0;

  return {
    totalUsers,
    totalSessions,
    overallConversionRate,
    avgSessionDuration,
    bounceRate,
    topPages,
    deviceBreakdown,
    trafficSources
  };
}

async function getConversionCount(days: number): Promise<number> {
  try {
    const analyticsDataClient = await setupAnalyticsClient();
    
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${GA4_PROPERTY_ID}`,
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: {
            matchType: 'EXACT',
            value: 'carta_finalizada'
          }
        }
      }
    });

    return parseInt(response.rows?.[0]?.metricValues?.[0]?.value || '0');
  } catch {
    return 0;
  }
}

function generateFunnelReport(funnelData: FunnelAnalysis[], metrics: DetailedMetrics) {
  console.log('\n' + '='.repeat(80));
  console.log('🎄 RELATÓRIO DETALHADO DE FUNIL - CARTAS PAPAI NOEL');
  console.log('='.repeat(80));
  
  console.log('\n📊 RESUMO GERAL:');
  console.log(`👥 Total de Usuários: ${metrics.totalUsers.toLocaleString()}`);
  console.log(`📱 Total de Sessões: ${metrics.totalSessions.toLocaleString()}`);
  console.log(`🎯 Taxa de Conversão Geral: ${metrics.overallConversionRate.toFixed(2)}%`);
  console.log(`⏱️  Duração Média da Sessão: ${(metrics.avgSessionDuration / 60).toFixed(1)} minutos`);
  console.log(`📉 Taxa de Rejeição: ${metrics.bounceRate.toFixed(1)}%`);

  console.log('\n🔄 ANÁLISE DO FUNIL:');
  console.log('-'.repeat(80));
  
  funnelData.forEach((step, index) => {
    const dropOff = index > 0 ? funnelData[index-1].users - step.users : 0;
    
    console.log(`${index + 1}. ${step.step}`);
    console.log(`   👥 Usuários: ${step.users.toLocaleString()}`);
    console.log(`   📱 Sessões: ${step.sessions.toLocaleString()}`);
    console.log(`   🎯 Taxa de Conversão: ${step.conversionRate.toFixed(1)}%`);
    
    if (index > 0) {
      console.log(`   📉 Drop-off: ${dropOff.toLocaleString()} usuários (${step.dropOffRate.toFixed(1)}%)`);
    }
    
    console.log('');
  });

  console.log('📈 TOP PÁGINAS:');
  console.log('-'.repeat(40));
  metrics.topPages.slice(0, 5).forEach((page, index) => {
    console.log(`${index + 1}. ${page.page}`);
    console.log(`   👀 ${page.views.toLocaleString()} visualizações | 👥 ${page.users.toLocaleString()} usuários`);
  });

  console.log('\n📱 BREAKDOWN POR DISPOSITIVO:');
  console.log('-'.repeat(40));
  metrics.deviceBreakdown.forEach(device => {
    const percentage = metrics.totalUsers > 0 ? (device.users / metrics.totalUsers) * 100 : 0;
    console.log(`${device.device}: ${device.users.toLocaleString()} usuários (${percentage.toFixed(1)}%)`);
  });

  console.log('\n🌐 FONTES DE TRÁFEGO:');
  console.log('-'.repeat(40));
  metrics.trafficSources.slice(0, 5).forEach(source => {
    const percentage = metrics.totalUsers > 0 ? (source.users / metrics.totalUsers) * 100 : 0;
    console.log(`${source.source}: ${source.users.toLocaleString()} usuários (${percentage.toFixed(1)}%)`);
  });

  console.log('\n💡 INSIGHTS E RECOMENDAÇÕES:');
  console.log('-'.repeat(50));
  
  // Análise automática de insights
  const biggestDropOff = funnelData.reduce((max, step, index) => {
    if (index === 0) return max;
    return step.dropOffRate > max.dropOffRate ? step : max;
  }, funnelData[1]);

  console.log(`🔍 Maior drop-off: ${biggestDropOff.step} (${biggestDropOff.dropOffRate.toFixed(1)}%)`);
  
  if (metrics.bounceRate > 70) {
    console.log('⚠️  Taxa de rejeição alta - otimizar landing page');
  }
  
  if (metrics.avgSessionDuration < 120) {
    console.log('⚠️  Sessões muito curtas - melhorar engajamento');
  }

  const mobileUsers = metrics.deviceBreakdown.find(d => d.device.toLowerCase().includes('mobile'));
  if (mobileUsers && mobileUsers.users > metrics.totalUsers * 0.6) {
    console.log('📱 Foco em mobile - maioria dos usuários usa dispositivos móveis');
  }

  console.log('\n' + '='.repeat(80));
}

async function main() {
  console.log('🎄 Iniciando análise detalhada de funil...\n');
  
  if (!GA4_PROPERTY_ID) {
    console.error('❌ GA4_PROPERTY_ID não encontrado no .env.local');
    process.exit(1);
  }

  const days = process.argv[2] ? parseInt(process.argv[2]) : 30;
  console.log(`📅 Analisando dados dos últimos ${days} dias\n`);

  try {
    // Buscar dados do funil
    const funnelData = await getFunnelData(days);
    
    // Buscar métricas detalhadas
    const detailedMetrics = await getDetailedMetrics(days);
    
    // Gerar relatório
    generateFunnelReport(funnelData, detailedMetrics);
    
  } catch (error: any) {
    console.error('❌ Erro na análise:', error.message);
    
    if (error.message.includes('credentials')) {
      console.log('\n💡 Dica: Configure as credenciais GA4:');
      console.log('1. Crie um service account no Google Cloud Console');
      console.log('2. Baixe o arquivo JSON das credenciais');
      console.log('3. Configure GOOGLE_APPLICATION_CREDENTIALS no .env.local');
    }
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { getFunnelData, getDetailedMetrics, generateFunnelReport };