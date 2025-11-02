#!/usr/bin/env node

/**
 * Script para verificar configuração GA4 via API
 * Valida eventos, conversões e configurações do funil
 */

import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

interface GA4Property {
  name: string;
  propertyId: string;
  displayName: string;
  timeZone: string;
  currencyCode: string;
}

interface GA4Event {
  name: string;
  count: number;
  conversionRate?: number;
  isConversion: boolean;
}

interface GA4ConversionEvent {
  eventName: string;
  createdTime: string;
  isCustom: boolean;
  countingMethod: string;
}

interface GA4FunnelStep {
  name: string;
  filterExpression: string;
  isRequired: boolean;
}

interface GA4ConfigVerification {
  property: GA4Property;
  events: GA4Event[];
  conversionEvents: GA4ConversionEvent[];
  customDimensions: any[];
  audiences: any[];
  funnels: any[];
  enhancedConversions: boolean;
  dataRetention: string;
  status: 'success' | 'partial' | 'error';
  recommendations: string[];
}

class GA4ApiVerifier {
  private analytics: any;
  private propertyId: string;

  constructor() {
    // Para demonstração, usaremos dados mockados
    // Em produção, seria necessário configurar as credenciais da API
    this.propertyId = 'properties/YOUR_GA4_PROPERTY_ID';
  }

  async initializeAuth(): Promise<boolean> {
    try {
      // Simulação de autenticação
      console.log('🔐 Inicializando autenticação GA4 API...');
      
      // Em produção, seria algo como:
      // const auth = new google.auth.GoogleAuth({
      //   keyFile: 'path/to/service-account-key.json',
      //   scopes: ['https://www.googleapis.com/auth/analytics.readonly']
      // });
      // this.analytics = google.analyticsadmin({ version: 'v1beta', auth });
      
      console.log('⚠️  Modo demonstração: usando dados mockados');
      return true;
    } catch (error) {
      console.error('❌ Erro na autenticação:', error);
      return false;
    }
  }

  async verifyGA4Configuration(): Promise<GA4ConfigVerification> {
    console.log('🔍 Verificando configuração GA4...\n');

    // Dados mockados baseados na configuração atual do projeto
    const mockProperty: GA4Property = {
      name: 'properties/123456789',
      propertyId: '123456789',
      displayName: 'Natal Personalizado - Loja',
      timeZone: 'America/Sao_Paulo',
      currencyCode: 'BRL'
    };

    const mockEvents: GA4Event[] = [
      { name: 'page_view', count: 15420, isConversion: false },
      { name: 'cta_clicked', count: 2341, isConversion: false },
      { name: 'personalization_started', count: 1876, isConversion: false },
      { name: 'quantity_selected', count: 1654, isConversion: false },
      { name: 'form_interaction', count: 1432, isConversion: false },
      { name: 'begin_checkout', count: 987, isConversion: false },
      { name: 'purchase', count: 234, conversionRate: 23.7, isConversion: true },
      { name: 'video_play', count: 876, isConversion: false },
      { name: 'video_complete', count: 432, isConversion: false },
      { name: 'scroll_depth_75', count: 3421, isConversion: false }
    ];

    const mockConversionEvents: GA4ConversionEvent[] = [
      {
        eventName: 'purchase',
        createdTime: '2024-01-15T10:00:00Z',
        isCustom: false,
        countingMethod: 'ONCE_PER_SESSION'
      },
      {
        eventName: 'begin_checkout',
        createdTime: '2024-01-15T10:00:00Z',
        isCustom: true,
        countingMethod: 'ONCE_PER_SESSION'
      }
    ];

    const recommendations: string[] = [];

    // Verificações e recomendações
    const hasMainConversionEvents = mockEvents.some(e => e.name === 'purchase');
    if (!hasMainConversionEvents) {
      recommendations.push('❌ Configurar evento de conversão principal (purchase)');
    }

    const hasBeginCheckout = mockEvents.some(e => e.name === 'begin_checkout');
    if (!hasBeginCheckout) {
      recommendations.push('❌ Configurar evento begin_checkout para funil');
    }

    const hasPersonalizationEvents = mockEvents.some(e => e.name === 'personalization_started');
    if (hasPersonalizationEvents) {
      recommendations.push('✅ Eventos de personalização configurados corretamente');
    }

    const conversionRate = mockEvents.find(e => e.name === 'purchase')?.conversionRate || 0;
    if (conversionRate < 2) {
      recommendations.push('⚠️  Taxa de conversão baixa - implementar otimizações');
    }

    recommendations.push('🔧 Configurar Enhanced Conversions para melhor tracking');
    recommendations.push('📊 Criar audiências personalizadas para remarketing');
    recommendations.push('🎯 Configurar funis no GA4 interface');

    return {
      property: mockProperty,
      events: mockEvents,
      conversionEvents: mockConversionEvents,
      customDimensions: [],
      audiences: [],
      funnels: [],
      enhancedConversions: false,
      dataRetention: '14 months',
      status: 'partial',
      recommendations
    };
  }

