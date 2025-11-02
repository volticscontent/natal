#!/usr/bin/env node

// Script para gerar instruções de configuração manual do GTM
// Uso: npm run gtm-manual-setup

import { generateGTMConfig } from '../lib/gtm-config';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config({ path: '.env.local' });
config();

function generateManualInstructions() {
  console.log('📋 INSTRUÇÕES PARA CONFIGURAÇÃO MANUAL DO GTM\n');
  console.log('🔗 Acesse: https://tagmanager.google.com/\n');

  const gtmConfig = generateGTMConfig();

  // Variáveis
  console.log('📊 VARIÁVEIS PARA CRIAR:\n');
  gtmConfig.variables.forEach((variable, index) => {
    console.log(`${index + 1}. ${variable.variableName}`);
    console.log(`   Tipo: ${variable.variableType}`);
    if (variable.variableType === 'c') {
      console.log(`   Valor: ${variable.value}`);
    } else if (variable.variableType === 'v') {
      console.log(`   Nome da Variável do Data Layer: ${variable.dataLayerVariable}`);
    }
    console.log('');
  });

  // Triggers
  console.log('🎯 TRIGGERS PARA CRIAR:\n');
  gtmConfig.triggers.forEach((trigger, index) => {
    console.log(`${index + 1}. ${trigger.triggerName}`);
    console.log(`   Tipo: ${trigger.triggerType === 'customEvent' ? 'Evento Personalizado' : trigger.triggerType}`);
    if (trigger.conditions?.eventName) {
      console.log(`   Nome do Evento: ${trigger.conditions.eventName}`);
    }
    console.log('');
  });

  // Tags
  console.log('🏷️  TAGS PARA CRIAR:\n');
  gtmConfig.tags.forEach((tag, index) => {
    console.log(`${index + 1}. ${tag.tagName}`);
    console.log(`   Tipo: ${tag.tagType}`);
    
    if (tag.tagType === 'facebookPixel') {
      console.log(`   Pixel ID: {{Facebook Pixel ID}}`);
      if (tag.parameters.eventName) {
        console.log(`   Evento: ${tag.parameters.eventName}`);
      }
    } else if (tag.tagType === 'tiktokPixel') {
      console.log(`   Pixel ID: {{TikTok Pixel ID}}`);
      if (tag.parameters.eventName) {
        console.log(`   Evento: ${tag.parameters.eventName}`);
      }
    } else if (tag.tagType === 'googleAnalytics4' || tag.tagType === 'ga4Event') {
      console.log(`   Measurement ID: {{GA4 Measurement ID}}`);
      if (tag.parameters.eventName) {
        console.log(`   Nome do Evento: ${tag.parameters.eventName}`);
      }
    }
    
    console.log(`   Triggers: ${tag.triggers.join(', ')}`);
    console.log('');
    console.log('');
  });

  console.log('💡 DICAS IMPORTANTES:\n');
  console.log('1. Crie as variáveis primeiro');
  console.log('2. Depois crie os triggers');
  console.log('3. Por último, crie as tags');
  console.log('4. Teste no modo Preview antes de publicar');
  console.log('5. Use o workspace padrão ou crie um novo para organizar');
  
  console.log('\n🔧 VALORES DAS VARIÁVEIS CONSTANTES:\n');
  console.log(`Facebook Pixel ID: ${process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || 'CONFIGURAR'}`);
  console.log(`TikTok Pixel ID: ${process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || 'CONFIGURAR'}`);
  console.log(`GA4 Measurement ID: ${process.env.NEXT_PUBLIC_GA4_ID || 'CONFIGURAR'}`);
}

// Executar se chamado diretamente
if (require.main === module) {
  generateManualInstructions();
}

export { generateManualInstructions };