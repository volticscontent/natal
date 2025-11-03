// ✅ Validadores da DataLayer - Validação em Tempo Real

import { 
  BaseDataLayerEvent, 
  PageType, 
  EventPriority, 
  Locale,
  PageContext,
  UserData,
  EventData,
  TrackingConfig,
  LandingPageViewData,
  LandingCtaClickData,
  LandingVideoEngagementData,
  LandingScrollDepthData,
  Step1PageViewData,
  Step1QuantitySelectedData,
  Step1NavigationData,
  Step2PageViewData,
  Step2BumpInteractionData,
  Step2AddToCartData,
  Step3PageViewData,
  Step3FormInteractionData,
  Step3FormSubmitData,
  Step3BeginCheckoutData,
  CheckoutInitiatedData,
  PurchaseCompletedData,
  ThankYouSocialShareData
} from './types';

// 🎯 Validação Principal
export const validateEvent = (event: BaseDataLayerEvent): boolean => {
  try {
    // Validar campos obrigatórios
    const requiredFields: (keyof BaseDataLayerEvent)[] = ['event', 'page_context', 'user_data', 'event_data'];
    const missingFields = requiredFields.filter(field => !event[field]);
    
    if (missingFields.length > 0) {
      console.error('❌ Campos obrigatórios ausentes:', missingFields);
      return false;
    }

    // Validar estruturas específicas
    if (!validatePageContext(event.page_context)) return false;
    if (!validateUserData(event.user_data)) return false;
    if (!validateEventName(event.event)) return false;
    if (!validateEventData(event.event, event.event_data)) return false;

    return true;
  } catch (error) {
    console.error('❌ Erro na validação do evento:', error);
    return false;
  }
};

// 📄 Validação do Contexto da Página
export const validatePageContext = (pageContext: PageContext): boolean => {
  if (!pageContext) {
    console.error('❌ page_context é obrigatório');
    return false;
  }

  const requiredFields = ['page_type', 'page_name', 'page_url', 'page_title', 'locale'];
  const missingFields = requiredFields.filter(field => !pageContext[field as keyof PageContext]);
  
  if (missingFields.length > 0) {
    console.error('❌ Campos obrigatórios ausentes no page_context:', missingFields);
    return false;
  }

  // Validar tipos específicos
  const validPageTypes: PageType[] = ['landing_page', 'step_1', 'step_2', 'step_3', 'checkout', 'thank_you'];
  if (!validPageTypes.includes(pageContext.page_type)) {
    console.error('❌ page_type inválido:', pageContext.page_type);
    return false;
  }

  const validLocales: Locale[] = ['pt', 'en', 'es'];
  if (!validLocales.includes(pageContext.locale)) {
    console.error('❌ locale inválido:', pageContext.locale);
    return false;
  }

  return true;
};

// 👤 Validação dos Dados do Usuário
export const validateUserData = (userData: UserData): boolean => {
  if (!userData) {
    console.error('❌ user_data é obrigatório');
    return false;
  }

  const requiredFields = ['session_id', 'user_agent_hash', 'timestamp'];
  const missingFields = requiredFields.filter(field => !userData[field as keyof UserData]);
  
  if (missingFields.length > 0) {
    console.error('❌ Campos obrigatórios ausentes no user_data:', missingFields);
    return false;
  }

  // Validar formato do timestamp
  if (typeof userData.timestamp !== 'number' || userData.timestamp <= 0) {
    console.error('❌ timestamp deve ser um número positivo');
    return false;
  }

  // Validar formato do session_id
  if (typeof userData.session_id !== 'string' || userData.session_id.length < 10) {
    console.error('❌ session_id deve ser uma string com pelo menos 10 caracteres');
    return false;
  }

  return true;
};

// 📊 Validação do Nome do Evento
export const validateEventName = (eventName: string): boolean => {
  if (!eventName || typeof eventName !== 'string') {
    console.error('❌ Nome do evento é obrigatório e deve ser string');
    return false;
  }

  const validEvents = [
    // Landing Page Events
    'landing_page_view',
    'landing_cta_click',
    'landing_video_engagement',
    'landing_scroll_depth',
    
    // Step 1 Events
    'step_1_page_view',
    'step_1_quantity_selected',
    'step_1_navigation',
    
    // Step 2 Events
    'step_2_page_view',
    'step_2_bump_interaction',
    'step_2_add_to_cart',
    
    // Step 3 Events
    'step_3_page_view',
    'step_3_form_interaction',
    'step_3_form_submit',
    'step_3_begin_checkout',
    
    // Checkout Events
    'checkout_initiated',
    
    // Thank You Events
    'purchase_completed',
    'thank_you_social_share'
  ];

  if (!validEvents.includes(eventName)) {
    console.error('❌ Nome do evento inválido:', eventName);
    return false;
  }

  return true;
};

