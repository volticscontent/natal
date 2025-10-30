import { NextResponse } from 'next/server';

/**
 * API de Pós-Compra
 * 
 * Esta API gerencia os webhooks de pós-compra dos gateways de pagamento:
 * - LastLink: /api/pos-compra/lastlink
 * - CartPanda: /api/pos-compra/cartpanda
 * 
 * Cada gateway tem seu próprio endpoint para receber os dados de venda
 * e processar as informações de acordo com sua estrutura específica.
 */

export async function GET() {
  return NextResponse.json({
    message: 'API de Pós-Compra',
    endpoints: {
      lastlink: '/api/pos-compra/lastlink',
      cartpanda: '/api/pos-compra/cartpanda'
    },
    description: 'Webhooks para receber dados de vendas dos gateways de pagamento'
  });
}