import { config } from 'dotenv';
import path from 'path';

// Carregar variáveis do .env.local
config({ path: path.resolve(process.cwd(), '.env.local') });

const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID;

interface EventConfig {
  name: string;
  displayName: string;
  description: string;
  parameters: string[];
  isConversion: boolean;
}

const EVENTS_CONFIG: EventConfig[] = [
  {
    name: 'carta_iniciada',
    displayName: 'Carta Iniciada',
    description: 'Usuário começou a escrever uma carta para o Papai Noel',
    parameters: ['page_location', 'user_language'],
    isConversion: false
  },
  {
    name: 'carta_personalizada',
    displayName: 'Carta Personalizada',
    description: 'Usuário personalizou a carta (nome, idade, etc.)',
    parameters: ['personalization_step', 'user_age', 'user_name'],
    isConversion: false
  },
  {
    name: 'carta_escrita',
    displayName: 'Carta Escrita',
    description: 'Usuário terminou de escrever o conteúdo da carta',
    parameters: ['carta_length', 'time_spent_writing'],
    isConversion: false
  },
  {
    name: 'checkout_iniciado',
    displayName: 'Checkout Iniciado',
    description: 'Usuário iniciou o processo de checkout',
    parameters: ['product_type', 'price'],
    isConversion: true
  },
  {
    name: 'pagamento_processado',
    displayName: 'Pagamento Processado',
    description: 'Pagamento foi processado com sucesso',
    parameters: ['payment_method', 'amount', 'currency'],
    isConversion: true
  },
  {
    name: 'carta_finalizada',
    displayName: 'Carta Finalizada',
    description: 'Processo completo - carta criada e paga',
    parameters: ['total_time', 'final_price', 'delivery_method'],
    isConversion: true
  }
];