  async generateDetailedReport(config: GA4ConfigVerification): Promise<void> {
    console.log('📊 RELATÓRIO DETALHADO DA CONFIGURAÇÃO GA4');
    console.log('='.repeat(50));
    console.log();

    // Informações da propriedade
    console.log('🏢 PROPRIEDADE GA4:');
    console.log(`   Nome: ${config.property.displayName}`);
    console.log(`   ID: ${config.property.propertyId}`);
    console.log(`   Fuso Horário: ${config.property.timeZone}`);
    console.log(`   Moeda: ${config.property.currencyCode}`);
    console.log();

    // Eventos configurados
    console.log('📈 EVENTOS CONFIGURADOS:');
    console.log('-'.repeat(30));
    config.events.forEach(event => {
      const status = event.isConversion ? '🎯' : '📊';
      const conversion = event.conversionRate ? ` (${event.conversionRate}% conversão)` : '';
      console.log(`   ${status} ${event.name}: ${event.count.toLocaleString()} eventos${conversion}`);
    });
    console.log();

    // Eventos de conversão
    console.log('🎯 EVENTOS DE CONVERSÃO:');
    console.log('-'.repeat(30));
    config.conversionEvents.forEach(conv => {
      const type = conv.isCustom ? 'Customizado' : 'Padrão';
      console.log(`   • ${conv.eventName} (${type}) - ${conv.countingMethod}`);
    });
    console.log();

    // Status geral
    console.log('📋 STATUS DA CONFIGURAÇÃO:');
    console.log('-'.repeat(30));
    const statusIcon = config.status === 'success' ? '✅' : config.status === 'partial' ? '⚠️' : '❌';
    console.log(`   ${statusIcon} Status: ${config.status.toUpperCase()}`);
    console.log(`   📊 Enhanced Conversions: ${config.enhancedConversions ? '✅ Ativo' : '❌ Inativo'}`);
    console.log(`   🗄️  Retenção de Dados: ${config.dataRetention}`);
    console.log();

    // Recomendações
    console.log('💡 RECOMENDAÇÕES:');
    console.log('-'.repeat(30));
    config.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
    console.log();

    // Análise do funil
    this.analyzeFunnelPerformance(config.events);
  }

  private analyzeFunnelPerformance(events: GA4Event[]): void {
    console.log('🔄 ANÁLISE DE PERFORMANCE DO FUNIL:');
    console.log('-'.repeat(40));

    const funnelSteps = [
      { name: 'Visualizações de Página', event: 'page_view' },
      { name: 'Cliques em CTA', event: 'cta_clicked' },
      { name: 'Início Personalização', event: 'personalization_started' },
      { name: 'Seleção Quantidade', event: 'quantity_selected' },
      { name: 'Início Checkout', event: 'begin_checkout' },
      { name: 'Compra Finalizada', event: 'purchase' }
    ];

    let previousCount = 0;
    funnelSteps.forEach((step, index) => {
      const event = events.find(e => e.name === step.event);
      const count = event?.count || 0;
      
      let dropoffRate = 0;
      if (index > 0 && previousCount > 0) {
        dropoffRate = ((previousCount - count) / previousCount) * 100;
      }

      const conversionFromStart = events[0] ? (count / events[0].count) * 100 : 0;
      
      console.log(`   ${index + 1}. ${step.name}:`);
      console.log(`      📊 Eventos: ${count.toLocaleString()}`);
      if (index > 0) {
        console.log(`      📉 Drop-off: ${dropoffRate.toFixed(1)}%`);
      }
      console.log(`      🎯 Conversão total: ${conversionFromStart.toFixed(1)}%`);
      console.log();

      previousCount = count;
    });

    // Identificar gargalos
    console.log('🚨 GARGALOS IDENTIFICADOS:');
    console.log('-'.repeat(30));
    
    const ctaToPersonalization = this.calculateDropoff(events, 'cta_clicked', 'personalization_started');
    const personalizationToQuantity = this.calculateDropoff(events, 'personalization_started', 'quantity_selected');
    const quantityToCheckout = this.calculateDropoff(events, 'quantity_selected', 'begin_checkout');
    const checkoutToPurchase = this.calculateDropoff(events, 'begin_checkout', 'purchase');

    if (ctaToPersonalization > 50) {
      console.log(`   ⚠️  Alto abandono CTA → Personalização: ${ctaToPersonalization.toFixed(1)}%`);
    }
    if (personalizationToQuantity > 30) {
      console.log(`   ⚠️  Alto abandono Personalização → Quantidade: ${personalizationToQuantity.toFixed(1)}%`);
    }
    if (quantityToCheckout > 40) {
      console.log(`   ⚠️  Alto abandono Quantidade → Checkout: ${quantityToCheckout.toFixed(1)}%`);
    }
    if (checkoutToPurchase > 70) {
      console.log(`   🚨 CRÍTICO: Alto abandono Checkout → Compra: ${checkoutToPurchase.toFixed(1)}%`);
    }
    console.log();
  }

  private calculateDropoff(events: GA4Event[], fromEvent: string, toEvent: string): number {
    const from = events.find(e => e.name === fromEvent)?.count || 0;
    const to = events.find(e => e.name === toEvent)?.count || 0;
    
    if (from === 0) return 0;
    return ((from - to) / from) * 100;
  }
}

// Execução principal
async function main() {
  console.log('🚀 Iniciando verificação GA4 API...\n');

  const verifier = new GA4ApiVerifier();
  
  const authSuccess = await verifier.initializeAuth();
  if (!authSuccess) {
    console.log('❌ Falha na autenticação. Verifique as credenciais.');
    process.exit(1);
  }

  const config = await verifier.verifyGA4Configuration();
  await verifier.generateDetailedReport(config);

  console.log('✅ Verificação GA4 concluída!');
  console.log('📞 Para configurar a API real, adicione as credenciais do Google Cloud.');
}

if (require.main === module) {
  main().catch(console.error);
}

export { GA4ApiVerifier, GA4ConfigVerification };