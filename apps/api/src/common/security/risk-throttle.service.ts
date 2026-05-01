/** 轻量风险限流：为登录、刷新令牌和开放接口凭证校验提供进程内失败窗口。 */
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";

interface RiskThrottleOptions {
  maxAttempts: number;
  windowMs: number;
  lockMs: number;
}

interface RiskThrottleEntry {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil?: number;
}

@Injectable()
export class RiskThrottleService {
  private readonly entries = new Map<string, RiskThrottleEntry>();

  assertAllowed(key: string, options: RiskThrottleOptions): void {
    const normalizedKey = this.normalizeKey(key);
    const entry = this.entries.get(normalizedKey);
    const now = Date.now();

    if (!entry) {
      return;
    }

    if (entry.lockedUntil && entry.lockedUntil > now) {
      throw new HttpException("Too many failed attempts. Please try again later.", HttpStatus.TOO_MANY_REQUESTS);
    }

    if (entry.lockedUntil || now - entry.firstAttemptAt > options.windowMs) {
      this.entries.delete(normalizedKey);
    }
  }

  recordFailure(key: string, options: RiskThrottleOptions): void {
    const normalizedKey = this.normalizeKey(key);
    const now = Date.now();
    const current = this.entries.get(normalizedKey);
    const entry =
      current && now - current.firstAttemptAt <= options.windowMs
        ? current
        : {
            attempts: 0,
            firstAttemptAt: now
          };

    entry.attempts += 1;

    if (entry.attempts >= options.maxAttempts) {
      entry.lockedUntil = now + options.lockMs;
    }

    this.entries.set(normalizedKey, entry);
  }

  recordSuccess(key: string): void {
    this.entries.delete(this.normalizeKey(key));
  }

  private normalizeKey(key: string): string {
    return key.trim().toLowerCase();
  }
}
