// Sistema de Rate Limiting para produção com Redis
import { NextRequest } from 'next/server';
import { createClient } from 'redis';



interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// Redis client singleton
let redisClient: ReturnType<typeof createClient> | null = null;

// Store em memória como fallback
const memoryStore: RateLimitStore = {};

/**
 * Inicializa conexão Redis
 */
async function getRedisClient() {
  if (!redisClient && process.env.REDIS_URL && process.env.REDIS_URL !== "database_provisioning_in_progress") {
    try {
      redisClient = createClient({ 
        url: process.env.REDIS_URL,
        socket: {
          connectTimeout: 5000,
        },
      });
      
      redisClient.on('error', (err) => {
        console.warn('Redis connection error, falling back to memory store:', err.message);
        redisClient = null;
      });
      
      await redisClient.connect();
      console.log('✅ Redis connected for rate limiting');
    } catch (error) {
      console.warn('Failed to connect to Redis, using memory store:', error);
      redisClient = null;
    }
  }
  
  return redisClient;
}

// Configurações por endpoint
export const rateLimitConfigs = {
  // Upload de fotos - mais restritivo
  '/api/save-photos': {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 5, // 5 uploads por minuto por IP
  },
  '/api/upload-photos': {
    windowMs: 60 * 1000,
    maxRequests: 5,
  },
  // Webhooks - moderado
  '/api/webhook': {
    windowMs: 60 * 1000,
    maxRequests: 10,
  },
  // Geral - mais permissivo
  default: {
    windowMs: 60 * 1000,
    maxRequests: 30, // 30 requests por minuto por IP
  },
};

/**
 * Gera chave única para rate limiting
 */
function generateKey(req: NextRequest, endpoint: string): string {
  // Usa IP real considerando proxies
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwarded ? forwarded.split(',')[0].trim() : realIp || 'unknown';
  
  return `${endpoint}:${ip}`;
}

/**
 * Verifica se request está dentro do limite usando Redis ou fallback para memória
 */
export async function checkRateLimit(
  req: NextRequest,
  endpoint: string
): Promise<{
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}> {
  const config = rateLimitConfigs[endpoint as keyof typeof rateLimitConfigs] || rateLimitConfigs.default;
  const key = generateKey(req, endpoint);
  const now = Date.now();
  
  try {
    const redis = await getRedisClient();
    
    if (redis) {
      return await checkRateLimitRedis(redis, key, config, now);
    } else {
      return checkRateLimitMemory(key, config, now);
    }
  } catch (error) {
    console.warn('Rate limit check failed, using memory fallback:', error);
    return checkRateLimitMemory(key, config, now);
  }
}

/**
 * Rate limiting usando Redis
 */
async function checkRateLimitRedis(
  redis: ReturnType<typeof createClient>,
  key: string,
  config: { windowMs: number; maxRequests: number },
  now: number
) {
  const redisKey = `rate_limit:${key}`;
  const resetTime = now + config.windowMs;
  
  // Incrementa contador e define TTL
  const count = await redis.incr(redisKey);
  
  // Define TTL apenas se for a primeira requisição
  if (count === 1) {
    await redis.expire(redisKey, Math.ceil(config.windowMs / 1000));
  }
  
  if (count > config.maxRequests) {
    const ttl = await redis.ttl(redisKey);
    const retryAfter = ttl > 0 ? ttl : Math.ceil(config.windowMs / 1000);
    
    return {
      allowed: false,
      remaining: 0,
      resetTime: now + (ttl * 1000),
      retryAfter,
    };
  }
  
  return {
    allowed: true,
    remaining: config.maxRequests - count,
    resetTime,
  };
}

/**
 * Rate limiting usando memória (fallback)
 */
function checkRateLimitMemory(
  key: string,
  config: { windowMs: number; maxRequests: number },
  now: number
) {
  // Limpa entradas expiradas
  if (memoryStore[key] && now > memoryStore[key].resetTime) {
    delete memoryStore[key];
  }
  
  // Inicializa se não existe
  if (!memoryStore[key]) {
    memoryStore[key] = {
      count: 0,
      resetTime: now + config.windowMs,
    };
  }
  
  const entry = memoryStore[key];
  
  // Verifica se excedeu o limite
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    };
  }
  
  // Incrementa contador
  entry.count++;
  
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Middleware de rate limiting
 */
export function withRateLimit(handler: (req: NextRequest) => Promise<Response>) {
  return async (req: NextRequest): Promise<Response> => {
    const endpoint = new URL(req.url).pathname;
    const rateLimit = await checkRateLimit(req, endpoint);
    
    // Headers de rate limit
    const headers = new Headers({
      'X-RateLimit-Limit': rateLimitConfigs[endpoint as keyof typeof rateLimitConfigs]?.maxRequests.toString() || '30',
      'X-RateLimit-Remaining': rateLimit.remaining.toString(),
      'X-RateLimit-Reset': rateLimit.resetTime.toString(),
    });
    
    if (!rateLimit.allowed) {
      headers.set('Retry-After', rateLimit.retryAfter!.toString());
      
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: `Too many requests. Try again in ${rateLimit.retryAfter} seconds.`,
          retryAfter: rateLimit.retryAfter,
        }),
        {
          status: 429,
          headers,
        }
      );
    }
    
    const response = await handler(req);
    
    // Adiciona headers de rate limit na resposta
    headers.forEach((value, key) => {
      response.headers.set(key, value);
    });
    
    return response;
  };
}

/**
 * Limpa entradas expiradas do store em memória (Redis se limpa automaticamente)
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now();
  
  Object.keys(memoryStore).forEach(key => {
    if (memoryStore[key].resetTime < now) {
      delete memoryStore[key];
    }
  });
}

/**
 * Fecha conexão Redis gracefully
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
      redisClient = null;
      console.log('✅ Redis connection closed');
    } catch (error) {
      console.warn('Error closing Redis connection:', error);
    }
  }
}

// Cleanup automático a cada 5 minutos (apenas para memory store)
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
}