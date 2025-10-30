// 🔑 Session Manager - Gerenciamento de sessão e UTM

import { SessionData } from '../types';
import { saveSessionData, getSessionData } from './dataStorage';

// 🆔 Gerar session_id único
export const generateSessionId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `pers_${timestamp}_${randomStr}`;
};

// 🔗 Capturar session_id da UTM
export const captureSessionIdFromUTM = (): string => {
  if (typeof window === 'undefined') return '';
  
  const urlParams = new URLSearchParams(window.location.search);
  const utmSessionId = urlParams.get('utm_session_id');
  
  if (utmSessionId) {
    return utmSessionId;
  }
  
  // Se não houver UTM, gerar um novo
  return generateSessionId();
};

// 🚀 Inicializar sessão
export const initializeSession = (): string => {
  // Verificar se já existe uma sessão ativa
  const existingSession = getSessionData();
  
  if (existingSession.session_id) {
    return existingSession.session_id;
  }
  
  // Capturar ou gerar novo session_id
  const sessionId = captureSessionIdFromUTM();
  
  // Salvar dados iniciais da sessão
  const initialSessionData: SessionData = {
    session_id: sessionId,
    user_data: {
      nome: null,
      email: null,
      telefone: null,
      cpf: null
    }
  };
  
  saveSessionData(initialSessionData);
  
  return sessionId;
};

// 📊 Atualizar dados da sessão
export const updateSessionData = (updates: Partial<SessionData>): void => {
  const currentData = getSessionData();
  const updatedData = {
    ...currentData,
    ...updates,
    // Merge user_data se fornecido
    user_data: updates.user_data 
      ? { ...currentData.user_data, ...updates.user_data }
      : currentData.user_data
  };
  
  saveSessionData(updatedData);
};

// 🔄 Atualizar dados do usuário
export const updateUserData = (userData: Partial<SessionData['user_data']>): void => {
  const currentSession = getSessionData();
  
  // Garantir que user_data existe
  const currentUserData = currentSession.user_data || {
    nome: null,
    email: null,
    telefone: null,
    cpf: null
  };
  
  const updatedUserData = {
    nome: userData.nome ?? currentUserData.nome,
    email: userData.email ?? currentUserData.email,
    telefone: userData.telefone ?? currentUserData.telefone,
    cpf: userData.cpf ?? currentUserData.cpf
  };
  
  updateSessionData({ user_data: updatedUserData });
};

// ✅ Validar se sessão está ativa
export const isSessionActive = (): boolean => {
  const sessionData = getSessionData();
  return !!(sessionData.session_id);
};

// 🔍 Obter informações da sessão
export const getSessionInfo = () => {
  const sessionData = getSessionData();
  
  return {
    sessionId: sessionData.session_id,
    isActive: isSessionActive(),
    hasUserData: !!(
      sessionData.user_data?.nome ||
      sessionData.user_data?.email ||
      sessionData.user_data?.telefone
    ),
    userData: sessionData.user_data
  };
};

// 🌐 Capturar outros parâmetros UTM úteis
export const captureUTMParameters = () => {
  if (typeof window === 'undefined') return {};
  
  const urlParams = new URLSearchParams(window.location.search);
  
  return {
    utm_source: urlParams.get('utm_source'),
    utm_medium: urlParams.get('utm_medium'),
    utm_campaign: urlParams.get('utm_campaign'),
    utm_term: urlParams.get('utm_term'),
    utm_content: urlParams.get('utm_content'),
    utm_session_id: urlParams.get('utm_session_id'),
    // Outros parâmetros personalizados
    ref: urlParams.get('ref'),
    affiliate: urlParams.get('affiliate')
  };
};

// 📈 Salvar parâmetros UTM para analytics
export const saveUTMParameters = (): void => {
  const utmParams = captureUTMParameters();
  
  // Salvar no localStorage para uso posterior
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('pers_utm_params', JSON.stringify(utmParams));
    } catch (error) {
      console.error('Erro ao salvar parâmetros UTM:', error);
    }
  }
};

// 🔄 Renovar sessão (se necessário)
export const renewSession = (): string => {
  const newSessionId = generateSessionId();
  
  updateSessionData({
    session_id: newSessionId
  });
  
  return newSessionId;
};

// 🧹 Limpar sessão
export const clearSession = async (): Promise<void> => {
  // Esta função será chamada após checkout bem-sucedido
  // Implementada no dataStorage.ts
  const { clearSessionData } = await import('./dataStorage');
  clearSessionData();
};

// 🔍 Debug da sessão
export const debugSession = (): void => {
  console.group('🔍 Debug Session');
  console.log('Session Info:', getSessionInfo());
  console.log('UTM Parameters:', captureUTMParameters());
  console.log('Full Session Data:', getSessionData());
  console.groupEnd();
};