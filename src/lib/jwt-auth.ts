/**
 * 🔐 JWT Authentication Utility
 * Sistema de autenticação JWT para webhooks N8N
 */

import { SignJWT, jwtVerify } from 'jose';

// ===== INTERFACES =====

export interface JWTPayload {
  iss: string; // Issuer (quem emitiu)
  aud: string; // Audience (para quem é destinado)
  sub: string; // Subject (assunto/usuário)
  iat: number; // Issued at (quando foi emitido)
  exp: number; // Expiration (quando expira)
  data?: Record<string, unknown>; // Dados customizados
  [key: string]: unknown; // Index signature para compatibilidade com jose
}

export interface JWTConfig {
  secret: string;
  issuer: string;
  audience: string;
  expiresIn: string; // Ex: '1h', '30m', '24h'
}

// ===== CONFIGURAÇÃO PADRÃO =====

const defaultConfig: JWTConfig = {
  secret: process.env.N8N_WEBHOOK_JWT_SECRET || 'default-secret-change-in-production',
  issuer: 'recadinhos-papai-noel',
  audience: 'n8n-webhook',
  expiresIn: '1h', // 1 hora
};

// ===== UTILITÁRIOS =====

/**
 * Converte string de tempo para segundos
 */
function parseExpiresIn(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error('Formato de expiresIn inválido. Use: 30s, 5m, 1h, 1d');
  }

  const [, value, unit] = match;
  const num = parseInt(value, 10);

  switch (unit) {
    case 's': return num;
    case 'm': return num * 60;
    case 'h': return num * 60 * 60;
    case 'd': return num * 60 * 60 * 24;
    default: throw new Error('Unidade de tempo inválida');
  }
}

/**
 * Gera chave secreta a partir da string
 */
function getSecretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

// ===== FUNÇÕES PRINCIPAIS =====

/**
 * Gera um token JWT
 */
export async function generateJWT(
  subject: string,
  data?: Record<string, unknown>,
  config: Partial<JWTConfig> = {}
): Promise<string> {
  const finalConfig = { ...defaultConfig, ...config };
  const secretKey = getSecretKey(finalConfig.secret);
  
  const now = Math.floor(Date.now() / 1000);
  const exp = now + parseExpiresIn(finalConfig.expiresIn);

  const payload: JWTPayload = {
    iss: finalConfig.issuer,
    aud: finalConfig.audience,
    sub: subject,
    iat: now,
    exp,
    ...(data && { data }),
  };

  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .setIssuer(finalConfig.issuer)
    .setAudience(finalConfig.audience)
    .setSubject(subject)
    .sign(secretKey);

  return jwt;
}

/**
 * Verifica e decodifica um token JWT
 */
export async function verifyJWT(
  token: string,
  config: Partial<JWTConfig> = {}
): Promise<{
  valid: boolean;
  payload?: JWTPayload;
  error?: string;
}> {
  try {
    const finalConfig = { ...defaultConfig, ...config };
    const secretKey = getSecretKey(finalConfig.secret);

    const { payload } = await jwtVerify(token, secretKey, {
      issuer: finalConfig.issuer,
      audience: finalConfig.audience,
    });

    return {
      valid: true,
      payload: payload as JWTPayload,
    };

  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Token inválido',
    };
  }
}

/**
 * Gera token específico para webhook N8N
 */
export async function generateN8NWebhookToken(
  sessionId: string,
  webhookData?: Record<string, unknown>
): Promise<string> {
  const data = {
    session_id: sessionId,
    webhook_type: 'n8n_personalization',
    timestamp: new Date().toISOString(),
    ...webhookData,
  };

  return generateJWT(`webhook:${sessionId}`, data, {
    expiresIn: '2h', // 2 horas para webhook
  });
}

/**
 * Verifica token específico do webhook N8N
 */
export async function verifyN8NWebhookToken(
  token: string
): Promise<{
  valid: boolean;
  sessionId?: string;
  data?: Record<string, unknown>;
  error?: string;
}> {
  const result = await verifyJWT(token);

  if (!result.valid) {
    return {
      valid: false,
      error: result.error,
    };
  }

  const payload = result.payload!;
  
  // Verificar se é um token de webhook
  if (!payload.sub?.startsWith('webhook:')) {
    return {
      valid: false,
      error: 'Token não é válido para webhook',
    };
  }

  const sessionId = payload.sub.replace('webhook:', '');

  return {
    valid: true,
    sessionId,
    data: payload.data,
  };
}

// ===== MIDDLEWARE PARA AUTENTICAÇÃO =====

/**
 * Middleware para verificar autenticação JWT em requests
 */
export function createJWTMiddleware(config?: Partial<JWTConfig>) {
  return async (request: Request): Promise<{
    authenticated: boolean;
    payload?: JWTPayload;
    error?: string;
  }> => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return {
        authenticated: false,
        error: 'Header Authorization não encontrado',
      };
    }

    if (!authHeader.startsWith('Bearer ')) {
      return {
        authenticated: false,
        error: 'Formato do token inválido. Use: Bearer <token>',
      };
    }

    const token = authHeader.substring(7); // Remove "Bearer "
    const result = await verifyJWT(token, config);

    return {
      authenticated: result.valid,
      payload: result.payload,
      error: result.error,
    };
  };
}

// ===== UTILITÁRIOS DE DESENVOLVIMENTO =====

/**
 * Gera token de teste para desenvolvimento
 */
export async function generateTestToken(): Promise<{
  token: string;
  payload: JWTPayload;
}> {
  const sessionId = `test-${Date.now()}`;
  const token = await generateN8NWebhookToken(sessionId, {
    environment: 'development',
    test: true,
  });

  const verification = await verifyN8NWebhookToken(token);
  
  return {
    token,
    payload: {
      iss: defaultConfig.issuer,
      aud: defaultConfig.audience,
      sub: `webhook:${sessionId}`,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7200, // 2h
      data: verification.data,
    },
  };
}

/**
 * Decodifica token sem verificar (apenas para debug)
 */
export function decodeJWTUnsafe(token: string): unknown {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Token JWT inválido');
    }

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf8')
    );

    return payload;
  } catch {
      return null;
    }
}

// ===== EXPORT DEFAULT =====
const jwtAuth = {
  generateJWT,
  verifyJWT,
  generateN8NWebhookToken,
  verifyN8NWebhookToken,
  createJWTMiddleware,
  generateTestToken,
  decodeJWTUnsafe,
};

export default jwtAuth;