// 📈 Validação dos Dados do Evento
export const validateEventData = (eventName: string, eventData: EventData): boolean => {
  if (!eventData) {
    console.error('❌ event_data é obrigatório');
    return false;
  }

  // Validar dados específicos por tipo de evento
  switch (eventName) {
    case 'landing_page_view':
      return validateLandingPageViewData(eventData as LandingPageViewData);
    case 'landing_cta_click':
      return validateLandingCtaClickData(eventData as LandingCtaClickData);
    case 'landing_video_engagement':
      return validateLandingVideoEngagementData(eventData as LandingVideoEngagementData);
    case 'landing_scroll_depth':
      return validateLandingScrollDepthData(eventData as LandingScrollDepthData);
    case 'step_1_page_view':
      return validateStep1PageViewData(eventData as Step1PageViewData);
    case 'step_1_quantity_selected':
      return validateStep1QuantitySelectedData(eventData as Step1QuantitySelectedData);
    case 'step_1_navigation':
      return validateStep1NavigationData(eventData as Step1NavigationData);
    case 'step_2_page_view':
      return validateStep2PageViewData(eventData as Step2PageViewData);
    case 'step_2_bump_interaction':
      return validateStep2BumpInteractionData(eventData as Step2BumpInteractionData);
    case 'step_2_add_to_cart':
      return validateStep2AddToCartData(eventData as Step2AddToCartData);
    case 'step_3_page_view':
      return validateStep3PageViewData(eventData as Step3PageViewData);
    case 'step_3_form_interaction':
      return validateStep3FormInteractionData(eventData as Step3FormInteractionData);
    case 'step_3_form_submit':
      return validateStep3FormSubmitData(eventData as Step3FormSubmitData);
    case 'step_3_begin_checkout':
      return validateStep3BeginCheckoutData(eventData as Step3BeginCheckoutData);
    case 'checkout_initiated':
      return validateCheckoutInitiatedData(eventData as CheckoutInitiatedData);
    case 'purchase_completed':
      return validatePurchaseCompletedData(eventData as PurchaseCompletedData);
    case 'thank_you_social_share':
      return validateThankYouSocialShareData(eventData as ThankYouSocialShareData);
    default:
      console.error('❌ Tipo de evento não suportado:', eventName);
      return false;
  }
};

// 🏠 Validação - Landing Page View
const validateLandingPageViewData = (data: LandingPageViewData): boolean => {
  return validateRequiredFields(data as unknown as Record<string, unknown>, ['content_type', 'content_id', 'referrer', 'scroll_depth', 'time_on_page'], 'landing_page_view');
};

const validateLandingCtaClickData = (data: LandingCtaClickData): boolean => {
  const requiredFields = ['cta_text', 'cta_position', 'destination_url', 'click_timestamp'];
  if (!validateRequiredFields(data as unknown as Record<string, unknown>, requiredFields, 'landing_cta_click')) return false;
  
  const validCtaTypes = ['primary', 'secondary', 'product'];
  if (!validCtaTypes.includes(data.cta_type)) {
    console.error('❌ cta_type inválido:', data.cta_type);
    return false;
  }
  
  return true;
};

const validateLandingVideoEngagementData = (data: LandingVideoEngagementData): boolean => {
  const requiredFields = ['video_id', 'video_title', 'action', 'progress_percentage', 'video_duration'];
  if (!validateRequiredFields(data as unknown as Record<string, unknown>, requiredFields, 'landing_video_engagement')) return false;
  
  const validActions = ['play', 'pause', 'complete', 'seek'];
  if (!validActions.includes(data.action)) {
    console.error('❌ action inválido:', data.action);
    return false;
  }
  
  return true;
};

const validateLandingScrollDepthData = (data: LandingScrollDepthData): boolean => {
  const requiredFields = ['scroll_depth', 'page_height', 'viewport_height', 'time_to_depth'];
  if (!validateRequiredFields(data as unknown as Record<string, unknown>, requiredFields, 'landing_scroll_depth')) return false;
  
  if (data.scroll_percentage < 0 || data.scroll_percentage > 100) {
    console.error('❌ scroll_percentage deve estar entre 0 e 100');
    return false;
  }
  
  return true;
};

// 1️⃣ Validação - Step 1
const validateStep1PageViewData = (data: Step1PageViewData): boolean => {
  const requiredFields = ['content_type', 'step_number', 'product_id', 'product_name', 'product_category'];
  if (!validateRequiredFields(data as unknown as Record<string, unknown>, requiredFields, 'step_1_page_view')) return false;
  
  if (data.step_number !== 1) {
    console.error('❌ step_number deve ser 1 para step_1_page_view');
    return false;
  }
  
  return true;
};

