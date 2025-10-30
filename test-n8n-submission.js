// Teste de envio para N8N
const testN8NSubmission = async () => {
  const testData = {
    persData: {
      quantidade_criancas: 2,
      children: [
        { nome: 'Ana', idade: 8, comportamento: 'Muito boa' },
        { nome: 'João', idade: 6, comportamento: 'Travesso mas carinhoso' }
      ],
      mensagem: 'Mensagem personalizada de teste para as crianças',
      incluir_fotos: true,
      fotos: ['foto1.jpg', 'foto2.jpg'],
      order_bumps: ['fotos', 'embalagem-premium'],
      observacoes: 'Observações especiais de teste'
    },
    contactData: {
      nome: 'João Silva',
      email: 'joao.silva@email.com',
      telefone: '(11) 99999-9999',
      cpf: '123.456.789-09'  // CPF de teste (formato válido)
    },
    sessionId: 'test-session-' + Date.now(),
    utmParams: {
      utm_source: 'facebook',
      utm_medium: 'social',
      utm_campaign: 'natal-2024',
      utm_term: 'recadinhos',
      utm_content: 'video-promocional',
      fbclid: '1234567890abcdef',
      gclid: 'abcdef1234567890',
      click_id: 'custom_click_123'
    }
  };

  console.log('🚀 Enviando dados de teste para /api/submit-order...');
  console.log('📊 Dados:', JSON.stringify(testData, null, 2));

  try {
    const response = await fetch('http://localhost:3000/api/submit-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log('📈 Status da resposta:', response.status);
    console.log('📋 Headers da resposta:', Object.fromEntries(response.headers.entries()));

    const result = await response.json();
    console.log('📄 Resultado:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('✅ Teste bem-sucedido!');
    } else {
      console.log('❌ Teste falhou!');
    }
  } catch (error) {
    console.error('💥 Erro durante o teste:', error);
  }
};

// Executar o teste
testN8NSubmission();