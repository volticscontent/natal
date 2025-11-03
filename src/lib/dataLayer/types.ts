// 📊 Tipos da DataLayer - Sistema de Tracking Inteligente

export type PageType = 
  | 'landing_page'
  | 'step_1'
  | 'step_2' 
  | 'step_3'
  | 'checkout'
  | 'thank_you';

export type EventPriority = 'high' | 'medium' | 'low';

export type Locale = 'pt' | 'en' | 'es';

// 🎯 Contexto da Página
export interface PageContext {
  page_type: PageType;
  page_name: string;
  page_url: string;
  page_title: string;
  locale: Locale;
}

// 👤 Dados do Usuário (Anonimizados)
export interface UserData {
  session_id: string;
  client_id?: string;
  user_agent_hash: string;
  timestamp: number;
}

// 📈 Dados de Campanha
export interface CampaignData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
  fbclid?: string;
}

// 🛍️ Item do Carrinho
export interface CartItem {
  item_id: string;
  item_name: string;
  category: 'main_product' | 'order_bump';
  quantity: number;
  price: number;
}

// 📄 Eventos da Landing Page
export interface LandingPageViewData {
  content_type: 'landing_page';
  content_id: 'home_page';
  referrer: string;
  scroll_depth: number;
  time_on_page: number;
}

export interface LandingCtaClickData {
  cta_type: 'primary' | 'secondary' | 'product';
  cta_text: string;
  cta_position: 'hero_section' | 'product_carousel' | 'video_section' | 'discount_card' | 'footer';
  cta_id: string;
  destination?: string;
  product_position?: number;
}

export interface LandingVideoEngagementData {
  video_type: 'promotional' | 'testimonial';
  video_id: string;
  action: 'play' | 'pause' | 'complete' | 'seek';
  progress_percentage: number;
  duration_watched: number;
}

export interface LandingScrollDepthData {
  scroll_percentage: number;
  sections_viewed: string[];
  time_to_scroll: number;
}

// 🎯 Eventos do Step 1
export interface Step1PageViewData {
  content_type: 'personalization_step';
  step_number: 1;
  step_name: 'quantity_selection';
  funnel_position: 'step_1_of_3';
}

export interface Step1QuantitySelectedData {
  quantity_selected: number;
  price_per_unit: number;
  total_price: number;
  discount_percentage: number;
  selection_time: number;
}

export interface Step1NavigationData {
  action: 'continue' | 'back';
  destination: string;
  form_completion: number;
  time_on_step: number;
}

// 🛍️ Eventos do Step 2
export interface Step2PageViewData {
  content_type: 'order_bumps';
  step_number: 2;
  available_bumps: string[];
  base_order_value: number;
}

export interface Step2BumpInteractionData {
  bump_id: string;
  bump_name: string;
  action: 'add' | 'remove';
  bump_price: number;
  new_total: number;
  interaction_time: number;
}

export interface Step2AddToCartData {
  currency: 'BRL';
  value: number;
  items: CartItem[];
}

// 📝 Eventos do Step 3
export interface Step3PageViewData {
  content_type: 'data_collection';
  step_number: 3;
  required_fields: number;
  cart_value: number;
}

export interface Step3FormInteractionData {
  field_name: string;
  field_type: 'text' | 'email' | 'select' | 'textarea';
  action: 'focus' | 'blur' | 'change';
  form_completion_percentage: number;
  validation_status: 'valid' | 'invalid' | 'pending';
}

export interface Step3FormSubmitData {
  submission_status: 'success' | 'error';
  form_completion_time: number;
  fields_completed: number;
  validation_errors: number;
  children_count: number;
  contact_method: 'email' | 'whatsapp';
}

export interface Step3BeginCheckoutData {
  currency: 'BRL';
  value: number;
  checkout_method: 'cartpanda';
  funnel_completion_time: number;
  items: CartItem[];
}

