import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Para desenvolvimento, podemos usar um mock se não tiver Redis configurado
// Em produção, você precisa configurar Upstash Redis ou usar outro serviço

let ratelimit: Ratelimit | null = null;

// Inicializar rate limiter apenas se tiver as variáveis de ambiente
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  // Rate limiter para uploads: 10 uploads por hora por usuário
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 h"),
    analytics: true,
  });
} else {
  console.warn("Upstash Redis not configured. Rate limiting disabled.");
}

// Rate limiter para uploads
export async function checkUploadRateLimit(identifier: string): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  if (!ratelimit) {
    // Se não tiver rate limiter configurado, permitir (desenvolvimento)
    return { success: true, limit: 10, remaining: 10, reset: Date.now() + 3600000 };
  }

  const result = await ratelimit.limit(identifier);
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

// Rate limiter genérico para outras APIs
export async function checkApiRateLimit(
  identifier: string,
  limit: number = 100,
  window: string = "1 h"
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  if (!ratelimit) {
    return { success: true, limit, remaining: limit, reset: Date.now() + 3600000 };
  }

  // Criar limiter dinâmico
  const dynamicLimiter = new Ratelimit({
    redis: ratelimit.redis,
    limiter: Ratelimit.slidingWindow(limit, window as any),
    analytics: true,
  });

  const result = await dynamicLimiter.limit(identifier);
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

