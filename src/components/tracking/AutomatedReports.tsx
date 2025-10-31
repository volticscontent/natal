'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWebVitals } from './CoreWebVitals';
import { useAdvancedTracking } from '@/hooks/useAdvancedTracking';

// Tipos para relatórios
interface ReportData {
  id: string;
  type: 'daily' | 'weekly' | 'monthly';
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    performance: PerformanceMetrics;
    engagement: EngagementMetrics;
    conversion: ConversionMetrics;
    traffic: TrafficMetrics;
  };
  insights: Insight[];
  recommendations: Recommendation[];
  generatedAt: Date;
}

interface PerformanceMetrics {
  averageScore: number;
  coreWebVitals: {
    LCP: { average: number; p75: number; p90: number };
    FID: { average: number; p75: number; p90: number };
    CLS: { average: number; p75: number; p90: number };
    FCP: { average: number; p75: number; p90: number };
    TTFB: { average: number; p75: number; p90: number };
  };
  pageLoadTime: number;
  bounceRate: number;
  errorRate: number;
}

interface EngagementMetrics {
  averageSessionDuration: number;
  averageScrollDepth: number;
  averageClicksPerSession: number;
  pageViews: number;
  uniqueVisitors: number;
  returnVisitors: number;
}

interface ConversionMetrics {
  conversionRate: number;
  averageOrderValue: number;
  revenue: number;
  transactions: number;
  abandonmentRate: number;
  funnelDropoff: { [step: string]: number };
}

interface TrafficMetrics {
  totalVisitors: number;
  organicTraffic: number;
  directTraffic: number;
  referralTraffic: number;
  socialTraffic: number;
  topPages: { page: string; views: number }[];
  topSources: { source: string; visitors: number }[];
}

interface Insight {
  type: 'positive' | 'negative' | 'neutral';
  category: 'performance' | 'engagement' | 'conversion' | 'traffic';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  metric?: string;
  change?: number;
}

interface Recommendation {
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'performance' | 'engagement' | 'conversion' | 'traffic';
  title: string;
  description: string;
  expectedImpact: string;
  effort: 'low' | 'medium' | 'high';
  timeline: string;
}

interface AutomatedReportsProps {
  enableDailyReports?: boolean;
  enableWeeklyReports?: boolean;
  enableMonthlyReports?: boolean;
  emailRecipients?: string[];
  webhookUrl?: string;
  storageKey?: string;
}

