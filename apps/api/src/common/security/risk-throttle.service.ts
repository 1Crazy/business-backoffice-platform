/** 风险限流服务：把登录、刷新和开放接口失败窗口委托给可替换 store，支持本地内存与生产共享存储。 */
import { HttpException, HttpStatus, Inject, Injectable, Optional } from "@nestjs/common";

export const RISK_THROTTLE_STORE = Symbol("RISK_THROTTLE_STORE");

export interface RiskThrottleOptions {
  maxAttempts: number;
  windowMs: number;
  lockMs: number;
}

export interface RiskThrottleEntry {
  attempts: number;
  firstAttemptAt: Date;
  lockedUntil?: Date | null;
}

export interface RiskThrottleStore {
  get(key: string): Promise<RiskThrottleEntry | null>;
  set(key: string, entry: RiskThrottleEntry): Promise<void>;
  delete(key: string): Promise<void>;
}

@Injectable()
export class InMemoryRiskThrottleStore implements RiskThrottleStore {
  private readonly entries = new Map<string, RiskThrottleEntry>();

  async get(key: string): Promise<RiskThrottleEntry | null> {
    return this.entries.get(key) ?? null;
  }

  async set(key: string, entry: RiskThrottleEntry): Promise<void> {
    this.entries.set(key, entry);
  }

  async delete(key: string): Promise<void> {
    this.entries.delete(key);
  }
}

@Injectable()
export class RiskThrottleService {
  constructor(
    @Optional()
    @Inject(RISK_THROTTLE_STORE)
    private readonly store: RiskThrottleStore = new InMemoryRiskThrottleStore()
  ) {}

  async assertAllowed(key: string, options: RiskThrottleOptions): Promise<void> {
    const normalizedKey = this.normalizeKey(key);
    const entry = await this.store.get(normalizedKey);
    const now = Date.now();

    if (!entry) {
      return;
    }

    if (entry.lockedUntil && entry.lockedUntil.getTime() > now) {
      throw new HttpException("失败次数过多，请稍后再试。", HttpStatus.TOO_MANY_REQUESTS);
    }

    if (entry.lockedUntil || now - entry.firstAttemptAt.getTime() > options.windowMs) {
      await this.store.delete(normalizedKey);
    }
  }

  async consume(key: string, options: RiskThrottleOptions): Promise<void> {
    await this.assertAllowed(key, options);
    await this.recordFailure(key, options);
  }

  async recordFailure(key: string, options: RiskThrottleOptions): Promise<void> {
    const normalizedKey = this.normalizeKey(key);
    const now = Date.now();
    const current = await this.store.get(normalizedKey);
    const entry =
      current && now - current.firstAttemptAt.getTime() <= options.windowMs
        ? current
        : {
            attempts: 0,
            firstAttemptAt: new Date(now)
          };

    entry.attempts += 1;

    if (entry.attempts >= options.maxAttempts) {
      entry.lockedUntil = new Date(now + options.lockMs);
    }

    await this.store.set(normalizedKey, entry);
  }

  async recordSuccess(key: string): Promise<void> {
    await this.store.delete(this.normalizeKey(key));
  }

  private normalizeKey(key: string): string {
    return key.trim().toLowerCase();
  }
}
