/** 运行时缓存服务：提供最小可失效的进程内缓存，作为受控缓存边界的第一实现。 */
import { Injectable } from "@nestjs/common";

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

@Injectable()
export class RuntimeCacheService {
  private readonly store = new Map<string, CacheEntry<unknown>>();

  async getOrSet<T>(key: string, ttlMs: number, factory: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const cached = this.store.get(key);

    if (cached && cached.expiresAt > now) {
      return cached.value as T;
    }

    const value = await factory();
    this.store.set(key, {
      value,
      expiresAt: now + ttlMs
    });

    return value;
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }
}
