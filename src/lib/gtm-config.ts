// Configurações do Google Tag Manager para Facebook e TikTok Ads

export interface GTMTagConfig {
  tagId: string;
  tagName: string;
  tagType: string;
  triggers: string[];
  parameters: Record<string, any>;
}

export interface GTMTriggerConfig {
  triggerId: string;
  triggerName: string;
  triggerType: string;
  conditions: Record<string, any>;
}

// Configurações de triggers para eventos personalizados
export const GTM_TRIGGERS: GTMTriggerConfig[] = [
  {
    triggerId: 'pageview',
    triggerName: 'All Pages',
    triggerType: 'pageview',
    conditions: {}
  },
  {
    triggerId: 'cta_click_trigger',
    triggerName: 'CTA Click Trigger',
    triggerType: 'customEvent',
    conditions: {
      eventName: 'cta_click'
    }
  },
  {
    triggerId: 'personalization_step_trigger',
    triggerName: 'Personalization Step Trigger',
    triggerType: 'customEvent',
    conditions: {
      eventName: 'personalization_step'
    }
  },
  {
    triggerId: 'form_interaction_trigger',
    triggerName: 'Form Interaction Trigger',
    triggerType: 'customEvent',
    conditions: {
      eventName: 'form_interaction'
    }
  },
  {
    triggerId: 'purchase_trigger',
    triggerName: 'Purchase Trigger',
    triggerType: 'customEvent',
    conditions: {
      eventName: 'purchase'
    }
  },
  {
    triggerId: 'lead_trigger',
    triggerName: 'Lead Generation Trigger',
    triggerType: 'customEvent',
    conditions: {
      eventName: 'generate_lead'
    }
  },
  {
    triggerId: 'utm_capture_trigger',
    triggerName: 'UTM Capture Trigger',
    triggerType: 'customEvent',
    conditions: {
      eventName: 'utm_captured'
    }
  },
  // Enhanced Ecommerce Triggers
  {
    triggerId: 'view_item_trigger',
    triggerName: 'View Item Trigger',
    triggerType: 'customEvent',
    conditions: {
      eventName: 'view_item'
    }
  },
  {
    triggerId: 'add_to_cart_trigger',
    triggerName: 'Add to Cart Trigger',
    triggerType: 'customEvent',
    conditions: {
      eventName: 'add_to_cart'
    }
  },
  {
    triggerId: 'remove_from_cart_trigger',
    triggerName: 'Remove from Cart Trigger',
    triggerType: 'customEvent',
    conditions: {
      eventName: 'remove_from_cart'
    }
  },
  {
    triggerId: 'view_item_list_trigger',
    triggerName: 'View Item List Trigger',
    triggerType: 'customEvent',
    conditions: {
      eventName: 'view_item_list'
    }
  },
  {
    triggerId: 'select_item_trigger',
    triggerName: 'Select Item Trigger',
    triggerType: 'customEvent',
    conditions: {
      eventName: 'select_item'
    }
  },
  {
    triggerId: 'begin_checkout_trigger',
    triggerName: 'Begin Checkout Trigger',
    triggerType: 'customEvent',
    conditions: {
      eventName: 'begin_checkout'
    }
  }
];

