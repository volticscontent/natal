import { NextResponse } from 'next/server';
import { createClient } from 'redis';

export async function GET() {
  try {
    // Conecta ao Redis usando a URL do ambiente
    const redis = createClient({ 
      url: process.env.REDIS_URL 
    });
    
    await redis.connect();
    
    // Testa operações básicas
    await redis.set('test-key', 'Hello Redis from Vercel!');
    const value = await redis.get('test-key');
    
    // Testa TTL
    await redis.setEx('test-ttl', 60, 'This expires in 60 seconds');
    const ttl = await redis.ttl('test-ttl');
    
    // Testa operações de hash (para rate limiting)
    await redis.hSet('test-hash', {
      count: '1',
      resetTime: Date.now().toString()
    });
    const hashData = await redis.hGetAll('test-hash');
    
    // Fecha conexão
    await redis.quit();
    
    return NextResponse.json({
      success: true,
      message: 'Redis connection successful!',
      data: {
        basicValue: value,
        ttl: ttl,
        hashData: hashData,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Redis test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}