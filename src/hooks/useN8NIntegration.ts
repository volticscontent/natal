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
  fallback_mode?: boolean;
  retry_after?: number;
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
  fallbackMode?: boolean;
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
   * Ativa modo fallback quando N8N não estiver disponível
   */
  const activateFallbackMode = useCallback((
    persData: PersData,
    contactData: ContactData
  ): N8NSubmissionResult => {
    console.log('🔄 Ativando modo fallback - dados salvos localmente');
    
    // Salvar dados localmente para recuperação posterior
    const fallbackData = {
      persData,
      contactData,
      sessionId,
      utmParams,
      timestamp: new Date().toISOString(),
      status: 'pending_n8n_sync'
    };
    
    // Salvar no localStorage para tentar enviar posteriormente
    const existingFallbackData = localStorage.getItem('n8n_fallback_queue');
    const fallbackQueue = existingFallbackData ? JSON.parse(existingFallbackData) : [];
    fallbackQueue.push(fallbackData);
    localStorage.setItem('n8n_fallback_queue', JSON.stringify(fallbackQueue));
    
    const result: N8NSubmissionResult = {
      success: true,
      sessionId: sessionId || undefined,
      response: {
        success: true,
        message: 'Dados salvos em modo offline. Serão sincronizados quando o servidor estiver disponível.',
        session_id: sessionId || ''
      }
    };

    setState(prev => ({
      ...prev,
      isSubmitting: false,
      lastResult: result,
      fallbackMode: true,
    }));

    return result;
  }, [sessionId, utmParams]);

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
        // Verificar se é um erro de serviço indisponível (503)
        if (response.status === 503 && result.fallback_mode) {
          console.log('🔄 Serviço indisponível detectado, ativando modo fallback automaticamente...');
          return activateFallbackMode(persData, contactData);
        }
        
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
      
      // Verificar se é um erro de conexão/rede
      const isNetworkError = errorMessage.toLowerCase().includes('fetch') ||
                           errorMessage.toLowerCase().includes('network') ||
                           errorMessage.toLowerCase().includes('conexão') ||
                           errorMessage.toLowerCase().includes('timeout') ||
                           errorMessage.toLowerCase().includes('failed to fetch');
      
      if (isNetworkError) {
        console.log('🔄 Erro de rede detectado, ativando modo fallback automaticamente...');
        return activateFallbackMode(persData, contactData);
      }
      
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
  }, [sessionId, utmParams, activateFallbackMode]);



  /**
   * Tenta reenviar dados salvos no localStorage quando a conexão for restaurada
   */
  const retryFallbackQueue = useCallback(async (): Promise<void> => {
    const fallbackData = localStorage.getItem('n8n_fallback_queue');
    if (!fallbackData) return;

    try {
      const queue = JSON.parse(fallbackData);
      if (!Array.isArray(queue) || queue.length === 0) return;

      console.log(`🔄 Tentando reenviar ${queue.length} submissões pendentes...`);
      
      const successfulSubmissions: number[] = [];
      
      for (let i = 0; i < queue.length; i++) {
        const item = queue[i];
        try {
          const result = await submitToN8N(item.persData, item.contactData);
          if (result.success) {
            successfulSubmissions.push(i);
            console.log(`✅ Submissão ${i + 1} reenviada com sucesso`);
          }
        } catch (error) {
          console.log(`❌ Falha ao reenviar submissão ${i + 1}:`, error);
          // Parar tentativas se ainda há problemas de conexão
          break;
        }
      }

      // Remover submissões bem-sucedidas da fila
      if (successfulSubmissions.length > 0) {
        const remainingQueue = queue.filter((_, index) => !successfulSubmissions.includes(index));
        if (remainingQueue.length === 0) {
          localStorage.removeItem('n8n_fallback_queue');
          console.log('🎉 Todas as submissões pendentes foram reenviadas com sucesso!');
        } else {
          localStorage.setItem('n8n_fallback_queue', JSON.stringify(remainingQueue));
          console.log(`📝 ${remainingQueue.length} submissões ainda pendentes`);
        }
      }
    } catch (error) {
      console.error('Erro ao processar fila de fallback:', error);
    }
  }, [submitToN8N]);

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
    
    try {
      // Tentar enviar dados para N8N
      const result = await submitToN8N(persData, contactData);
      
      // Se falhou devido a problemas de conectividade, ativar modo fallback
      if (!result.success && result.error) {
        const errorMsg = result.error.toLowerCase();
        const isConnectivityIssue = 
          errorMsg.includes('webhook n8n não encontrado') ||
          errorMsg.includes('falha na conexão') ||
          errorMsg.includes('servidor n8n temporariamente indisponível') ||
          errorMsg.includes('timeout') ||
          errorMsg.includes('fetch failed') ||
          errorMsg.includes('network');
        
        if (isConnectivityIssue) {
          console.log('🔄 Problema de conectividade detectado, ativando modo fallback...');
          return activateFallbackMode(persData, contactData);
        }
      }
      
      return result;
    } catch (error) {
      console.error('❌ Erro inesperado ao enviar para N8N:', error);
      
      // Em caso de erro inesperado, também ativar modo fallback
      console.log('🔄 Erro inesperado, ativando modo fallback...');
      return activateFallbackMode(persData, contactData);
    }
  }, [submitToN8N, validateData, activateFallbackMode]);

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
    fallbackMode: state.fallbackMode,
    
    // Funções
    submitToN8N,
    validateAndSubmit,
    retryFallbackQueue,
    clearError,
    reset,
    
    // Dados de contexto
    sessionId,
    utmParams,
  };
};

export default useN8NIntegration;