// 💳 Eventos do Checkout
export interface CheckoutInitiatedData {
  checkout_provider: 'cartpanda';
  redirect_url: string;
  order_value: number;
  redirect_time: number;
}

// 🎉 Eventos da Thank You Page
export interface PurchaseCompletedData {
  transaction_id: string;
  currency: 'BRL';
  value: number;
  order_id: string;
  customer_id: string;
  items: CartItem[];
  payment_method: string;
}

export interface ThankYouSocialShareData {
  platform: 'whatsapp' | 'facebook';
  share_type: 'purchase_celebration';
  order_value: number;
}

// 🎯 Union Types para Event Data
export type EventData = 
  | LandingPageViewData
  | LandingCtaClickData
  | LandingVideoEngagementData
  | LandingScrollDepthData
  | Step1PageViewData
  | Step1QuantitySelectedData
  | Step1NavigationData
  | Step2PageViewData
  | Step2BumpInteractionData
  | Step2AddToCartData
  | Step3PageViewData
  | Step3FormInteractionData
  | Step3FormSubmitData
  | Step3BeginCheckoutData
  | CheckoutInitiatedData
  | PurchaseCompletedData
  | ThankYouSocialShareData;

// 📊 Estrutura Base do Evento
export interface BaseDataLayerEvent {
  event: string;
  page_context: PageContext;
  user_data: UserData;
  campaign_data: CampaignData;
  event_data: EventData;
  priority?: EventPriority;
  timestamp?: number;
}

// 🎯 Eventos Específicos por Página
export interface LandingPageEvent extends BaseDataLayerEvent {
  event: 'landing_page_view' | 'landing_cta_click' | 'landing_video_engagement' | 'landing_scroll_depth';
  page_context: PageContext & { page_type: 'landing_page' };
}

export interface Step1Event extends BaseDataLayerEvent {
  event: 'step_1_page_view' | 'step_1_quantity_selected' | 'step_1_navigation';
  page_context: PageContext & { page_type: 'step_1' };
}

export interface Step2Event extends BaseDataLayerEvent {
  event: 'step_2_page_view' | 'step_2_bump_interaction' | 'step_2_add_to_cart';
  page_context: PageContext & { page_type: 'step_2' };
}

export interface Step3Event extends BaseDataLayerEvent {
  event: 'step_3_page_view' | 'step_3_form_interaction' | 'step_3_form_submit' | 'step_3_begin_checkout';
  page_context: PageContext & { page_type: 'step_3' };
}

export interface CheckoutEvent extends BaseDataLayerEvent {
  event: 'checkout_initiated';
  page_context: PageContext & { page_type: 'checkout' };
}

export interface ThankYouEvent extends BaseDataLayerEvent {
  event: 'purchase_completed' | 'thank_you_social_share';
  page_context: PageContext & { page_type: 'thank_you' };
}

// 🔧 Configurações das Plataformas
export interface PlatformConfig {
  ga4?: {
    measurement_id_primary: string;
    measurement_id_conversions: string;
  };
  facebook?: {
    pixel_id: string;
    access_token?: string;
  };
  tiktok?: {
    pixel_id: string;
  };
  google_ads?: {
    conversion_id: string;
    conversion_labels: Record<string, string>;
  };
}

// 📊 Configuração do Tracking
export interface TrackingConfig {
  platforms: PlatformConfig;
  debug: boolean;
  batch_size: number;
  batch_timeout: {
    high: number;
    medium: number;
    low: number;
  };
  retry_attempts: number;
  consent_required: boolean;
}

// 🎯 Event Queue Item
export interface QueuedEvent {
  id: string;
  event: BaseDataLayerEvent;
  priority: EventPriority;
  timestamp: number;
  retry_count: number;
  platforms: string[];
}

// 📈 Tracking Context
export interface TrackingContext {
  session_id: string;
  page_load_time: number;
  scroll_depth: number;
  time_on_page: number;
  interactions_count: number;
  form_fields_completed: string[];
  utm_parameters: CampaignData;
}