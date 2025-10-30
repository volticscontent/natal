'use client';

/**
 * Utilitário para gerenciar utm_session_id único por cliente
 * Gera um ID único que persiste durante toda a sessão do usuário
 */

const UTM_SESSION_KEY = 'utm_session_id';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 horas em millisegundos

interface SessionData {
  id: string;
  timestamp: number;
  locale?: string;
  source?: string;
}

/**
 * Gera um ID único baseado em timestamp e random
 * Usa crypto.randomUUID quando disponível para maior unicidade
 */
function generateSessionId(): string {
  // Tenta usar crypto.randomUUID para máxima unicidade
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    try {
      return window.crypto.randomUUID();
    } catch {
      console.warn('crypto.randomUUID não disponível, usando fallback');
    }
  }
  
  // Fallback: timestamp + random mais robusto
  const timestamp = Date.now().toString(36);
  const random1 = Math.random().toString(36).substring(2, 10);
  const random2 = Math.random().toString(36).substring(2, 10);
  const performanceNow = typeof performance !== 'undefined' ? performance.now().toString(36) : '';
  
  return `${timestamp}_${random1}_${random2}_${performanceNow}`.replace(/\./g, '');
}

/**
 * Verifica se a sessão ainda é válida (não expirou)
 */
function isSessionValid(sessionData: SessionData): boolean {
  const now = Date.now();
  return (now - sessionData.timestamp) < SESSION_DURATION;
}

/**
 * Obtém ou cria um utm_session_id único
 */
export function getUtmSessionId(locale?: string, source?: string): string {
  if (typeof window === 'undefined') {
    // Server-side: gera um ID temporário
    return generateSessionId();
  }

  try {
    const stored = localStorage.getItem(UTM_SESSION_KEY);
    
    if (stored) {
      const sessionData: SessionData = JSON.parse(stored);
      
      // Verifica se a sessão ainda é válida
      if (isSessionValid(sessionData)) {
        return sessionData.id;
      }
    }
  } catch (error) {
    console.warn('Erro ao recuperar utm_session_id:', error);
  }

  // Cria nova sessão
  const newSessionId = generateSessionId();
  const sessionData: SessionData = {
    id: newSessionId,
    timestamp: Date.now(),
    locale,
    source
  };

  try {
    localStorage.setItem(UTM_SESSION_KEY, JSON.stringify(sessionData));
  } catch (error) {
    console.warn('Erro ao salvar utm_session_id:', error);
  }

  return newSessionId;
}

/**
 * Força a criação de uma nova sessão
 */
export function renewUtmSessionId(locale?: string, source?: string): string {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(UTM_SESSION_KEY);
    } catch (error) {
      console.warn('Erro ao limpar utm_session_id:', error);
    }
  }
  
  return getUtmSessionId(locale, source);
}

/**
 * Obtém dados completos da sessão atual
 */
export function getSessionData(): SessionData | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = localStorage.getItem(UTM_SESSION_KEY);
    if (stored) {
      const sessionData: SessionData = JSON.parse(stored);
      return isSessionValid(sessionData) ? sessionData : null;
    }
  } catch (error) {
    console.warn('Erro ao recuperar dados da sessão:', error);
  }

  return null;
}

/**
 * Limpa a sessão atual
 */
export function clearUtmSession(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(UTM_SESSION_KEY);
    } catch (error) {
      console.warn('Erro ao limpar sessão:', error);
    }
  }
}

export function validateSessionId(sessionId: string): boolean {
  try {
    // Verificar se tem o formato correto (timestamp + random)
    if (sessionId.length !== 16) return false;
    
    // Verificar se os primeiros 8 caracteres são um timestamp válido
    const timestampHex = sessionId.substring(0, 8);
    const timestamp = parseInt(timestampHex, 16);
    
    // Verificar se o timestamp é razoável (não muito antigo nem futuro)
    const now = Date.now();
    const sessionTime = timestamp * 1000;
    const maxAge = 24 * 60 * 60 * 1000; // 24 horas
    
    return sessionTime > (now - maxAge) && sessionTime <= now;
  } catch {
    return false;
  }
}