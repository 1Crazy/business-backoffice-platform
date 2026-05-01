/** 风险限流模块：按运行环境选择内存或数据库 store，并向认证/开放平台共享同一服务实例。 */
import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { getRiskThrottleStoreMode } from "./security-config.util";
import { DatabaseRiskThrottleStore } from "./repositories/database-risk-throttle.store";
import {
  InMemoryRiskThrottleStore,
  RISK_THROTTLE_STORE,
  RiskThrottleService,
  type RiskThrottleStore
} from "./risk-throttle.service";

@Global()
@Module({
  providers: [
    InMemoryRiskThrottleStore,
    DatabaseRiskThrottleStore,
    {
      provide: RISK_THROTTLE_STORE,
      inject: [ConfigService, InMemoryRiskThrottleStore, DatabaseRiskThrottleStore],
      useFactory: (
        configService: ConfigService,
        memoryStore: InMemoryRiskThrottleStore,
        databaseStore: DatabaseRiskThrottleStore
      ): RiskThrottleStore => {
        return getRiskThrottleStoreMode(configService) === "database" ? databaseStore : memoryStore;
      }
    },
    RiskThrottleService
  ],
  exports: [RiskThrottleService]
})
export class RiskThrottleModule {}
