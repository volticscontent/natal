#!/usr/bin/env node

// Script para verificar se o token GTM ainda está válido
import { google } from 'googleapis';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config({ path: '.env.local' });
config();

async function checkTokenValidity() {
  console.log('🔍 Verificando validade do token GTM...\n');

  const accessToken = process.env.GTM_ACCESS_TOKEN;
  const accountId = process.env.GTM_ACCOUNT_ID;
  const containerId = process.env.GTM_CONTAINER_ID;

  if (!accessToken || !accountId || !containerId) {
    console.log('❌ Variáveis de ambiente não configuradas');
    return false;
  }

  try {
    // Configurar cliente OAuth2
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    // Inicializar Tag Manager API
    const tagmanager = google.tagmanager({ version: 'v2', auth });

    // Testar acesso listando workspaces
    console.log('📋 Testando acesso aos workspaces...');
    const response = await tagmanager.accounts.containers.workspaces.list({
      parent: `accounts/${accountId}/containers/${containerId}`
    });

    console.log('✅ Token válido!');
    console.log(`📊 Workspaces encontrados: ${response.data.workspace?.length || 0}`);
    
    if (response.data.workspace && response.data.workspace.length > 0) {
      console.log('\n🏢 Workspaces disponíveis:');
      response.data.workspace.forEach((workspace, index) => {
        console.log(`   ${index + 1}. ${workspace.name} (ID: ${workspace.workspaceId})`);
      });
    }

    return true;
  } catch (error: any) {
    console.log('❌ Token inválido ou expirado');
    console.log(`Erro: ${error.message}`);
    
    if (error.message.includes('invalid_token') || error.message.includes('Token has been expired')) {
      console.log('\n💡 Você precisa gerar um novo token de acesso');
      console.log('🔗 Acesse: https://developers.google.com/oauthplayground/');
      console.log('📋 Selecione os escopos:');
      console.log('   - https://www.googleapis.com/auth/tagmanager.edit.containers');
      console.log('   - https://www.googleapis.com/auth/tagmanager.manage.accounts');
    }
    
    return false;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  checkTokenValidity().then(isValid => {
    process.exit(isValid ? 0 : 1);
  });
}

export { checkTokenValidity };