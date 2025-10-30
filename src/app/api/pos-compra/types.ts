/**
 * Tipos TypeScript para os webhooks de pós-compra
 * 
 * Baseado na documentação dos gateways:
 * - LastLink: Eventos como Purchase_Order_Confirmed, Payment_Refund, etc.
 * - CartPanda: Eventos como order.paid, order.created, order.refunded, etc.
 */

// ===== LASTLINK TYPES =====

export interface LastLinkWebhookPayload {
  event_type: LastLinkEventType;
  event_id: string;
  timestamp: string;
  data: LastLinkEventData;
}

export type LastLinkEventType = 
  | 'Purchase_Order_Confirmed'
  | 'Payment_Refund'
  | 'Payment_Chargeback'
  | 'Purchase_Request_Canceled'
  | 'Purchase_Request_Confirmed'
  | 'Purchase_Request_Expired'
  | 'Recurrent_Payment'
  | 'Refund_Period_Over'
  | 'Subscription_Canceled'
  | 'Subscription_Expired'
  | 'Product_access_started'
  | 'Product_access_ended'
  | 'Subscription_Renewal_Pending'
  | 'Active_Member_Notification'
  | 'Refund_Requested'
  | 'Abandoned_Cart';

export interface LastLinkEventData {
  order_id: string;
  product_id: string;
  customer: LastLinkCustomer;
  payment: LastLinkPayment;
  subscription?: LastLinkSubscription;
  metadata?: Record<string, unknown>;
}

export interface LastLinkCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  document?: string;
  address?: LastLinkAddress;
}

export interface LastLinkAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipcode: string;
  country: string;
}

export interface LastLinkPayment {
  id: string;
  status: 'paid' | 'pending' | 'canceled' | 'refunded' | 'chargeback';
  amount: number;
  currency: string;
  method: 'credit_card' | 'pix' | 'boleto' | 'debit_card';
  installments?: number;
  paid_at?: string;
  refunded_at?: string;
}

export interface LastLinkSubscription {
  id: string;
  status: 'active' | 'canceled' | 'expired' | 'pending';
  plan: string;
  next_billing_date?: string;
  canceled_at?: string;
  expired_at?: string;
}

// ===== CARTPANDA TYPES =====

export interface CartPandaWebhookPayload {
  event: CartPandaEventType;
  event_id: string;
  timestamp: string;
  data: CartPandaEventData;
}

export type CartPandaEventType = 
  | 'product.created'
  | 'product.updated'
  | 'product.deleted'
  | 'order.created'
  | 'order.paid'
  | 'order.updated'
  | 'order.refunded';

export interface CartPandaEventData {
  order_id: string;
  product_id: string;
  customer: CartPandaCustomer;
  payment: CartPandaPayment;
  items: CartPandaOrderItem[];
  totals: CartPandaTotals;
  metadata?: Record<string, unknown>;
}

export interface CartPandaCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  document?: string;
  address?: CartPandaAddress;
}

export interface CartPandaAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipcode: string;
  country: string;
}

export interface CartPandaPayment {
  id: string;
  status: 'paid' | 'pending' | 'canceled' | 'refunded';
  amount: number;
  currency: string;
  method: 'credit_card' | 'pix' | 'boleto' | 'debit_card';
  installments?: number;
  paid_at?: string;
  refunded_at?: string;
  gateway: string;
}

export interface CartPandaOrderItem {
  id: string;
  product_id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface CartPandaTotals {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
}

// ===== COMMON TYPES =====

export interface WebhookResponse {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
}

export interface ProcessedSaleData {
  gateway: 'lastlink' | 'cartpanda';
  order_id: string;
  customer_email: string;
  customer_name: string;
  amount: number;
  currency: string;
  status: string;
  event_type: string;
  processed_at: string;
  raw_data: unknown;
}