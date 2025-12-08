import { CacheModuleOptions } from '@nestjs/cache-manager';

export function getRedisConfig(): CacheModuleOptions {
  return {
    ttl: 60000,
    max: 100,
  };
}

// Cache keys
export const CACHE_KEYS = {
  TRANSFERS_LIST: (filters: string) => `transfers:list:${filters}`,
  PLAYER: (id: string) => `player:${id}`,
  TEAM_PLAYERS: (teamId: string) => `team:${teamId}:players`,
} as const;

// Cache TTLs (in milliseconds for cache-manager v4)
export const CACHE_TTL = {
  TRANSFERS_LIST: 60000, // 60 seconds
  PLAYER: 300000, // 5 minutes
  TEAM_PLAYERS: 300000, // 5 minutes
} as const;
