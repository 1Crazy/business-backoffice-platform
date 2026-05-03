import { Module } from "@nestjs/common";

import { RuntimeCacheService } from "@/common/cache/runtime-cache.service";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";
import { ProductConfigurationController } from "./product-configuration.controller";
import { ProductConfigurationRepository } from "./repositories/product-configuration.repository";
import { ProductConfigurationService } from "./product-configuration.service";

@Module({
  imports: [AuditLogsModule],
  controllers: [ProductConfigurationController],
  providers: [RuntimeCacheService, ProductConfigurationRepository, ProductConfigurationService],
  exports: [ProductConfigurationService]
})
export class ProductConfigurationModule {}
