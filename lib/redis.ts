import { Redis } from '@upstash/redis'

// Singleton — initialized lazily from env vars
let _redis: Redis | null = null

export function getRedis(): Redis {
  if (!_redis) {
    _redis = Redis.fromEnv()
  }
  return _redis
}