function generateManualSetupGuide() {
  console.log('🎄 GUIA DE CONFIGURAÇÃO MANUAL GA4 - CARTAS PAPAI NOEL');
  console.log('='.repeat(80));
  
  if (!GA4_PROPERTY_ID) {
    console.error('❌ GA4_PROPERTY_ID não encontrado no .env.local');
    return;
  }

  console.log(`\n🔍 Property ID: ${GA4_PROPERTY_ID}`);
  console.log(`🌐 Acesse: https://analytics.google.com/analytics/web/#/p${GA4_PROPERTY_ID}/admin`);
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 PASSO 1: CONFIGURAR EVENTOS CUSTOMIZADOS');
  console.log('='.repeat(80));
  
  console.log('\n1. Acesse Google Analytics 4');
  console.log('2. Vá em Admin → Eventos → Criar evento');
  console.log('3. Configure os seguintes eventos:\n');
  
  EVENTS_CONFIG.forEach((event, index) => {
    console.log(`${index + 1}. ${event.displayName} (${event.name})`);
    console.log(`   📝 Descrição: ${event.description}`);
    console.log(`   📊 Parâmetros: ${event.parameters.join(', ')}`);
    console.log(`   🎯 Conversão: ${event.isConversion ? 'SIM' : 'NÃO'}`);
    console.log('');
  });

  console.log('='.repeat(80));
  console.log('🎯 PASSO 2: CONFIGURAR CONVERSÕES');
  console.log('='.repeat(80));
  
  console.log('\n1. Vá em Admin → Conversões');
  console.log('2. Clique em "Criar evento de conversão"');
  console.log('3. Configure as seguintes conversões:\n');
  
  const conversions = EVENTS_CONFIG.filter(e => e.isConversion);
  conversions.forEach((conv, index) => {
    console.log(`${index + 1}. Nome do evento: ${conv.name}`);
    console.log(`   📊 Método de contagem: ${conv.name === 'carta_finalizada' ? 'Uma vez por evento' : 'Uma vez por sessão'}`);
    console.log('');
  });

  console.log('='.repeat(80));
  console.log('📏 PASSO 3: CONFIGURAR DIMENSÕES CUSTOMIZADAS');
  console.log('='.repeat(80));
  
  console.log('\n1. Vá em Admin → Definições customizadas → Dimensões customizadas');
  console.log('2. Clique em "Criar dimensão customizada"');
  console.log('3. Configure as seguintes dimensões:\n');
  
  const customDimensions = [
    { name: 'user_language', display: 'Idioma do Usuário', scope: 'Evento' },
    { name: 'personalization_step', display: 'Etapa de Personalização', scope: 'Evento' },
    { name: 'carta_length', display: 'Tamanho da Carta', scope: 'Evento' },
    { name: 'payment_method', display: 'Método de Pagamento', scope: 'Evento' }
  ];
  
  customDimensions.forEach((dim, index) => {
    console.log(`${index + 1}. Nome do parâmetro: ${dim.name}`);
    console.log(`   📊 Nome de exibição: ${dim.display}`);
    console.log(`   🎯 Escopo: ${dim.scope}`);
    console.log('');
  });

  console.log('='.repeat(80));
  console.log('🔄 PASSO 4: CRIAR FUNIL DE CONVERSÃO');
  console.log('='.repeat(80));
  
  console.log('\n1. Vá em Explorar → Análise de funil');
  console.log('2. Configure as seguintes etapas:\n');
  
  const funnelSteps = [
    'page_view (Visitantes)',
    'carta_iniciada (Carta Iniciada)',
    'carta_personalizada (Carta Personalizada)',
    'carta_escrita (Carta Escrita)',
    'checkout_iniciado (Checkout Iniciado)',
    'pagamento_processado (Pagamento Processado)',
    'carta_finalizada (Carta Finalizada)'
  ];
  
  funnelSteps.forEach((step, index) => {
    console.log(`   Etapa ${index + 1}: ${step}`);
  });

  console.log('\n3. Salve o relatório como "Funil Cartas Papai Noel"');

  console.log('\n' + '='.repeat(80));
  console.log('📈 PASSO 5: IMPLEMENTAR TRACKING NO FRONTEND');
  console.log('='.repeat(80));
  
  console.log('\nUse a biblioteca GA4Events que foi criada:');
  console.log(`
import GA4Events, { useGA4Tracking } from '@/lib/ga4-events';

// Em componentes React
const { trackCartaIniciada, trackCartaPersonalizada } = useGA4Tracking();

// Exemplos de uso:
trackCartaIniciada(); // Quando usuário inicia carta
trackCartaPersonalizada({ 
  personalization_step: 'nome_idade',
  user_age: 8 
});
trackCheckoutIniciado({ 
  product_type: 'carta_premium',
  price: 29.90 
});
`);

  console.log('='.repeat(80));
  console.log('✅ VERIFICAÇÃO FINAL');
  console.log('='.repeat(80));
  
  console.log('\nApós implementar os eventos, verifique:');
  console.log('1. ✅ Eventos aparecem em Tempo Real → Eventos');
  console.log('2. ✅ Conversões são registradas em Tempo Real → Conversões');
  console.log('3. ✅ Funil funciona em Explorar → Análise de funil');
  console.log('4. ✅ Dimensões customizadas aparecem nos relatórios');
  
  console.log('\n💡 DICAS IMPORTANTES:');
  console.log('• Eventos podem demorar 24-48h para aparecer em relatórios históricos');
  console.log('• Use Tempo Real para testar eventos imediatamente');
  console.log('• Teste em modo de desenvolvimento primeiro');
  console.log('• Verifique se o gtag está carregado corretamente');
  
  console.log('\n🚀 PRÓXIMOS PASSOS:');
  console.log('1. Configure os eventos manualmente no GA4');
  console.log('2. Implemente o tracking nos componentes React');
  console.log('3. Teste em desenvolvimento');
  console.log('4. Monitore os dados em produção');
  
  console.log('\n' + '='.repeat(80));
}

function generateImplementationCode() {
  console.log('\n📝 CÓDIGO DE IMPLEMENTAÇÃO PARA COMPONENTES:');
  console.log('='.repeat(60));
  
  console.log(`
// 1. Em uma página de carta (ex: src/app/[locale]/page.tsx)
import { useGA4Tracking } from '@/lib/ga4-events';

export default function CartaPage() {
  const { trackCartaIniciada } = useGA4Tracking();
  
  useEffect(() => {
    // Disparar quando página carrega
    trackCartaIniciada();
  }, []);
  
  return (
    // Seu componente
  );
}

// 2. Em um formulário de personalização
const { trackCartaPersonalizada } = useGA4Tracking();

const handlePersonalizationSubmit = (data) => {
  trackCartaPersonalizada({
    personalization_step: 'nome_idade',
    user_age: data.age,
    user_name: data.name
  });
};

// 3. Em um componente de checkout
const { trackCheckoutIniciado, trackPagamentoProcessado } = useGA4Tracking();

const handleCheckoutStart = () => {
  trackCheckoutIniciado({
    product_type: 'carta_premium',
    price: 29.90
  });
};

const handlePaymentSuccess = (paymentData) => {
  trackPagamentoProcessado({
    payment_method: paymentData.method,
    amount: paymentData.amount,
    currency: 'BRL'
  });
  
  // Conversão final
  trackCartaFinalizada({
    total_time: getTotalTime(),
    final_price: paymentData.amount,
    delivery_method: 'digital'
  });
};
`);
}

function main() {
  generateManualSetupGuide();
  generateImplementationCode();
}

if (require.main === module) {
  main();
}

export { EVENTS_CONFIG, generateManualSetupGuide };