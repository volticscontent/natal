// Circuit Breaker para melhorar resiliência do webhook N8N
export enum CircuitState {
  CLOSED = 'CLOSED',     // Funcionando normalmente
  OPEN = 'OPEN',         // Falhas detectadas, bloqueando requests
  HALF_OPEN = 'HALF_OPEN' // Testando se o serviço voltou
}

export interface CircuitBreakerConfig {
  failureThreshold: number;    // Número de falhas para abrir o circuito
  recoveryTimeout: number;     // Tempo para tentar fechar o circuito (ms)
  monitoringPeriod: number;    // Período de monitoramento (ms)
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime?: number;
  lastSuccessTime?: number;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private lastFailureTime?: number;
  private lastSuccessTime?: number;
  private nextAttemptTime?: number;

  constructor(private config: CircuitBreakerConfig) {}

  /**
   * Executa uma função com circuit breaker
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN;
      } else {
        throw new Error('Circuit breaker is OPEN - service unavailable');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Registra sucesso
   */
  private onSuccess(): void {
    this.successes++;
    this.lastSuccessTime = Date.now();
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.CLOSED;
      this.failures = 0; // Reset contador de falhas
    }
  }

  /**
   * Registra falha
   */
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = Date.now() + this.config.recoveryTimeout;
    }
  }

  /**
   * Verifica se deve tentar resetar o circuito
   */
  private shouldAttemptReset(): boolean {
    return this.nextAttemptTime ? Date.now() >= this.nextAttemptTime : false;
  }

  /**
   * Retorna estatísticas do circuit breaker
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
    };
  }

  /**
   * Reset manual do circuit breaker
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = undefined;
    this.lastSuccessTime = undefined;
    this.nextAttemptTime = undefined;
  }
}

// Instância global para webhook N8N
export const n8nCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,        // 5 falhas consecutivas
  recoveryTimeout: 60000,     // 1 minuto para tentar novamente
  monitoringPeriod: 300000,   // 5 minutos de monitoramento
});

/**
 * Wrapper para executar webhook com circuit breaker
 */
export async function executeWithCircuitBreaker<T>(
  fn: () => Promise<T>,
  circuitBreaker: CircuitBreaker = n8nCircuitBreaker
): Promise<T> {
  return circuitBreaker.execute(fn);
}