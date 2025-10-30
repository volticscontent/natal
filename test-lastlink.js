// Teste para verificar se a URL do LastLink está sendo gerada corretamente
const testData = {
  personalization: {
    children: [
      { name: "João", age: 5 },
      { name: "Maria", age: 7 }
    ]
  },
  customer: {
    name: "Teste Silva",
    email: "teste@email.com",
    phone: "11999999999"
  },
  pricing: {
    total: 49.90,
    currency: "BRL"
  },
  utm_params: {
    utm_source: "facebook",
    utm_medium: "cpc",
    utm_campaign: "natal2024"
  }
};

console.log('🧪 Testando geração de URL LastLink...');
console.log('📊 Dados de teste:', JSON.stringify(testData, null, 2));

// Simular a chamada para a API de produtos
fetch('http://localhost:3001/api/checkout/products')
  .then(response => response.json())
  .then(data => {
    console.log('📦 Produtos encontrados:', data.mainProducts?.length || 0);
    
    const childrenCount = testData.personalization.children.length;
    console.log('👶 Número de crianças:', childrenCount);
    
    // Encontrar produto baseado no número de crianças
    let product = data.mainProducts?.find(p => p.childrenCount === childrenCount);
    
    if (!product && childrenCount >= 3) {
      product = data.mainProducts?.find(p => p.childrenCount === 3);
    }
    
    if (product) {
      console.log('✅ Produto encontrado:', product.id);
      console.log('🔗 URLs disponíveis:', Object.keys(product.checkoutUrls.lastlink));
      
      // Testar URL base
      const baseUrl = product.checkoutUrls.lastlink.base;
      console.log('🎯 URL base do LastLink:', `https://lastlink.com/p/${baseUrl}/checkout-payment/`);
      
      // Testar com combo
      if (product.checkoutUrls.lastlink.withCombo) {
        const comboUrl = product.checkoutUrls.lastlink.withCombo;
        console.log('🎁 URL com combo:', `https://lastlink.com/p/${comboUrl}/checkout-payment/`);
      }
    } else {
      console.log('❌ Nenhum produto encontrado para', childrenCount, 'crianças');
    }
  })
  .catch(error => {
    console.error('❌ Erro ao buscar produtos:', error);
  });