const validateStep1QuantitySelectedData = (data: Step1QuantitySelectedData): boolean => {
  const requiredFields = ['quantity_selected', 'price_per_unit', 'total_value', 'product_id'];
  return validateRequiredFields(data as unknown as Record<string, unknown>, requiredFields, 'step_1_quantity_selected');
};

const validateStep1NavigationData = (data: Step1NavigationData): boolean => {
  const requiredFields = ['navigation_type', 'destination', 'source_step', 'target_step'];
  if (!validateRequiredFields(data as unknown as Record<string, unknown>, requiredFields, 'step_1_navigation')) return false;
  
  const validActions = ['continue', 'back'];
  if (!validActions.includes(data.action)) {
    console.error('❌ action inválido:', data.action);
    return false;
  }
  
  return true;
};

// 2️⃣ Validação - Step 2
const validateStep2PageViewData = (data: Step2PageViewData): boolean => {
  const requiredFields = ['content_type', 'step_number', 'selected_quantity', 'cart_value', 'available_bumps'];
  if (!validateRequiredFields(data as unknown as Record<string, unknown>, requiredFields, 'step_2_page_view')) return false;
  
  if (data.step_number !== 2) {
    console.error('❌ step_number deve ser 2 para step_2_page_view');
    return false;
  }
  
  return true;
};

const validateStep2BumpInteractionData = (data: Step2BumpInteractionData): boolean => {
  const requiredFields = ['bump_id', 'bump_name', 'bump_price', 'action', 'bump_position'];
  if (!validateRequiredFields(data as unknown as Record<string, unknown>, requiredFields, 'step_2_bump_interaction')) return false;
  
  const validActions = ['add', 'remove'];
  if (!validActions.includes(data.action)) {
    console.error('❌ action inválido:', data.action);
    return false;
  }
  
  return true;
};

const validateStep2AddToCartData = (data: Step2AddToCartData): boolean => {
  const requiredFields = ['currency', 'value', 'items'];
  if (!validateRequiredFields(data as unknown as Record<string, unknown>, requiredFields, 'step_2_add_to_cart')) return false;
  
  if (data.currency !== 'BRL') {
    console.error('❌ currency deve ser BRL');
    return false;
  }
  
  return true;
};

// 3️⃣ Validação - Step 3
const validateStep3PageViewData = (data: Step3PageViewData): boolean => {
  const requiredFields = ['content_type', 'step_number', 'required_fields', 'cart_value'];
  if (!validateRequiredFields(data as unknown as Record<string, unknown>, requiredFields, 'step_3_page_view')) return false;
  
  if (data.step_number !== 3) {
    console.error('❌ step_number deve ser 3 para step_3_page_view');
    return false;
  }
  
  return true;
};

const validateStep3FormInteractionData = (data: Step3FormInteractionData): boolean => {
  const requiredFields = ['field_name', 'field_type', 'action', 'form_completion_percentage', 'validation_status'];
  if (!validateRequiredFields(data as unknown as Record<string, unknown>, requiredFields, 'step_3_form_interaction')) return false;
  
  const validFieldTypes = ['text', 'email', 'select', 'textarea'];
  if (!validFieldTypes.includes(data.field_type)) {
    console.error('❌ field_type inválido:', data.field_type);
    return false;
  }
  
  const validActions = ['focus', 'blur', 'change'];
  if (!validActions.includes(data.action)) {
    console.error('❌ action inválido:', data.action);
    return false;
  }
  
  return true;
};

const validateStep3FormSubmitData = (data: Step3FormSubmitData): boolean => {
  const requiredFields = ['submission_status', 'form_completion_time', 'fields_completed', 'validation_errors', 'children_count', 'contact_method'];
  if (!validateRequiredFields(data as unknown as Record<string, unknown>, requiredFields, 'step_3_form_submit')) return false;
  
  const validStatuses = ['success', 'error'];
  if (!validStatuses.includes(data.submission_status)) {
    console.error('❌ submission_status inválido:', data.submission_status);
    return false;
  }
  
  return true;
};

const validateStep3BeginCheckoutData = (data: Step3BeginCheckoutData): boolean => {
  const requiredFields = ['currency', 'value', 'checkout_method', 'funnel_completion_time', 'items'];
  if (!validateRequiredFields(data as unknown as Record<string, unknown>, requiredFields, 'step_3_begin_checkout')) return false;
  
  if (data.currency !== 'BRL') {
    console.error('❌ currency deve ser BRL');
    return false;
  }
  
  if (data.checkout_method !== 'cartpanda') {
    console.error('❌ checkout_method deve ser cartpanda');
    return false;
  }
  
  return true;
};

