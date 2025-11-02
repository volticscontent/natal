import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import { config } from 'dotenv';
import path from 'path';

// Carregar variáveis do .env.local
config({ path: path.resolve(process.cwd(), '.env.local') });

const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID;
const CREDENTIALS_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS;

interface CustomEvent {
  name: string;
  displayName: string;
  description: string;
  parameters?: string[];
}

interface ConversionEvent {
  eventName: string;
  displayName: string;
  countingMethod: 'ONCE_PER_EVENT' | 'ONCE_PER_SESSION';
}

// Eventos customizados para o funil de Natal
const CUSTOM_EVENTS: CustomEvent[] = [
  {
    name: 'carta_iniciada',
    displayName: 'Carta Iniciada',
    description: 'Usuário começou a escrever uma carta para o Papai Noel',
    parameters: ['page_location', 'user_language']
  },
  {
    name: 'carta_personalizada',
    displayName: 'Carta Personalizada',
    description: 'Usuário personalizou a carta (nome, idade, etc.)',
    parameters: ['personalization_step', 'user_age', 'user_name']
  },
  {
    name: 'carta_escrita',
    displayName: 'Carta Escrita',
    description: 'Usuário terminou de escrever o conteúdo da carta',
    parameters: ['carta_length', 'time_spent_writing']
  },
  {
    name: 'checkout_iniciado',
    displayName: 'Checkout Iniciado',
    description: 'Usuário iniciou o processo de checkout',
    parameters: ['product_type', 'price']
  },
  {
    name: 'pagamento_processado',
    displayName: 'Pagamento Processado',
    description: 'Pagamento foi processado com sucesso',
    parameters: ['payment_method', 'amount', 'currency']
  },
  {
    name: 'carta_finalizada',
    displayName: 'Carta Finalizada',
    description: 'Processo completo - carta criada e paga',
    parameters: ['total_time', 'final_price', 'delivery_method']
  }
];

// Conversões para tracking
const CONVERSION_EVENTS: ConversionEvent[] = [
  {
    eventName: 'checkout_iniciado',
    displayName: 'Início do Checkout',
    countingMethod: 'ONCE_PER_SESSION'
  },
  {
    eventName: 'pagamento_processado',
    displayName: 'Pagamento Concluído',
    countingMethod: 'ONCE_PER_EVENT'
  },
  {
    eventName: 'carta_finalizada',
    displayName: 'Carta Finalizada (Conversão Principal)',
    countingMethod: 'ONCE_PER_EVENT'
  }
];

async function setupGA4Auth() {
  if (!CREDENTIALS_PATH) {
    console.log('⚠️  GOOGLE_APPLICATION_CREDENTIALS não configurado');
    console.log('📝 Usando autenticação padrão do Google Cloud...');
    
    const auth = new GoogleAuth({
      scopes: [
        'https://www.googleapis.com/auth/analytics.edit',
        'https://www.googleapis.com/auth/analytics.manage.users'
      ]
    });
    
    return auth;
  }

  const auth = new GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: [
      'https://www.googleapis.com/auth/analytics.edit',
      'https://www.googleapis.com/auth/analytics.manage.users'
    ]
  });

  return auth;
}

async function createCustomDimensions() {
  console.log('🔧 Configurando dimensões customizadas...');
  
  try {
    const auth = await setupGA4Auth();
    const analyticsAdmin = google.analyticsadmin({ version: 'v1beta', auth });

    const customDimensions = [
      {
        parameterName: 'user_language',
        displayName: 'Idioma do Usuário',
        description: 'Idioma selecionado pelo usuário'
      },
      {
        parameterName: 'personalization_step',
        displayName: 'Etapa de Personalização',
        description: 'Qual etapa da personalização o usuário está'
      },
      {
        parameterName: 'carta_length',
        displayName: 'Tamanho da Carta',
        description: 'Número de caracteres na carta'
      },
      {
        parameterName: 'payment_method',
        displayName: 'Método de Pagamento',
        description: 'Método usado para pagamento'
      }
    ];

    for (const dimension of customDimensions) {
      try {
        const result = await analyticsAdmin.properties.customDimensions.create({
          parent: `properties/${GA4_PROPERTY_ID}`,
          requestBody: {
            parameterName: dimension.parameterName,
            displayName: dimension.displayName,
            description: dimension.description,
            scope: 'EVENT'
          }
        });
        
        console.log(`✅ Dimensão criada: ${dimension.displayName}`);
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          console.log(`ℹ️  Dimensão já existe: ${dimension.displayName}`);
        } else {
          console.error(`❌ Erro ao criar dimensão ${dimension.displayName}:`, error.message);
        }
      }
    }
  } catch (error: any) {
    console.error('❌ Erro ao configurar dimensões customizadas:', error.message);
  }
}