export function AutomatedReports({
  enableDailyReports = true,
  enableWeeklyReports = true,
  enableMonthlyReports = true,
  webhookUrl,
  storageKey = 'automated-reports'
}: AutomatedReportsProps) {
  const webVitals = useWebVitals();
  const { getSessionData } = useAdvancedTracking();
  
  const [reports, setReports] = useState<ReportData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<{ [key: string]: Date }>({});

  // Carregar relatórios salvos
  useEffect(() => {
    const savedReports = localStorage.getItem(storageKey);
    if (savedReports) {
      try {
        const parsed = JSON.parse(savedReports) as Array<Omit<ReportData, 'period' | 'generatedAt'> & {
          period: { start: string; end: string };
          generatedAt: string;
        }>;
        setReports(parsed.map((r) => ({
          ...r,
          period: {
            start: new Date(r.period.start),
            end: new Date(r.period.end)
          },
          generatedAt: new Date(r.generatedAt)
        })));
      } catch (error) {
        console.error('Erro ao carregar relatórios:', error);
      }
    }

    const savedLastGenerated = localStorage.getItem(`${storageKey}-last-generated`);
    if (savedLastGenerated) {
      try {
        const parsed = JSON.parse(savedLastGenerated);
        setLastGenerated(Object.keys(parsed).reduce((acc, key) => ({
          ...acc,
          [key]: new Date(parsed[key])
        }), {}));
      } catch (error) {
        console.error('Erro ao carregar datas de geração:', error);
      }
    }
  }, [storageKey]);

  // Salvar relatórios
  const saveReports = useCallback((newReports: ReportData[]) => {
    localStorage.setItem(storageKey, JSON.stringify(newReports));
  }, [storageKey]);

  // Salvar última geração
  const saveLastGenerated = useCallback((dates: { [key: string]: Date }) => {
    localStorage.setItem(`${storageKey}-last-generated`, JSON.stringify(dates));
  }, [storageKey]);

  // Gerar insights automáticos
  const generateInsights = useCallback((metrics: ReportData['metrics']): Insight[] => {
    const insights: Insight[] = [];
    
    // Performance insights
    if (metrics.performance.averageScore < 50) {
      insights.push({
        type: 'negative',
        category: 'performance',
        title: 'Performance Crítica',
        description: `Score médio de performance está em ${metrics.performance.averageScore}/100, muito abaixo do ideal.`,
        impact: 'high',
        metric: 'performance_score',
        change: metrics.performance.averageScore
      });
    } else if (metrics.performance.averageScore > 80) {
      insights.push({
        type: 'positive',
        category: 'performance',
        title: 'Excelente Performance',
        description: `Score médio de performance está em ${metrics.performance.averageScore}/100, acima da média.`,
        impact: 'medium',
        metric: 'performance_score',
        change: metrics.performance.averageScore
      });
    }

    // Engagement insights
    if (metrics.engagement.averageSessionDuration < 60) {
      insights.push({
        type: 'negative',
        category: 'engagement',
        title: 'Baixo Engajamento',
        description: `Duração média de sessão é de apenas ${Math.round(metrics.engagement.averageSessionDuration)}s.`,
        impact: 'medium',
        metric: 'session_duration',
        change: metrics.engagement.averageSessionDuration
      });
    }

    // Conversion insights
    if (metrics.conversion.conversionRate > 0) {
      if (metrics.conversion.conversionRate < 2) {
        insights.push({
          type: 'negative',
          category: 'conversion',
          title: 'Taxa de Conversão Baixa',
          description: `Taxa de conversão está em ${metrics.conversion.conversionRate.toFixed(2)}%, abaixo da média do setor.`,
          impact: 'high',
          metric: 'conversion_rate',
          change: metrics.conversion.conversionRate
        });
      } else if (metrics.conversion.conversionRate > 5) {
        insights.push({
          type: 'positive',
          category: 'conversion',
          title: 'Excelente Conversão',
          description: `Taxa de conversão está em ${metrics.conversion.conversionRate.toFixed(2)}%, acima da média.`,
          impact: 'high',
          metric: 'conversion_rate',
          change: metrics.conversion.conversionRate
        });
      }
    }

    return insights;
  }, []);

  // Gerar recomendações automáticas
  const generateRecommendations = useCallback((metrics: ReportData['metrics']): Recommendation[] => {
    const recommendations: Recommendation[] = [];
    
    // Performance recommendations
    if (metrics.performance.averageScore < 70) {
      if (metrics.performance.coreWebVitals.LCP.average > 2500) {
        recommendations.push({
          priority: 'high',
          category: 'performance',
          title: 'Otimizar Largest Contentful Paint (LCP)',
          description: 'Implementar lazy loading de imagens, otimizar servidor e usar CDN para melhorar o LCP.',
          expectedImpact: 'Melhoria de 15-25% no score de performance',
          effort: 'medium',
          timeline: '1-2 semanas'
        });
      }

      if (metrics.performance.coreWebVitals.CLS.average > 0.1) {
        recommendations.push({
          priority: 'medium',
          category: 'performance',
          title: 'Reduzir Cumulative Layout Shift (CLS)',
          description: 'Definir dimensões para imagens e vídeos, evitar inserção dinâmica de conteúdo.',
          expectedImpact: 'Redução de 30-50% no CLS',
          effort: 'low',
          timeline: '3-5 dias'
        });
      }
    }

    // Engagement recommendations
    if (metrics.engagement.averageSessionDuration < 120) {
      recommendations.push({
        priority: 'medium',
        category: 'engagement',
        title: 'Melhorar Engajamento do Usuário',
        description: 'Adicionar conteúdo interativo, melhorar navegação e implementar recomendações personalizadas.',
        expectedImpact: 'Aumento de 20-40% na duração da sessão',
        effort: 'high',
        timeline: '2-4 semanas'
      });
    }

    // Conversion recommendations
    if (metrics.conversion.abandonmentRate > 70) {
      recommendations.push({
        priority: 'critical',
        category: 'conversion',
        title: 'Reduzir Taxa de Abandono',
        description: 'Simplificar processo de checkout, adicionar múltiplas opções de pagamento e melhorar UX.',
        expectedImpact: 'Redução de 15-30% na taxa de abandono',
        effort: 'high',
        timeline: '2-3 semanas'
      });
    }

    return recommendations;
  }, []);

  // Coletar métricas atuais
  const collectCurrentMetrics = useCallback((): ReportData['metrics'] => {
    const sessionData = getSessionData();
    
    return {
      performance: {
        averageScore: webVitals.score || 0,
        coreWebVitals: {
          LCP: { 
            average: webVitals.LCP || 0, 
            p75: (webVitals.LCP || 0) * 1.2, 
            p90: (webVitals.LCP || 0) * 1.5 
          },
          FID: { 
            average: webVitals.FID || 0, 
            p75: (webVitals.FID || 0) * 1.2, 
            p90: (webVitals.FID || 0) * 1.5 
          },
          CLS: { 
            average: webVitals.CLS || 0, 
            p75: (webVitals.CLS || 0) * 1.2, 
            p90: (webVitals.CLS || 0) * 1.5 
          },
          FCP: { 
            average: webVitals.FCP || 0, 
            p75: (webVitals.FCP || 0) * 1.2, 
            p90: (webVitals.FCP || 0) * 1.5 
          },
          TTFB: { 
            average: webVitals.TTFB || 0, 
            p75: (webVitals.TTFB || 0) * 1.2, 
            p90: (webVitals.TTFB || 0) * 1.5 
          }
        },
        pageLoadTime: sessionData.page_load_time || 0,
        bounceRate: 0, // Would need historical data
        errorRate: 0 // Would need error tracking
      },
      engagement: {
        averageSessionDuration: sessionData.session_duration / 1000,
        averageScrollDepth: Math.max(...Array.from(sessionData.scroll_depths), 0),
        averageClicksPerSession: Object.values(sessionData.click_map).reduce((sum: number, count: unknown) => sum + (count as number), 0),
        pageViews: 1, // Current session
        uniqueVisitors: 1,
        returnVisitors: 0
      },
      conversion: {
        conversionRate: 0, // Would need conversion tracking
        averageOrderValue: 0,
        revenue: 0,
        transactions: 0,
        abandonmentRate: 0,
        funnelDropoff: {}
      },
      traffic: {
        totalVisitors: 1,
        organicTraffic: 0,
        directTraffic: 1,
        referralTraffic: 0,
        socialTraffic: 0,
        topPages: [{ page: sessionData.page_url, views: 1 }],
        topSources: [{ source: 'direct', visitors: 1 }]
      }
    };
  }, [webVitals, getSessionData]);

  // Gerar relatório
  const generateReport = useCallback(async (type: ReportData['type']): Promise<ReportData> => {
    const now = new Date();
    const period = {
      start: new Date(now.getTime() - (type === 'daily' ? 24 * 60 * 60 * 1000 : 
                                      type === 'weekly' ? 7 * 24 * 60 * 60 * 1000 : 
                                      30 * 24 * 60 * 60 * 1000)),
      end: now
    };

    const metrics = collectCurrentMetrics();
    const insights = generateInsights(metrics);
    const recommendations = generateRecommendations(metrics);

    const report: ReportData = {
      id: `${type}-${now.getTime()}`,
      type,
      period,
      metrics,
      insights,
      recommendations,
      generatedAt: now
    };

    return report;
  }, [collectCurrentMetrics, generateInsights, generateRecommendations]);

  // Verificar se deve gerar relatório
  const shouldGenerateReport = useCallback((type: ReportData['type']): boolean => {
    const lastGen = lastGenerated[type];
    if (!lastGen) return true;

    const now = new Date();
    const timeDiff = now.getTime() - lastGen.getTime();
    
    switch (type) {
      case 'daily':
        return timeDiff >= 24 * 60 * 60 * 1000; // 24 hours
      case 'weekly':
        return timeDiff >= 7 * 24 * 60 * 60 * 1000; // 7 days
      case 'monthly':
        return timeDiff >= 30 * 24 * 60 * 60 * 1000; // 30 days
      default:
        return false;
    }
  }, [lastGenerated]);

  // Enviar relatório por webhook
  const sendWebhook = useCallback(async (report: ReportData) => {
    if (!webhookUrl) return;

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'automated_report',
          report: {
            id: report.id,
            type: report.type,
            period: report.period,
            summary: {
              performanceScore: report.metrics.performance.averageScore,
              conversionRate: report.metrics.conversion.conversionRate,
              sessionDuration: report.metrics.engagement.averageSessionDuration,
              insights: report.insights.length,
              recommendations: report.recommendations.length
            },
            generatedAt: report.generatedAt
          }
        })
      });
    } catch (error) {
      console.error('Erro ao enviar webhook:', error);
    }
  }, [webhookUrl]);

  // Processo automático de geração
  useEffect(() => {
    const checkAndGenerate = async () => {
      if (isGenerating) return;

      const toGenerate: ReportData['type'][] = [];
      
      if (enableDailyReports && shouldGenerateReport('daily')) {
        toGenerate.push('daily');
      }
      if (enableWeeklyReports && shouldGenerateReport('weekly')) {
        toGenerate.push('weekly');
      }
      if (enableMonthlyReports && shouldGenerateReport('monthly')) {
        toGenerate.push('monthly');
      }

      if (toGenerate.length === 0) return;

      setIsGenerating(true);

      try {
        const newReports: ReportData[] = [];
        const newLastGenerated = { ...lastGenerated };

        for (const type of toGenerate) {
          const report = await generateReport(type);
          newReports.push(report);
          newLastGenerated[type] = new Date();
          
          // Enviar webhook se configurado
          if (webhookUrl) {
            await sendWebhook(report);
          }
        }

        setReports(prev => {
          const updated = [...newReports, ...prev].slice(0, 50); // Keep last 50 reports
          saveReports(updated);
          return updated;
        });

        setLastGenerated(newLastGenerated);
        saveLastGenerated(newLastGenerated);

      } catch (error) {
        console.error('Erro ao gerar relatórios:', error);
      } finally {
        setIsGenerating(false);
      }
    };

    // Verificar a cada hora
    const interval = setInterval(checkAndGenerate, 60 * 60 * 1000);
    
    // Verificação inicial após 5 segundos
    const timeout = setTimeout(checkAndGenerate, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [
    enableDailyReports,
    enableWeeklyReports, 
    enableMonthlyReports,
    shouldGenerateReport,
    generateReport,
    isGenerating,
    lastGenerated,
    saveReports,
    saveLastGenerated,
    webhookUrl,
    sendWebhook
  ]);

  // Gerar relatório manual
  const generateManualReport = async (type: ReportData['type']) => {
    if (isGenerating) return;

    setIsGenerating(true);
    try {
      const report = await generateReport(type);
      
      setReports(prev => {
        const updated = [report, ...prev].slice(0, 50);
        saveReports(updated);
        return updated;
      });

      if (webhookUrl) {
        await sendWebhook(report);
      }
    } catch (error) {
      console.error('Erro ao gerar relatório manual:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Exportar relatório
  const exportReport = (report: ReportData) => {
    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `report-${report.type}-${report.generatedAt.toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Relatórios Automatizados</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => generateManualReport('daily')}
            disabled={isGenerating}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isGenerating ? 'Gerando...' : 'Gerar Relatório'}
          </button>
        </div>
      </div>

      {/* Status */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700">Último Diário</h3>
          <p className="text-sm text-gray-600">
            {lastGenerated.daily ? lastGenerated.daily.toLocaleDateString() : 'Nunca'}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700">Último Semanal</h3>
          <p className="text-sm text-gray-600">
            {lastGenerated.weekly ? lastGenerated.weekly.toLocaleDateString() : 'Nunca'}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700">Último Mensal</h3>
          <p className="text-sm text-gray-600">
            {lastGenerated.monthly ? lastGenerated.monthly.toLocaleDateString() : 'Nunca'}
          </p>
        </div>
      </div>

      {/* Lista de Relatórios */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Relatórios Recentes</h3>
        {reports.slice(0, 10).map((report) => (
          <div key={report.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-medium text-gray-800 capitalize">
                  Relatório {report.type}
                </h4>
                <p className="text-sm text-gray-600">
                  {report.generatedAt.toLocaleDateString()} às {report.generatedAt.toLocaleTimeString()}
                </p>
              </div>
              <button
                onClick={() => exportReport(report)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Exportar
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Performance:</span>
                <span className="ml-1 font-medium">{report.metrics.performance.averageScore}/100</span>
              </div>
              <div>
                <span className="text-gray-600">Sessão:</span>
                <span className="ml-1 font-medium">{Math.round(report.metrics.engagement.averageSessionDuration)}s</span>
              </div>
              <div>
                <span className="text-gray-600">Insights:</span>
                <span className="ml-1 font-medium">{report.insights.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Recomendações:</span>
                <span className="ml-1 font-medium">{report.recommendations.length}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AutomatedReports;