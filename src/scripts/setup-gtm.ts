#!/usr/bin/env node

// Script para configurar automaticamente o GTM via API
// Uso: npm run setup-gtm ou node src/scripts/setup-gtm.ts

import { GTMApiClient, setupGTMAutomatically, GTMApiConfig } from '../lib/gtm-api-client';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Carregar variáveis de ambiente
config({ path: '.env.local' });
config(); // Carregar .env como fallback

interface SetupOptions {
  accountId?: string;
  containerId?: string;
  serviceAccountPath?: string;
  accessToken?: string;
  dryRun?: boolean;
  verbose?: boolean;
}

async function main() {
  console.log('🚀 Iniciando configuração automática do GTM...\n');

  // Configuração a partir das variáveis de ambiente
  const options: SetupOptions = {
    accountId: process.env.GTM_ACCOUNT_ID,
    containerId: process.env.GTM_CONTAINER_ID,
    serviceAccountPath: process.env.GTM_SERVICE_ACCOUNT_PATH,
    accessToken: process.env.GTM_ACCESS_TOKEN,
    dryRun: process.argv.includes('--dry-run'),
    verbose: process.argv.includes('--verbose')
  };

  // Validar configuração
  if (!options.accountId || !options.containerId) {
    console.error('❌ Erro: GTM_ACCOUNT_ID e GTM_CONTAINER_ID são obrigatórios');
    console.log('\nDefina as variáveis de ambiente:');
    console.log('GTM_ACCOUNT_ID=sua_account_id');
    console.log('GTM_CONTAINER_ID=sua_container_id');
    console.log('GTM_SERVICE_ACCOUNT_PATH=caminho/para/service-account.json');
    console.log('ou GTM_ACCESS_TOKEN=seu_access_token');
    process.exit(1);
  }

  if (!options.serviceAccountPath && !options.accessToken) {
    console.error('❌ Erro: É necessário GTM_SERVICE_ACCOUNT_PATH ou GTM_ACCESS_TOKEN');
    process.exit(1);
  }

  try {
    // Preparar configuração da API
    const apiConfig: GTMApiConfig = {
      accountId: options.accountId,
      containerId: options.containerId
    };

    if (options.serviceAccountPath) {
      // Verificar se o arquivo existe
      try {
        const serviceAccountKey = readFileSync(options.serviceAccountPath, 'utf8');
        apiConfig.serviceAccountKey = options.serviceAccountPath;
        console.log('✅ Service Account carregado com sucesso');
      } catch (error) {
        console.error(`❌ Erro ao carregar Service Account: ${error}`);
        process.exit(1);
      }
    } else if (options.accessToken) {
      apiConfig.accessToken = options.accessToken;
      console.log('✅ Access Token configurado');
    }

    if (options.dryRun) {
      console.log('🔍 Modo dry-run ativado - apenas simulação\n');
      await simulateSetup(apiConfig, options.verbose);
      return;
    }

    // Executar configuração
    console.log('📋 Configuração:');
    console.log(`   Account ID: ${options.accountId}`);
    console.log(`   Container ID: ${options.containerId}`);
    console.log(`   Autenticação: ${options.serviceAccountPath ? 'Service Account' : 'Access Token'}\n`);

    console.log('⚙️  Iniciando configuração automática...\n');

    const result = await setupGTMAutomatically(apiConfig);

    if (result.success) {
      console.log('🎉 Configuração concluída com sucesso!\n');
      console.log('📊 Resultados:');
      if (result.workspaceId) {
        console.log(`   Workspace ID: ${result.workspaceId}`);
      }
      if (result.versionId) {
        console.log(`   Versão publicada: ${result.versionId}`);
      }
      console.log('\n✅ Todas as tags, triggers e variáveis foram configuradas no GTM');
      console.log('🔗 Acesse o GTM para verificar: https://tagmanager.google.com/');
    } else {
      console.log('❌ Configuração falhou\n');
      console.log('🚨 Erros encontrados:');
      result.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
      
      if (result.workspaceId) {
        console.log(`\n💡 Workspace criado: ${result.workspaceId}`);
        console.log('   Você pode continuar a configuração manualmente no GTM');
      }
    }

  } catch (error: any) {
    console.error('💥 Erro inesperado:', error.message);
    if (options.verbose) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

async function simulateSetup(config: GTMApiConfig, verbose?: boolean) {
  console.log('🔍 Simulando configuração do GTM...\n');
  
  console.log('📋 Variáveis que seriam criadas:');
  const { GTM_VARIABLES } = await import('../lib/gtm-config');
  GTM_VARIABLES.forEach((variable, index) => {
    console.log(`   ${index + 1}. ${variable.variableName} (${variable.variableType})`);
  });

  console.log('\n🎯 Triggers que seriam criados:');
  const { GTM_TRIGGERS } = await import('../lib/gtm-config');
  GTM_TRIGGERS.forEach((trigger, index) => {
    console.log(`   ${index + 1}. ${trigger.triggerName} (${trigger.triggerType})`);
  });

  console.log('\n🏷️  Tags que seriam criadas:');
  const { FACEBOOK_TAGS, TIKTOK_TAGS, GA4_TAGS } = await import('../lib/gtm-config');
  const allTags = [...FACEBOOK_TAGS, ...TIKTOK_TAGS, ...GA4_TAGS];
  allTags.forEach((tag, index) => {
    console.log(`   ${index + 1}. ${tag.tagName} (${tag.tagType})`);
    if (verbose) {
      console.log(`      Triggers: ${tag.triggers.join(', ')}`);
    }
  });

  console.log('\n✅ Simulação concluída');
  console.log('💡 Execute sem --dry-run para aplicar as mudanças');
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

export { main as setupGTM };