// 💳 Validação - Checkout
const validateCheckoutInitiatedData = (data: CheckoutInitiatedData): boolean => {
  const requiredFields = ['checkout_provider', 'redirect_url', 'order_value', 'redirect_time'];
  if (!validateRequiredFields(data as unknown as Record<string, unknown>, requiredFields, 'checkout_initiated')) return false;
  
  if (data.checkout_provider !== 'cartpanda') {
    console.error('❌ checkout_provider deve ser cartpanda');
    return false;
  }
  
  if (!data.redirect_url.startsWith('http')) {
    console.error('❌ redirect_url deve ser uma URL válida');
    return false;
  }
  
  return true;
};

// 🎉 Validação - Thank You
const validatePurchaseCompletedData = (data: PurchaseCompletedData): boolean => {
  const requiredFields = ['transaction_id', 'currency', 'value', 'order_id', 'customer_id', 'items', 'payment_method'];
  if (!validateRequiredFields(data as unknown as Record<string, unknown>, requiredFields, 'purchase_completed')) return false;
  
  if (data.currency !== 'BRL') {
    console.error('❌ currency deve ser BRL');
    return false;
  }
  
  return true;
};

const validateThankYouSocialShareData = (data: ThankYouSocialShareData): boolean => {
  const requiredFields = ['platform', 'share_type', 'order_value'];
  if (!validateRequiredFields(data as unknown as Record<string, unknown>, requiredFields, 'thank_you_social_share')) return false;
  
  const validPlatforms = ['whatsapp', 'facebook'];
  if (!validPlatforms.includes(data.platform)) {
    console.error('❌ platform inválido:', data.platform);
    return false;
  }
  
  return true;
};

// 🔧 Utilitário - Validação de Campos Obrigatórios
const validateRequiredFields = (data: Record<string, unknown>, requiredFields: string[], eventName: string): boolean => {
  const missingFields = requiredFields.filter(field => data[field] === undefined || data[field] === null);
  
  if (missingFields.length > 0) {
    console.error(`❌ Campos obrigatórios ausentes em ${eventName}:`, missingFields);
    return false;
  }
  
  return true;
};

// 📊 Validação de Prioridade
export const validateEventPriority = (priority: unknown): priority is EventPriority => {
  return typeof priority === 'string' && ['high', 'medium', 'low'].includes(priority);
};

// ⚙️ Validação de Configuração de Tracking
export const validateTrackingConfig = (config: TrackingConfig): boolean => {
  if (!config) {
    console.error('❌ Configuração de tracking é obrigatória');
    return false;
  }

  // Validar estrutura básica
  const requiredFields = ['platforms', 'debug', 'batch_size', 'batch_timeout', 'retry_attempts', 'consent_required'];
  const missingFields = requiredFields.filter(field => config[field as keyof TrackingConfig] === undefined);
  
  if (missingFields.length > 0) {
    console.error('❌ Campos obrigatórios ausentes na configuração:', missingFields);
    return false;
  }

  // Validar batch_timeout
  if (!config.batch_timeout.high || !config.batch_timeout.medium || !config.batch_timeout.low) {
    console.error('❌ batch_timeout deve conter high, medium e low');
    return false;
  }

  // Validar tipos
  if (typeof config.debug !== 'boolean') {
    console.error('❌ debug deve ser boolean');
    return false;
  }

  if (typeof config.batch_size !== 'number' || config.batch_size <= 0) {
    console.error('❌ batch_size deve ser um número positivo');
    return false;
  }

  return true;
};

// 🔒 Validação de Privacidade de Dados
export const validateDataPrivacy = (eventData: EventData): boolean => {
  // Verificar se não há dados pessoais sensíveis
  const dataString = JSON.stringify(eventData);
  
  // Padrões que podem indicar dados sensíveis
  const sensitivePatterns = [
    /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/, // CPF
    /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/, // CNPJ
    /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/, // Cartão de crédito
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email (parcial)
  ];

  for (const pattern of sensitivePatterns) {
    if (pattern.test(dataString)) {
      console.warn('⚠️ Possível dado sensível detectado nos dados do evento');
      return false;
    }
  }

  // Verificar campos específicos que não devem conter dados pessoais
  const restrictedFields = ['name', 'email', 'phone', 'address', 'document'];
  for (const field of restrictedFields) {
    if (dataString.toLowerCase().includes(field)) {
      console.warn(`⚠️ Campo restrito detectado: ${field}`);
    }
  }

  return true;
};

const validators = {
  validateEvent,
  validatePageContext,
  validateUserData,
  validateEventName,
  validateEventData,
  validateEventPriority,
  validateTrackingConfig,
  validateDataPrivacy
};

export default validators;