// Configurações de tags do Facebook Pixel
export const FACEBOOK_TAGS: GTMTagConfig[] = [
  {
    tagId: 'facebook_base_pixel',
    tagName: 'Facebook Pixel - Base Code',
    tagType: 'facebookPixel',
    triggers: ['pageview'],
    parameters: {
      pixelId: '{{Facebook Pixel ID}}',
      enhancedMatching: true,
      testEventCode: '{{Facebook Test Event Code}}'
    }
  },

  {
    tagId: 'facebook_viewcontent',
    tagName: 'Facebook Pixel - ViewContent',
    tagType: 'facebookPixel',
    triggers: ['cta_click_trigger'],
    parameters: {
      pixelId: '{{Facebook Pixel ID}}',
      eventName: 'ViewContent',
      contentType: 'product',
      contentIds: ['{{CTA Name}}'],
      enhancedMatching: true
    }
  },
  {
    tagId: 'facebook_initiatecheckout',
    tagName: 'Facebook Pixel - InitiateCheckout',
    tagType: 'facebookPixel',
    triggers: ['personalization_step_trigger'],
    parameters: {
      pixelId: '{{Facebook Pixel ID}}',
      eventName: 'InitiateCheckout',
      contentType: 'product',
      numItems: 1,
      enhancedMatching: true
    }
  },
  {
    tagId: 'facebook_purchase',
    tagName: 'Facebook Pixel - Purchase',
    tagType: 'facebookPixel',
    triggers: ['purchase_trigger'],
    parameters: {
      pixelId: '{{Facebook Pixel ID}}',
      eventName: 'Purchase',
      value: '{{Purchase Value}}',
      currency: 'BRL',
      contentType: 'product',
      contentIds: ['{{Product ID}}'],
      enhancedMatching: true
    }
  },
  {
    tagId: 'facebook_lead',
    tagName: 'Facebook Pixel - Lead',
    tagType: 'facebookPixel',
    triggers: ['lead_trigger', 'form_interaction_trigger'],
    parameters: {
      pixelId: '{{Facebook Pixel ID}}',
      eventName: 'Lead',
      value: '{{Lead Value}}',
      currency: 'BRL',
      enhancedMatching: true
    }
  }
];

// Configurações de tags do TikTok Pixel
export const TIKTOK_TAGS: GTMTagConfig[] = [
  {
    tagId: 'tiktok_base_pixel',
    tagName: 'TikTok Pixel - Base Code',
    tagType: 'tiktokPixel',
    triggers: ['pageview'],
    parameters: {
      pixelId: '{{TikTok Pixel ID}}',
      enhancedMatching: true
    }
  },

  {
    tagId: 'tiktok_viewcontent',
    tagName: 'TikTok Pixel - ViewContent',
    tagType: 'tiktokPixel',
    triggers: ['cta_click_trigger'],
    parameters: {
      pixelId: '{{TikTok Pixel ID}}',
      eventName: 'ViewContent',
      contentType: 'product',
      contentId: '{{CTA Name}}'
    }
  },
  {
    tagId: 'tiktok_initiatecheckout',
    tagName: 'TikTok Pixel - InitiateCheckout',
    tagType: 'tiktokPixel',
    triggers: ['personalization_step_trigger'],
    parameters: {
      pixelId: '{{TikTok Pixel ID}}',
      eventName: 'InitiateCheckout',
      contentType: 'product'
    }
  },
  {
    tagId: 'tiktok_completepayment',
    tagName: 'TikTok Pixel - CompletePayment',
    tagType: 'tiktokPixel',
    triggers: ['purchase_trigger'],
    parameters: {
      pixelId: '{{TikTok Pixel ID}}',
      eventName: 'CompletePayment',
      value: '{{Purchase Value}}',
      currency: 'BRL',
      contentType: 'product',
      contentId: '{{Product ID}}'
    }
  },
  {
    tagId: 'tiktok_submitform',
    tagName: 'TikTok Pixel - SubmitForm',
    tagType: 'tiktokPixel',
    triggers: ['lead_trigger', 'form_interaction_trigger'],
    parameters: {
      pixelId: '{{TikTok Pixel ID}}',
      eventName: 'SubmitForm'
    }
  }
];

