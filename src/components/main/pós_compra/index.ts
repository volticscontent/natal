// 🎉 Páginas de Agradecimento Pós-Compra
// Componentes para redirect após checkout bem-sucedido

export { default as ThankYouLastLink } from './thank_youLastLink';
export { default as ThankYouCartPanda } from './thank_youCartPanda';

// 📝 Uso:
// - ThankYouLastLink: Para checkout do Brasil (LastLink)
// - ThankYouCartPanda: Para checkout internacional (CartPanda)
//
// 🔗 URLs de redirect:
// - Brasil: /components/main/pós_compra/thank_youLastLink
// - Internacional: /components/main/pós_compra/thank_youCartPanda
//
// 📊 Parâmetros esperados na URL:
// - session_id: ID da sessão de personalização
// - order_id: ID do pedido gerado pelo checkout
// - customer_name: Nome do cliente
// - children_count: Número de crianças
// - total_amount: Valor total do pedido
// - currency: Moeda (apenas CartPanda)