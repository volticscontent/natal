'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useGTM } from './GTMManager';

interface PersonalizationStep {
  stepName: string;
  stepNumber: number;
  stepData?: Record<string, any>;
  isCompleted?: boolean;
  timeSpent?: number;
}

interface PersonalizationTrackerProps {
  children: React.ReactNode;
  stepName?: string;
  stepNumber?: number;
  autoTrack?: boolean;
}

export default function PersonalizationTracker({ 
  children, 
  stepName, 
  stepNumber, 
  autoTrack = true 
}: PersonalizationTrackerProps) {
  const { trackPersonalizationStep, pushEvent } = useGTM();
  const stepStartTime = useRef<number>(Date.now());
  const hasTrackedEntry = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Função para trackear entrada no step
  const trackStepEntry = useCallback(() => {
    if (!stepName || !stepNumber || hasTrackedEntry.current) return;

    hasTrackedEntry.current = true;
    stepStartTime.current = Date.now();

    trackPersonalizationStep(stepName, stepNumber, {
      action: 'step_entered',
      timestamp: new Date().toISOString()
    });

    // Evento detalhado para GTM
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: 'personalization_step_entered',
        step_name: stepName,
        step_number: stepNumber,
        step_category: 'personalization',
        step_action: 'entered',
        page_location: window.location.href,
        timestamp: new Date().toISOString()
      });
    }
  }, [stepName, stepNumber, trackPersonalizationStep, pushEvent]);

  // Função para trackear saída do step
  const trackStepExit = useCallback((completed: boolean = false) => {
    if (!stepName || !stepNumber || !hasTrackedEntry.current) return;

    const timeSpent = Math.round((Date.now() - stepStartTime.current) / 1000);

    trackPersonalizationStep(stepName, stepNumber, {
      action: completed ? 'step_completed' : 'step_exited',
      time_spent: timeSpent,
      timestamp: new Date().toISOString()
    });

    // Evento detalhado para GTM
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: 'personalization_step_exited',
        step_name: stepName,
        step_number: stepNumber,
        step_category: 'personalization',
        step_action: completed ? 'completed' : 'exited',
        step_time_spent: timeSpent,
        step_completion_rate: completed ? 100 : 0,
        page_location: window.location.href,
        timestamp: new Date().toISOString()
      });
    }
  }, [stepName, stepNumber, trackPersonalizationStep, pushEvent]);

  // Função para trackear interações dentro do step
  const trackStepInteraction = useCallback((interactionType: string, interactionData: Record<string, any> = {}) => {
    if (!stepName || !stepNumber) return;

    const timeInStep = Math.round((Date.now() - stepStartTime.current) / 1000);

    trackPersonalizationStep(stepName, stepNumber, {
      action: 'step_interaction',
      interaction_type: interactionType,
      time_in_step: timeInStep,
      ...interactionData,
      timestamp: new Date().toISOString()
    });

    // Evento detalhado para GTM
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: 'personalization_step_interaction',
        step_name: stepName,
        step_number: stepNumber,
        step_category: 'personalization',
        interaction_type: interactionType,
        time_in_step: timeInStep,
        ...interactionData,
        page_location: window.location.href,
        timestamp: new Date().toISOString()
      });
    }
  }, [stepName, stepNumber, trackPersonalizationStep, pushEvent]);

  // Auto-tracking de interações
  useEffect(() => {
    if (!autoTrack || !containerRef.current) return;

    const container = containerRef.current;

    // Trackear cliques em elementos de personalização
    const handleClick = (event: Event) => {
      const target = event.target as HTMLElement;
      
      // Identificar elementos de personalização
      const personalizationSelectors = [
        '[data-personalization]',
        '[data-step]',
        '.personalization-option',
        '.step-option',
        'input[type="radio"]',
        'input[type="checkbox"]',
        'select',
        '.option-card',
        '.choice-button'
      ];

      const isPersonalizationElement = personalizationSelectors.some(selector => {
        return target.matches(selector) || target.closest(selector);
      });

      if (isPersonalizationElement) {
        const element = personalizationSelectors.reduce((found, selector) => {
          return found || target.closest(selector);
        }, null as Element | null) || target;

        const optionValue = element.getAttribute('value') || 
                           element.getAttribute('data-value') || 
                           element.textContent?.trim() || 
                           'unknown';

        const optionType = element.tagName.toLowerCase();
        const optionCategory = element.getAttribute('data-category') || 
                              element.getAttribute('data-personalization') || 
                              'general';

        trackStepInteraction('option_selected', {
          option_value: optionValue,
          option_type: optionType,
          option_category: optionCategory,
          element_id: element.id,
          element_classes: element.className
        });
      }
    };

    // Trackear mudanças em inputs
    const handleChange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      
      if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
        const fieldName = target.name || target.id || 'unnamed_field';
        const fieldValue = target.type === 'checkbox' ? target.checked : target.value;
        const fieldType = target.type || target.tagName.toLowerCase();

        trackStepInteraction('field_changed', {
          field_name: fieldName,
          field_value: fieldType === 'password' ? '[HIDDEN]' : fieldValue,
          field_type: fieldType
        });
      }
    };

    // Trackear envio de formulários
    const handleSubmit = (event: Event) => {
      const target = event.target as HTMLFormElement;
      const formName = target.name || target.id || 'unnamed_form';
      
      trackStepInteraction('form_submitted', {
        form_name: formName,
        form_action: target.action
      });
    };

    container.addEventListener('click', handleClick, true);
    container.addEventListener('change', handleChange, true);
    container.addEventListener('submit', handleSubmit, true);

    return () => {
      container.removeEventListener('click', handleClick, true);
      container.removeEventListener('change', handleChange, true);
      container.removeEventListener('submit', handleSubmit, true);
    };
  }, [autoTrack, trackStepInteraction]);

  // Trackear entrada no step quando o componente monta
  useEffect(() => {
    if (autoTrack) {
      trackStepEntry();
    }

    // Trackear saída quando o componente desmonta
    return () => {
      if (autoTrack) {
        trackStepExit(false);
      }
    };
  }, [autoTrack, trackStepEntry, trackStepExit]);

  // Função pública para marcar step como completo
  const markStepCompleted = useCallback((completionData?: Record<string, any>) => {
    trackStepExit(true);
    
    if (completionData && typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: 'personalization_step_completed_with_data',
        step_name: stepName,
        step_number: stepNumber,
        completion_data: completionData,
        timestamp: new Date().toISOString()
      });
    }
  }, [stepName, stepNumber, trackStepExit]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      {children}
    </div>
  );
}

