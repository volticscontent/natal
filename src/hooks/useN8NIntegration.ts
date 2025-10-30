import { useState, useCallback } from 'react';
import { PersData, ContactData } from '../components/main/pers/types';
import { useUtmTracking } from './useUtmTracking';

// Interface para resposta da API submit-order
interface SubmitOrderResponse {
  success: boolean;
  message: string;
  session_id: string;
  payload?: Record<string, unknown>;
  n8n_response?: Record<string, unknown>;
}

// Interface para resposta de erro da API
interface SubmitOrderErrorResponse {
  error: string;
  details?: string | string[];
}

export interface N8NSubmissionResult {
  success: boolean;
  sessionId?: string;
  error?: string;
  response?: SubmitOrderResponse | SubmitOrderErrorResponse;
}

export interface N8NSubmissionState {
  isSubmitting: boolean;
  lastResult?: N8NSubmissionResult;
  error?: string;
}

/**
 * Hook para integração com N8N webhook
 * Gerencia o envio de dados do formulário para o N8N
 */
export const useN8NIntegration = () => {
  const [state, setState] = useState<N8NSubmissionState>({
    isSubmitting: false,
  });
  
  const { utmParams, sessionId } = useUtmTracking();

  /**
   * Envia dados para o N8N webhook
   */
  const submitToN8N = useCallback(async (
    persData: PersData,
    contactData: ContactData
  ): Promise<N8NSubmissionResult> => {
    console.log('🚀 submitToN8N iniciado');
    console.log('🚀 sessionId:', sessionId);
    console.log('🚀 utmParams:', utmParams);
    
    setState(prev => ({
      ...prev,
      isSubmitting: true,
      error: undefined,
    }));

    try {
      const payload = {
        persData,
        contactData,
        sessionId,
        utmParams,
      };
      
      console.log('📤 Enviando payload para /api/submit-order:', payload);
      
      const response = await fetch('/api/submit-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('📥 Resposta recebida:', response.status, response.statusText);
      
      const result = await response.json();
      console.log('📥 Dados da resposta:', result);

      if (!response.ok) {
        // Usar details se disponível, senão usar error, senão mensagem padrão
        const errorMessage = result.details || result.error || 'Erro ao enviar dados';
        throw new Error(errorMessage);
      }

      const successResult: N8NSubmissionResult = {
        success: true,
        sessionId: result.session_id,
        response: result.n8n_response,
      };

      setState(prev => ({
        ...prev,
        isSubmitting: false,
        lastResult: successResult,
      }));

      return successResult;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      const errorResult: N8NSubmissionResult = {
        success: false,
        error: errorMessage,
      };

      setState(prev => ({
        ...prev,
        isSubmitting: false,
        lastResult: errorResult,
        error: errorMessage,
      }));

      return errorResult;
    }
  }, [sessionId, utmParams]);

  /**
   * Valida dados antes do envio
   */
  const validateData = useCallback((
    persData: PersData,
    contactData: ContactData
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Validar dados de contato
    if (!contactData.nome?.trim()) {
      errors.push('Nome é obrigatório');
    }

    if (!contactData.email?.trim()) {
      errors.push('Email é obrigatório');
    }

    if (!contactData.telefone?.trim()) {
      errors.push('Telefone é obrigatório');
    }

    if (!contactData.cpf?.trim()) {
      errors.push('CPF é obrigatório');
    }

    // Validar dados de personalização
    if (!persData.children || persData.children.length === 0) {
      errors.push('Pelo menos uma criança deve ser adicionada');
    }

    if (persData.children && persData.children.length > 3) {
      errors.push('Máximo de 3 crianças permitidas');
    }

    // Validar nomes das crianças
    if (persData.children) {
      persData.children.forEach((child, index) => {
        if (!child.nome?.trim()) {
          errors.push(`Nome da criança ${index + 1} é obrigatório`);
        }
      });
    }

    if (!persData.mensagem?.trim()) {
      errors.push('Mensagem personalizada é obrigatória');
    }

    // Validar fotos se order bump selecionado
    if (persData.incluir_fotos && (!persData.fotos || persData.fotos.length === 0)) {
      errors.push('Fotos são obrigatórias quando o order bump de fotos está selecionado');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, []);

  /**
   * Função de conveniência que valida e envia dados
   */
  const validateAndSubmit = useCallback(async (
    persData: PersData,
    contactData: ContactData
  ): Promise<N8NSubmissionResult> => {
    console.log('🔍 validateAndSubmit chamado com:', { persData, contactData });
    
    // Validar dados primeiro
    const validation = validateData(persData, contactData);
    console.log('🔍 Resultado da validação:', validation);
    
    if (!validation.isValid) {
      const errorResult: N8NSubmissionResult = {
        success: false,
        error: `Dados inválidos: ${validation.errors.join(', ')}`,
      };

      console.error('❌ Validação falhou:', errorResult);

      setState(prev => ({
        ...prev,
        lastResult: errorResult,
        error: errorResult.error,
      }));

      return errorResult;
    }

    console.log('✅ Validação passou, enviando para N8N...');
    // Se validação passou, enviar dados
    return submitToN8N(persData, contactData);
  }, [submitToN8N, validateData]);

  /**
   * Limpa o estado de erro
   */
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: undefined,
    }));
  }, []);

  /**
   * Reseta o estado completo
   */
  const reset = useCallback(() => {
    setState({
      isSubmitting: false,
    });
  }, []);

  return {
    // Estado
    isSubmitting: state.isSubmitting,
    lastResult: state.lastResult,
    error: state.error,
    
    // Funções
    submitToN8N,
    validateData,
    validateAndSubmit,
    clearError,
    reset,
    
    // Dados de contexto
    sessionId,
    utmParams,
  };
};

export default useN8NIntegration;