// Configurações de tags do Google Analytics 4
export const GA4_TAGS: GTMTagConfig[] = [
  {
    tagId: 'ga4_config',
    tagName: 'GA4 Configuration',
    tagType: 'ga4Config',
    triggers: ['pageview'],
    parameters: {
      measurementId: '{{GA4 Measurement ID}}',
      sendPageView: true,
      enhancedConversions: true,
      enhancedEcommerce: true
    }
  },
  {
    tagId: 'ga4_pageview',
    tagName: 'GA4 - Page View',
    tagType: 'ga4Event',
    triggers: ['pageview'],
    parameters: {
      measurementIdReference: 'ga4_config',
      eventName: 'page_view'
    }
  },
  {
    tagId: 'ga4_cta_click',
    tagName: 'GA4 - CTA Click',
    tagType: 'ga4Event',
    triggers: ['cta_click_trigger'],
    parameters: {
      measurementIdReference: 'ga4_config',
      eventName: 'select_promotion',
      eventParameters: [
        { name: 'promotion_id', value: '{{CTA Name}}' },
        { name: 'promotion_name', value: '{{CTA Name}}' },
        { name: 'creative_name', value: '{{CTA Location}}' },
        { name: 'creative_slot', value: '{{CTA Type}}' }
      ]
    }
  },
  {
    tagId: 'ga4_personalization_step',
    tagName: 'GA4 - Personalization Step',
    tagType: 'ga4Event',
    triggers: ['personalization_step_trigger'],
    parameters: {
      measurementIdReference: 'ga4_config',
      eventName: 'begin_checkout',
      eventParameters: [
        { name: 'currency', value: 'BRL' },
        { name: 'value', value: '1' }
      ]
    }
  },
  {
    tagId: 'ga4_purchase',
    tagName: 'GA4 - Purchase',
    tagType: 'ga4Event',
    triggers: ['purchase_trigger'],
    parameters: {
      measurementIdReference: 'ga4_config',
      eventName: 'purchase',
      eventParameters: [
        { name: 'transaction_id', value: '{{Transaction ID}}' },
        { name: 'value', value: '{{Purchase Value}}' },
        { name: 'currency', value: 'BRL' },
        { name: 'items', value: '{{Purchase Items}}' }
      ]
    }
  },
  {
    tagId: 'ga4_lead',
    tagName: 'GA4 - Generate Lead',
    tagType: 'ga4Event',
    triggers: ['lead_trigger'],
    parameters: {
      measurementIdReference: 'ga4_config',
      eventName: 'generate_lead',
      eventParameters: [
        { name: 'value', value: '{{Lead Value}}' },
        { name: 'currency', value: 'BRL' }
      ]
    }
  },
  {
    tagId: 'ga4_form_interaction',
    tagName: 'GA4 - Form Interaction',
    tagType: 'ga4Event',
    triggers: ['form_interaction_trigger'],
    parameters: {
      measurementIdReference: 'ga4_config',
      eventName: 'form_start',
      eventParameters: [
        { name: 'form_id', value: '{{Form ID}}' },
        { name: 'form_name', value: '{{Form Name}}' },
        { name: 'form_destination', value: '{{Form Destination}}' }
      ]
    }
  },
  // Enhanced Ecommerce Events
  {
    tagId: 'ga4_view_item',
    tagName: 'GA4 - View Item',
    tagType: 'ga4Event',
    triggers: ['view_item_trigger'],
    parameters: {
      measurementIdReference: 'ga4_config',
      eventName: 'view_item',
      eventParameters: [
        { name: 'currency', value: 'BRL' },
        { name: 'value', value: '{{Product Value}}' },
        { name: 'items', value: '{{Product Items}}' }
      ]
    }
  },
  {
    tagId: 'ga4_add_to_cart',
    tagName: 'GA4 - Add to Cart',
    tagType: 'ga4Event',
    triggers: ['add_to_cart_trigger'],
    parameters: {
      measurementIdReference: 'ga4_config',
      eventName: 'add_to_cart',
      eventParameters: [
        { name: 'currency', value: 'BRL' },
        { name: 'value', value: '{{Product Value}}' },
        { name: 'items', value: '{{Product Items}}' }
      ]
    }
  },
  {
    tagId: 'ga4_view_item_list',
    tagName: 'GA4 - View Item List',
    tagType: 'ga4Event',
    triggers: ['view_item_list_trigger'],
    parameters: {
      measurementIdReference: 'ga4_config',
      eventName: 'view_item_list',
      eventParameters: [
        { name: 'item_list_id', value: 'product_catalog' },
        { name: 'item_list_name', value: 'Product Catalog' },
        { name: 'items', value: '{{Product Items}}' }
      ]
    }
  },
  {
    tagId: 'ga4_select_item',
    tagName: 'GA4 - Select Item',
    tagType: 'ga4Event',
    triggers: ['select_item_trigger'],
    parameters: {
      measurementIdReference: 'ga4_config',
      eventName: 'select_item',
      eventParameters: [
        { name: 'item_list_id', value: 'product_catalog' },
        { name: 'item_list_name', value: 'Product Catalog' },
        { name: 'items', value: '{{Product Items}}' }
      ]
    }
  },
  {
    tagId: 'ga4_remove_from_cart',
    tagName: 'GA4 - Remove from Cart',
    tagType: 'ga4Event',
    triggers: ['remove_from_cart_trigger'],
    parameters: {
      measurementIdReference: 'ga4_config',
      eventName: 'remove_from_cart',
      eventParameters: [
        { name: 'currency', value: 'BRL' },
        { name: 'value', value: '{{Product Value}}' },
        { name: 'items', value: '{{Product Items}}' }
      ]
    }
  },
  {
    tagId: 'ga4_begin_checkout',
    tagName: 'GA4 - Begin Checkout',
    tagType: 'ga4Event',
    triggers: ['begin_checkout_trigger'],
    parameters: {
      measurementIdReference: 'ga4_config',
      eventName: 'begin_checkout',
      eventParameters: [
        { name: 'currency', value: 'BRL' },
        { name: 'value', value: '{{Product Value}}' },
        { name: 'items', value: '{{Product Items}}' }
      ]
    }
  },
  // Custom Events
  {
    tagId: 'ga4_scroll_engagement',
    tagName: 'GA4 - Scroll Engagement',
    tagType: 'ga4Event',
    triggers: ['pageview'],
    parameters: {
      measurementIdReference: 'ga4_config',
      eventName: 'scroll',
      eventParameters: [
        { name: 'engagement_type', value: 'scroll' },
        { name: 'scroll_depth', value: '{{Scroll Depth}}' }
      ]
    }
  },
  {
    tagId: 'ga4_time_engagement',
    tagName: 'GA4 - Time Engagement',
    tagType: 'ga4Event',
    triggers: ['pageview'],
    parameters: {
      measurementIdReference: 'ga4_config',
      eventName: 'user_engagement',
      eventParameters: [
        { name: 'engagement_time_msec', value: '{{Time on Page}}' },
        { name: 'engagement_type', value: 'time' }
      ]
    }
  },
  {
    tagId: 'ga4_video_engagement',
    tagName: 'GA4 - Video Engagement',
    tagType: 'ga4Event',
    triggers: ['cta_click_trigger'],
    parameters: {
      measurementIdReference: 'ga4_config',
      eventName: 'video_play',
      eventParameters: [
        { name: 'video_title', value: '{{Video Title}}' },
        { name: 'video_provider', value: 'youtube' },
        { name: 'video_current_time', value: '{{Video Progress}}' }
      ]
    }
  },
  {
    tagId: 'ga4_search',
    tagName: 'GA4 - Search',
    tagType: 'ga4Event',
    triggers: ['form_interaction_trigger'],
    parameters: {
      measurementIdReference: 'ga4_config',
      eventName: 'search',
      eventParameters: [
        { name: 'search_term', value: '{{Search Term}}' },
        { name: 'search_results', value: '{{Search Results}}' }
      ]
    }
  },
  {
    tagId: 'ga4_share',
    tagName: 'GA4 - Share',
    tagType: 'ga4Event',
    triggers: ['cta_click_trigger'],
    parameters: {
      measurementIdReference: 'ga4_config',
      eventName: 'share',
      eventParameters: [
        { name: 'content_type', value: '{{Content Type}}' },
        { name: 'content_id', value: '{{Content ID}}' },
        { name: 'method', value: '{{Share Method}}' }
      ]
    }
  },
  {
    tagId: 'ga4_exception',
    tagName: 'GA4 - Exception',
    tagType: 'ga4Event',
    triggers: ['pageview'],
    parameters: {
      measurementIdReference: 'ga4_config',
      eventName: 'exception',
      eventParameters: [
        { name: 'description', value: '{{Error Message}}' },
        { name: 'fatal', value: 'false' }
      ]
    }
  },
  {
    tagId: 'ga4_personalization_complete',
    tagName: 'GA4 - Personalization Complete',
    tagType: 'ga4Event',
    triggers: ['personalization_step_trigger'],
    parameters: {
      measurementIdReference: 'ga4_config',
      eventName: 'personalization_complete',
      eventParameters: [
        { name: 'personalization_type', value: 'christmas_card' },
        { name: 'steps_completed', value: '{{Steps Completed}}' },
        { name: 'time_spent', value: '{{Time Spent}}' }
      ]
    }
  },
  // Conversion Events
  {
    tagId: 'ga4_conversion_purchase',
    tagName: 'GA4 - Conversion Purchase',
    tagType: 'ga4Event',
    triggers: ['purchase_trigger'],
    parameters: {
      measurementIdReference: 'ga4_config',
      eventName: 'purchase',
      eventParameters: [
        { name: 'transaction_id', value: '{{Transaction ID}}' },
        { name: 'value', value: '{{Purchase Value}}' },
        { name: 'currency', value: 'BRL' },
        { name: 'items', value: '{{Purchase Items}}' },
        { name: 'conversion_label', value: 'purchase_conversion' }
      ]
    }
  },
  {
    tagId: 'ga4_conversion_lead',
    tagName: 'GA4 - Conversion Lead',
    tagType: 'ga4Event',
    triggers: ['lead_trigger'],
    parameters: {
      measurementIdReference: 'ga4_config',
      eventName: 'generate_lead',
      eventParameters: [
        { name: 'value', value: '{{Lead Value}}' },
        { name: 'currency', value: 'BRL' },
        { name: 'conversion_label', value: 'lead_conversion' },
        { name: 'lead_source', value: '{{Lead Source}}' }
      ]
    }
  },
  {
    tagId: 'ga4_conversion_signup',
    tagName: 'GA4 - Conversion Sign Up',
    tagType: 'ga4Event',
    triggers: ['form_interaction_trigger'],
    parameters: {
      measurementIdReference: 'ga4_config',
      eventName: 'sign_up',
      eventParameters: [
        { name: 'method', value: 'email' },
        { name: 'conversion_label', value: 'signup_conversion' }
      ]
    }
  },
  {
    tagId: 'ga4_conversion_personalization',
    tagName: 'GA4 - Conversion Personalization',
    tagType: 'ga4Event',
    triggers: ['personalization_step_trigger'],
    parameters: {
      measurementIdReference: 'ga4_config',
      eventName: 'personalization_conversion',
      eventParameters: [
        { name: 'value', value: '1' },
        { name: 'currency', value: 'BRL' },
        { name: 'conversion_label', value: 'personalization_conversion' },
        { name: 'personalization_type', value: 'christmas_card' }
      ]
    }
  },
  {
    tagId: 'ga4_conversion_engagement',
    tagName: 'GA4 - Conversion Engagement',
    tagType: 'ga4Event',
    triggers: ['pageview'],
    parameters: {
      measurementIdReference: 'ga4_config',
      eventName: 'engagement_conversion',
      eventParameters: [
        { name: 'engagement_time_msec', value: '{{Time on Page}}' },
        { name: 'conversion_label', value: 'engagement_conversion' }
      ]
    }
  }
];