// Hook para usar o PersonalizationTracker programaticamente
export function usePersonalizationTracking() {
  const { trackPersonalizationStep, pushEvent } = useGTM();

  const trackStep = useCallback((stepName: string, stepNumber: number, stepData?: Record<string, any>) => {
    trackPersonalizationStep(stepName, stepNumber, stepData);
  }, [trackPersonalizationStep]);

  const trackStepProgress = useCallback((totalSteps: number, currentStep: number, completedSteps: number) => {
    const progressPercentage = Math.round((completedSteps / totalSteps) * 100);
    
    pushEvent('personalization_progress', {
      total_steps: totalSteps,
      current_step: currentStep,
      completed_steps: completedSteps,
      progress_percentage: progressPercentage,
      remaining_steps: totalSteps - completedSteps
    });
  }, [pushEvent]);

  const trackPersonalizationComplete = useCallback((personalizedData: Record<string, any>) => {
    pushEvent('personalization_completed', {
      personalization_data: personalizedData,
      completion_timestamp: new Date().toISOString()
    });
  }, [pushEvent]);

  const trackPersonalizationAbandoned = useCallback((lastStep: number, totalSteps: number, reason?: string) => {
    const abandonmentRate = Math.round(((totalSteps - lastStep) / totalSteps) * 100);
    
    pushEvent('personalization_abandoned', {
      last_completed_step: lastStep,
      total_steps: totalSteps,
      abandonment_rate: abandonmentRate,
      abandonment_reason: reason || 'unknown'
    });
  }, [pushEvent]);

  return {
    trackStep,
    trackStepProgress,
    trackPersonalizationComplete,
    trackPersonalizationAbandoned
  };
}