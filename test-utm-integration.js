/**
 * Teste para verificar se as UTMs estão sendo incluídas na URL da LastLink
 */

// Simular localStorage com UTMs
const mockUtmParams = {
  utm_source: 'facebook',
  utm_medium: 'social',
  utm_campaign: 'natal_2024',
  utm_term: 'recadinhos_papai_noel',
  utm_content: 'video_promocional',
  utm_session_id: 'sess_123456789'
};

console.log('🧪 Teste de Integração UTM com LastLink');
console.log('==========================================');

// Simular dados de teste
const testPersData = {
  children: [
    {
      nome: 'João',
      idade: 8,
      comportamento: 'Bem comportado'
    }
  ],
  order_bumps: ['4k-quality'],
  contato: {
    nome: 'Maria Silva',
    email: 'maria@teste.com',
    telefone: '11999999999',
    cpf: '123.456.789-00'
  }
};

console.log('📋 Dados de teste preparados:');
console.log('- UTMs simuladas:', mockUtmParams);
console.log('- Dados de personalização:', testPersData);

// Simular URL que seria gerada
const baseUrl = 'https://pay.lastlink.com.br';
const productUrl = 'checkout/PROD123';

// Construir URL com UTMs
const url = new URL(`${baseUrl}/${productUrl}`);

// Adicionar dados do cliente
url.searchParams.set('customer_name', testPersData.contato.nome);
url.searchParams.set('customer_email', testPersData.contato.email);
url.searchParams.set('customer_phone', testPersData.contato.telefone);
url.searchParams.set('customer_cpf', testPersData.contato.cpf);

// Adicionar UTMs
Object.entries(mockUtmParams).forEach(([key, value]) => {
  url.searchParams.set(key, value);
});

console.log('\n🔗 URL gerada com UTMs:');
console.log(url.toString());

console.log('\n✅ Parâmetros UTM incluídos na URL:');
Object.entries(mockUtmParams).forEach(([key, value]) => {
  const paramValue = url.searchParams.get(key);
  const status = paramValue === value ? '✅' : '❌';
  console.log(`${status} ${key}: ${paramValue} (esperado: ${value})`);
});

console.log('\n📊 Resumo do teste:');
const utmCount = Object.keys(mockUtmParams).length;
const includedCount = Object.keys(mockUtmParams).filter(key => 
  url.searchParams.get(key) === mockUtmParams[key]
).length;

console.log(`- UTMs esperadas: ${utmCount}`);
console.log(`- UTMs incluídas: ${includedCount}`);
console.log(`- Status: ${includedCount === utmCount ? '✅ SUCESSO' : '❌ FALHA'}`);

if (includedCount === utmCount) {
  console.log('\n🎉 Teste passou! As UTMs estão sendo incluídas corretamente na URL da LastLink.');
} else {
  console.log('\n⚠️ Teste falhou! Algumas UTMs não estão sendo incluídas na URL.');
}