async function createConversionEvents() {
  console.log('🎯 Configurando eventos de conversão...');
  
  try {
    const auth = await setupGA4Auth();
    const analyticsAdmin = google.analyticsadmin({ version: 'v1beta', auth });

    for (const conversion of CONVERSION_EVENTS) {
      try {
        const result = await analyticsAdmin.properties.conversionEvents.create({
          parent: `properties/${GA4_PROPERTY_ID}`,
          requestBody: {
            eventName: conversion.eventName,
            custom: false,
            deletable: true,
            countingMethod: conversion.countingMethod
          }
        });
        
        console.log(`✅ Conversão criada: ${conversion.displayName} (${conversion.eventName})`);
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          console.log(`ℹ️  Conversão já existe: ${conversion.displayName}`);
        } else {
          console.error(`❌ Erro ao criar conversão ${conversion.displayName}:`, error.message);
        }
      }
    }
  } catch (error: any) {
    console.error('❌ Erro ao configurar conversões:', error.message);
  }
}

async function listCurrentSetup() {
  console.log('📊 Verificando configuração atual...');
  
  try {
    const auth = await setupGA4Auth();
    const analyticsAdmin = google.analyticsadmin({ version: 'v1beta', auth });

    // Listar dimensões customizadas
    console.log('\n📏 Dimensões Customizadas:');
    const dimensions = await analyticsAdmin.properties.customDimensions.list({
      parent: `properties/${GA4_PROPERTY_ID}`
    });
    
    if (dimensions.data.customDimensions) {
      dimensions.data.customDimensions.forEach((dim: any) => {
        console.log(`  • ${dim.displayName} (${dim.parameterName})`);
      });
    } else {
      console.log('  Nenhuma dimensão customizada encontrada');
    }

    // Listar conversões
    console.log('\n🎯 Eventos de Conversão:');
    const conversions = await analyticsAdmin.properties.conversionEvents.list({
      parent: `properties/${GA4_PROPERTY_ID}`
    });
    
    if (conversions.data.conversionEvents) {
      conversions.data.conversionEvents.forEach((conv: any) => {
        console.log(`  • ${conv.eventName} (${conv.countingMethod})`);
      });
    } else {
      console.log('  Nenhuma conversão encontrada');
    }

  } catch (error: any) {
    console.error('❌ Erro ao listar configuração:', error.message);
  }
}

async function main() {
  console.log('🎄 Configurando GA4 para análise de funil de Natal\n');
  
  if (!GA4_PROPERTY_ID) {
    console.error('❌ GA4_PROPERTY_ID não encontrado no .env.local');
    process.exit(1);
  }

  console.log(`🔍 Property ID: ${GA4_PROPERTY_ID}\n`);

  // Verificar configuração atual
  await listCurrentSetup();
  
  console.log('\n🚀 Iniciando configuração...\n');
  
  // Criar dimensões customizadas
  await createCustomDimensions();
  
  console.log('');
  
  // Criar eventos de conversão
  await createConversionEvents();
  
  console.log('\n✅ Configuração concluída!');
  console.log('\n📋 Próximos passos:');
  console.log('1. Implementar os eventos no frontend');
  console.log('2. Testar os eventos em desenvolvimento');
  console.log('3. Executar análise de funil com dados reais');
  console.log('\n💡 Execute: npm run analyze-funnel para análise detalhada');
}

if (require.main === module) {
  main().catch(console.error);
}

export { CUSTOM_EVENTS, CONVERSION_EVENTS };