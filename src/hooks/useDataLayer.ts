'use client';

import { useCallback } from 'react';

// Tipos para os eventos de tracking
export interface BaseEvent {
  event: string;
  timestamp?: number;
  user_id?: string;
  session_id?: string;
}

export interface PageViewEvent extends BaseEvent {
  event: 'page_view';
  page_title: string;
  page_location: string;
  page_path: string;
  step_number?: number;
  step_name?: string;
}

export interface StepProgressEvent extends BaseEvent {
  event: 'step_progress';
  step_from: number;
  step_to: number;
  step_name: string;
  progress_percentage: number;
}

export interface FormInteractionEvent extends BaseEvent {
  event: 'form_interaction';
  form_name: string;
  field_name: string;
  interaction_type: 'focus' | 'blur' | 'change' | 'submit';
  step_number: number;
}

export interface ProductInteractionEvent extends BaseEvent {
  event: 'product_interaction';
  interaction_type: 'add_to_cart' | 'remove_from_cart' | 'view_item';
  item_id: string;
  item_name: string;
  item_category: string;
  price: number;
  quantity: number;
}

export interface CheckoutEvent extends BaseEvent {
  event: 'begin_checkout';
  currency: string;
  value: number;
  items: Array<{
    item_id: string;
    item_name: string;
    item_category: string;
    price: number;
    quantity: number;
  }>;
  checkout_step: number;
  payment_type?: string;
}

export interface CustomEvent extends BaseEvent {
  event: string;
  [key: string]: unknown;
}

export type DataLayerEvent = 
  | PageViewEvent 
  | StepProgressEvent 
  | FormInteractionEvent 
  | ProductInteractionEvent 
  | CheckoutEvent 
  | CustomEvent;

export const useDataLayer = () => {
  // Inicializar dataLayer se não existir
  const initializeDataLayer = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || [];
    }
  }, []);

  // Função principal para enviar eventos
  const pushEvent = useCallback((event: DataLayerEvent) => {
    if (typeof window === 'undefined') return;

    initializeDataLayer();

    // Adicionar timestamp se não fornecido
    const eventWithTimestamp = {
      ...event,
      timestamp: event.timestamp || Date.now(),
    };

    // Push para dataLayer (garantindo que existe após inicialização)
    if (window.dataLayer) {
      window.dataLayer.push(eventWithTimestamp);
    }

    // Log para desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 DataLayer Event:', eventWithTimestamp);
    }
  }, [initializeDataLayer]);

  // Eventos específicos para facilitar o uso
  const trackPageView = useCallback((params: {
    pageTitle: string;
    pagePath: string;
    stepNumber?: number;
    stepName?: string;
  }) => {
    pushEvent({
      event: 'page_view',
      page_title: params.pageTitle,
      page_location: window.location.href,
      page_path: params.pagePath,
      step_number: params.stepNumber,
      step_name: params.stepName,
    });
  }, [pushEvent]);

  const trackStepProgress = useCallback((params: {
    stepFrom: number;
    stepTo: number;
    stepName: string;
  }) => {
    const progressPercentage = (params.stepTo / 3) * 100; // Assumindo 3 steps total
    
    pushEvent({
      event: 'step_progress',
      step_from: params.stepFrom,
      step_to: params.stepTo,
      step_name: params.stepName,
      progress_percentage: progressPercentage,
    });
  }, [pushEvent]);

  const trackFormInteraction = useCallback((params: {
    formName: string;
    fieldName: string;
    interactionType: 'focus' | 'blur' | 'change' | 'submit';
    stepNumber: number;
  }) => {
    pushEvent({
      event: 'form_interaction',
      form_name: params.formName,
      field_name: params.fieldName,
      interaction_type: params.interactionType,
      step_number: params.stepNumber,
    });
  }, [pushEvent]);

  const trackProductInteraction = useCallback((params: {
    interactionType: 'add_to_cart' | 'remove_from_cart' | 'view_item';
    itemId: string;
    itemName: string;
    itemCategory: string;
    price: number;
    quantity: number;
  }) => {
    pushEvent({
      event: 'product_interaction',
      interaction_type: params.interactionType,
      item_id: params.itemId,
      item_name: params.itemName,
      item_category: params.itemCategory,
      price: params.price,
      quantity: params.quantity,
    });
  }, [pushEvent]);

  const trackBeginCheckout = useCallback((params: {
    currency: string;
    value: number;
    items: Array<{
      item_id: string;
      item_name: string;
      item_category: string;
      price: number;
      quantity: number;
    }>;
    checkoutStep: number;
    paymentType?: string;
  }) => {
    pushEvent({
      event: 'begin_checkout',
      currency: params.currency,
      value: params.value,
      items: params.items,
      checkout_step: params.checkoutStep,
      payment_type: params.paymentType,
    });
  }, [pushEvent]);

  const trackCustomEvent = useCallback((eventName: string, parameters: Record<string, unknown> = {}) => {
    pushEvent({
      event: eventName,
      ...parameters,
    });
  }, [pushEvent]);

  return {
    // Função principal
    pushEvent,
    
    // Eventos específicos
    trackPageView,
    trackStepProgress,
    trackFormInteraction,
    trackProductInteraction,
    trackBeginCheckout,
    trackCustomEvent,
    
    // Utilitários
    initializeDataLayer,
  };
};