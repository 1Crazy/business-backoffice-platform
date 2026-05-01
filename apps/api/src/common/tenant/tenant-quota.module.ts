/** tenant quota 模块：向所有业务写入入口导出统一的租户配额校验能力。 */
import { Global, Module } from "@nestjs/common";

import { TenantQuotaRepository } from "./repositories/tenant-quota.repository";
import { TenantQuotaService } from "./tenant-quota.service";

@Global()
@Module({
  providers: [TenantQuotaService, TenantQuotaRepository],
  exports: [TenantQuotaService]
})
export class TenantQuotaModule {}