// Função para obter variáveis do GTM com valores atualizados
export function getGTMVariables() {
  return [
    {
      variableId: 'facebook_pixel_id',
      variableName: 'Facebook Pixel ID',
      variableType: 'c',
      value: process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID
    },
    {
      variableId: 'facebook_test_event_code',
      variableName: 'Facebook Test Event Code',
      variableType: 'c',
      value: process.env.FACEBOOK_TEST_EVENT_CODE
    },
    {
      variableId: 'tiktok_pixel_id',
      variableName: 'TikTok Pixel ID',
      variableType: 'c',
      value: process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID
    },
    {
      variableId: 'ga4_measurement_id',
      variableName: 'GA4 Measurement ID',
      variableType: 'c',
      value: process.env.NEXT_PUBLIC_GA4_ID
    },
    {
      variableId: 'cta_name',
      variableName: 'CTA Name',
      variableType: 'v',
      dataLayerVariable: 'cta_name'
    },
    {
      variableId: 'cta_location',
      variableName: 'CTA Location',
      variableType: 'v',
      dataLayerVariable: 'cta_location'
    },
    {
      variableId: 'cta_type',
      variableName: 'CTA Type',
      variableType: 'v',
      dataLayerVariable: 'cta_type'
    },
    {
      variableId: 'step_name',
      variableName: 'Step Name',
      variableType: 'v',
      dataLayerVariable: 'step_name'
    },
    {
      variableId: 'step_number',
      variableName: 'Step Number',
      variableType: 'v',
      dataLayerVariable: 'step_number'
    },
    {
      variableId: 'purchase_value',
      variableName: 'Purchase Value',
      variableType: 'v',
      dataLayerVariable: 'value'
    },
    {
      variableId: 'transaction_id',
      variableName: 'Transaction ID',
      variableType: 'v',
      dataLayerVariable: 'transaction_id'
    },
    {
      variableId: 'utm_source',
      variableName: 'UTM Source',
      variableType: 'v',
      dataLayerVariable: 'utm_source'
    },
    {
      variableId: 'utm_medium',
      variableName: 'UTM Medium',
      variableType: 'v',
      dataLayerVariable: 'utm_medium'
    },
    {
      variableId: 'utm_campaign',
      variableName: 'UTM Campaign',
      variableType: 'v',
      dataLayerVariable: 'utm_campaign'
    },
    {
      variableId: 'form_id',
      variableName: 'Form ID',
      variableType: 'v',
      dataLayerVariable: 'form_id'
    },
    {
      variableId: 'form_name',
      variableName: 'Form Name',
      variableType: 'v',
      dataLayerVariable: 'form_name'
    },
    {
      variableId: 'form_destination',
      variableName: 'Form Destination',
      variableType: 'v',
      dataLayerVariable: 'form_destination'
    },
    {
      variableId: 'product_id',
      variableName: 'Product ID',
      variableType: 'v',
      dataLayerVariable: 'product_id'
    },
    {
      variableId: 'purchase_items',
      variableName: 'Purchase Items',
      variableType: 'v',
      dataLayerVariable: 'items'
    },
    {
      variableId: 'lead_value',
      variableName: 'Lead Value',
      variableType: 'v',
      dataLayerVariable: 'lead_value'
    },
    // Enhanced Ecommerce Variables
    {
      variableId: 'product_value',
      variableName: 'Product Value',
      variableType: 'v',
      dataLayerVariable: 'product_value'
    },
    {
      variableId: 'product_items',
      variableName: 'Product Items',
      variableType: 'v',
      dataLayerVariable: 'ecommerce.items'
    },
    {
      variableId: 'item_id',
      variableName: 'Item ID',
      variableType: 'v',
      dataLayerVariable: 'item_id'
    },
    {
      variableId: 'item_name',
      variableName: 'Item Name',
      variableType: 'v',
      dataLayerVariable: 'item_name'
    },
    {
      variableId: 'item_category',
      variableName: 'Item Category',
      variableType: 'v',
      dataLayerVariable: 'item_category'
    },
    {
      variableId: 'item_variant',
      variableName: 'Item Variant',
      variableType: 'v',
      dataLayerVariable: 'item_variant'
    },
    {
      variableId: 'item_brand',
      variableName: 'Item Brand',
      variableType: 'v',
      dataLayerVariable: 'item_brand'
    },
    {
      variableId: 'quantity',
      variableName: 'Quantity',
      variableType: 'v',
      dataLayerVariable: 'quantity'
    },
    {
      variableId: 'price',
      variableName: 'Price',
      variableType: 'v',
      dataLayerVariable: 'price'
    },
    // Custom Events Variables
    {
      variableId: 'scroll_depth',
      variableName: 'Scroll Depth',
      variableType: 'v',
      dataLayerVariable: 'scroll_depth'
    },
    {
      variableId: 'time_on_page',
      variableName: 'Time on Page',
      variableType: 'v',
      dataLayerVariable: 'time_seconds'
    },
    {
      variableId: 'video_title',
      variableName: 'Video Title',
      variableType: 'v',
      dataLayerVariable: 'video_title'
    },
    {
      variableId: 'video_progress',
      variableName: 'Video Progress',
      variableType: 'v',
      dataLayerVariable: 'video_progress'
    },
    {
      variableId: 'search_term',
      variableName: 'Search Term',
      variableType: 'v',
      dataLayerVariable: 'search_term'
    },
    {
      variableId: 'search_results',
      variableName: 'Search Results',
      variableType: 'v',
      dataLayerVariable: 'search_results'
    },
    {
      variableId: 'content_type',
      variableName: 'Content Type',
      variableType: 'v',
      dataLayerVariable: 'content_type'
    },
    {
      variableId: 'content_id',
      variableName: 'Content ID',
      variableType: 'v',
      dataLayerVariable: 'content_id'
    },
    {
      variableId: 'share_method',
      variableName: 'Share Method',
      variableType: 'v',
      dataLayerVariable: 'method'
    },
    {
      variableId: 'error_message',
      variableName: 'Error Message',
      variableType: 'v',
      dataLayerVariable: 'error_message'
    },
    {
      variableId: 'steps_completed',
      variableName: 'Steps Completed',
      variableType: 'v',
      dataLayerVariable: 'steps_completed'
    },
    {
      variableId: 'time_spent',
      variableName: 'Time Spent',
      variableType: 'v',
      dataLayerVariable: 'time_spent'
    },
    // Conversion Variables
    {
      variableId: 'lead_source',
      variableName: 'Lead Source',
      variableType: 'v',
      dataLayerVariable: 'lead_source'
    }
  ];
}

