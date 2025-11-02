import dotenv from 'dotenv';
import { GTMApiClient } from '../lib/gtm-api-client';
import { google } from 'googleapis';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

async function testGTMPermissions() {
  console.log('🔍 Testando permissões do GTM...\n');

  const accountId = process.env.GTM_ACCOUNT_ID!;
  const containerId = process.env.GTM_CONTAINER_ID!;
  const accessToken = process.env.GTM_ACCESS_TOKEN!;

  // Configurar cliente GTM
  const config = {
    accountId,
    containerId,
    accessToken
  };

  const client = new GTMApiClient(config);

  // Configurar API diretamente
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const tagmanager = google.tagmanager({ version: 'v2', auth });

  try {
    // Teste 1: Listar contas
    console.log('📋 Teste 1: Listando contas...');
    try {
      const accounts = await tagmanager.accounts.list();
      console.log('✅ Sucesso - Contas encontradas:', accounts.data.account?.length || 0);
    } catch (error) {
      console.log('❌ Falha - Listar contas:', (error as Error).message);
    }

    // Teste 2: Listar containers
    console.log('\n📋 Teste 2: Listando containers...');
    try {
      const containers = await tagmanager.accounts.containers.list({
        parent: `accounts/${accountId}`
      });
      console.log('✅ Sucesso - Containers encontrados:', containers.data.container?.length || 0);
    } catch (error) {
      console.log('❌ Falha - Listar containers:', (error as Error).message);
    }

    // Teste 3: Listar workspaces
    console.log('\n📋 Teste 3: Listando workspaces...');
    try {
      const workspaces = await tagmanager.accounts.containers.workspaces.list({
        parent: `accounts/${accountId}/containers/${containerId}`
      });
      console.log('✅ Sucesso - Workspaces encontrados:', workspaces.data.workspace?.length || 0);
      
      if (workspaces.data.workspace && workspaces.data.workspace.length > 0) {
        console.log('📝 Workspaces disponíveis:');
        workspaces.data.workspace.forEach((ws, index) => {
          console.log(`   ${index + 1}. ${ws.name} (ID: ${ws.workspaceId})`);
        });
      }
    } catch (error) {
      console.log('❌ Falha - Listar workspaces:', (error as Error).message);
    }

    // Teste 4: Listar variáveis existentes
    console.log('\n📋 Teste 4: Listando variáveis existentes...');
    try {
      const variables = await tagmanager.accounts.containers.workspaces.variables.list({
        parent: `accounts/${accountId}/containers/${containerId}/workspaces/1`
      });
      console.log('✅ Sucesso - Variáveis encontradas:', variables.data.variable?.length || 0);
    } catch (error) {
      console.log('❌ Falha - Listar variáveis:', (error as Error).message);
    }

    // Teste 5: Listar triggers existentes
    console.log('\n📋 Teste 5: Listando triggers existentes...');
    try {
      const triggers = await tagmanager.accounts.containers.workspaces.triggers.list({
        parent: `accounts/${accountId}/containers/${containerId}/workspaces/1`
      });
      console.log('✅ Sucesso - Triggers encontrados:', triggers.data.trigger?.length || 0);
    } catch (error) {
      console.log('❌ Falha - Listar triggers:', (error as Error).message);
    }

    // Teste 6: Listar tags existentes
    console.log('\n📋 Teste 6: Listando tags existentes...');
    try {
      const tags = await tagmanager.accounts.containers.workspaces.tags.list({
        parent: `accounts/${accountId}/containers/${containerId}/workspaces/1`
      });
      console.log('✅ Sucesso - Tags encontradas:', tags.data.tag?.length || 0);
    } catch (error) {
      console.log('❌ Falha - Listar tags:', (error as Error).message);
    }

    // Teste 7: Tentar criar uma variável simples
    console.log('\n📋 Teste 7: Tentando criar uma variável de teste...');
    try {
      const testVariable = {
        name: 'Test Variable - Delete Me',
        type: 'c',
        parameter: [
          {
            type: 'TEMPLATE',
            key: 'value',
            value: 'test-value'
          }
        ]
      };
      
      const result = await tagmanager.accounts.containers.workspaces.variables.create({
        parent: `accounts/${accountId}/containers/${containerId}/workspaces/1`,
        requestBody: testVariable
      });
      
      console.log('✅ Sucesso - Variável criada:', result.data.name);
      
      // Tentar deletar a variável de teste
      if (result.data.variableId) {
        try {
          await tagmanager.accounts.containers.workspaces.variables.delete({
            path: `accounts/${accountId}/containers/${containerId}/workspaces/1/variables/${result.data.variableId}`
          });
          console.log('✅ Variável de teste deletada com sucesso');
        } catch (deleteError) {
          console.log('⚠️  Variável criada mas não foi possível deletar:', (deleteError as Error).message);
        }
      }
    } catch (error) {
      console.log('❌ Falha - Criar variável:', (error as Error).message);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar testes
testGTMPermissions().catch(console.error);