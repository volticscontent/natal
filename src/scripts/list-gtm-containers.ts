import dotenv from 'dotenv';
import { google } from 'googleapis';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

async function listGTMContainers() {
  console.log('📋 Listando todos os containers GTM disponíveis...\n');

  const accessToken = process.env.GTM_ACCESS_TOKEN!;

  // Configurar API diretamente
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const tagmanager = google.tagmanager({ version: 'v2', auth });

  try {
    // Listar todas as contas
    console.log('🔍 Buscando contas...');
    const accounts = await tagmanager.accounts.list();
    
    if (!accounts.data.account || accounts.data.account.length === 0) {
      console.log('❌ Nenhuma conta encontrada');
      return;
    }

    console.log(`✅ ${accounts.data.account.length} conta(s) encontrada(s)\n`);

    // Para cada conta, listar containers
    for (const account of accounts.data.account) {
      console.log(`📁 Conta: ${account.name} (ID: ${account.accountId})`);
      
      try {
        const containers = await tagmanager.accounts.containers.list({
          parent: `accounts/${account.accountId}`
        });

        if (!containers.data.container || containers.data.container.length === 0) {
          console.log('   📦 Nenhum container encontrado\n');
          continue;
        }

        console.log(`   📦 ${containers.data.container.length} container(s) encontrado(s):`);
        
        for (const container of containers.data.container) {
          console.log(`      🏷️  ${container.name}`);
          console.log(`         ID: ${container.containerId}`);
          console.log(`         Domínio: ${container.domainName?.join(', ') || 'N/A'}`);
          console.log(`         Uso: ${container.usageContext?.join(', ') || 'N/A'}`);
          console.log('');
        }
      } catch (error) {
        console.log(`   ❌ Erro ao listar containers: ${(error as Error).message}\n`);
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar listagem
listGTMContainers().catch(console.error);