// Manter compatibilidade com código existente
export const GTM_VARIABLES = getGTMVariables();

// Função para gerar configuração completa do GTM
export function generateGTMConfig() {
  return {
    triggers: GTM_TRIGGERS,
    tags: [...FACEBOOK_TAGS, ...TIKTOK_TAGS, ...GA4_TAGS],
    variables: GTM_VARIABLES,
    metadata: {
      version: '1.0.0',
      created: new Date().toISOString(),
      description: 'Configuração completa do GTM para tracking de Facebook, TikTok e Google Ads',
      environment: process.env.NODE_ENV
    }
  };
}

// Função para validar configuração
export function validateGTMConfig() {
  const errors: string[] = [];
  
  if (!process.env.NEXT_PUBLIC_GTM_ID) {
    errors.push('NEXT_PUBLIC_GTM_ID não configurado');
  }
  
  if (!process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID) {
    errors.push('NEXT_PUBLIC_FACEBOOK_PIXEL_ID não configurado');
  }
  
  if (!process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID) {
    errors.push('NEXT_PUBLIC_TIKTOK_PIXEL_ID não configurado');
  }
  
  if (!process.env.NEXT_PUBLIC_GA4_ID) {
    errors.push('NEXT_PUBLIC_GA4_ID não configurado');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    config: errors.length === 0 ? generateGTMConfig() : null
  };
}