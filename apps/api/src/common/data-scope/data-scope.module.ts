/** 数据范围能力：负责把角色数据范围规则转换为可复用的查询过滤与权限校验逻辑。 */
import { Global, Module } from "@nestjs/common";

import { AccessPolicyService } from "../access-policy/access-policy.service";
import { RuntimeCacheService } from "../cache/runtime-cache.service";
import { DataScopeService } from "./data-scope.service";

@Global()
@Module({
  providers: [RuntimeCacheService, DataScopeService, AccessPolicyService],
  exports: [RuntimeCacheService, DataScopeService, AccessPolicyService]
})
export class DataScopeModule {}
