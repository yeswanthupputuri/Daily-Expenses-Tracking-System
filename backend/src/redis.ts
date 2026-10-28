
import { createClient } from 'redis';

const redisUrl =
  process.env.REDIS_URL || 'redis://127.0.0.1:6379';

export const redisClient = createClient({
  url: redisUrl,
});

redisClient.on('error', (error) => {
  console.error('[Redis] Connection error:', error.message);
});

redisClient.on('ready', () => {
  console.log('[Redis] Connected and ready.');
});

export async function connectRedis(): Promise<void> {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
}

export async function getCached<T>(
  key: string,
): Promise<T | null> {
  try {
    if (!redisClient.isReady) {
      return null;
    }
    console.log('[Redis Cache] Reading:', {
        key,
        isReady: redisClient.isReady,
    });
    
    const value = await redisClient.get(key);

    if (value === null) {
      return null;
    }

    return JSON.parse(value) as T;
  } catch (error) {
    console.error('[Redis] Cache read failed:', error);
    return null;
  }
}

export async function setCached(
  key: string,
  value: unknown,
  ttlSeconds: number,
): Promise<void> {
  console.log('[Redis Cache] Attempting write:', {
    key,
    isOpen: redisClient.isOpen,
    isReady: redisClient.isReady,
  });

  try {
    if (!redisClient.isReady) {
      console.error('[Redis Cache] Write skipped: Redis is not ready.');
      return;
    }

    const result = await redisClient.set(
      key,
      JSON.stringify(value),
      { EX: ttlSeconds },
    );

    console.log('[Redis Cache] Write result:', result, 'Key:', key);
  } catch (error) {
    console.error('[Redis Cache] Write failed:', key, error);
  }
}

export async function deleteCached(
  ...keys: string[]
): Promise<void> {
  try {
    if (!redisClient.isReady || keys.length === 0) {
      return;
    }

    await redisClient.del(keys);
  } catch (error) {
    console.error('[Redis] Cache invalidation failed:', error);
  }
}
