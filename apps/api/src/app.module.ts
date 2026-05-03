/** 根模块：负责聚合全局基础设施与各业务模块，为应用启动提供统一装配入口。 */
import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";

import { AppController } from "./app.controller";
import { DataScopeModule } from "./common/data-scope/data-scope.module";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { ApiRateLimitGuard } from "./common/guards/api-rate-limit.guard";
import { CsrfGuard } from "./common/guards/csrf.guard";
import { PermissionsGuard } from "./common/guards/permissions.guard";
import { JobQueueModule } from "./common/job-queue/job-queue.module";
import { ObservabilityModule } from "./common/observability/observability.module";
import { RequestObservabilityMiddleware } from "./common/observability/request-observability.middleware";
import { PrismaModule } from "./common/prisma/prisma.module";
import { RiskThrottleModule } from "./common/security/risk-throttle.module";
import { TenantQuotaModule } from "./common/tenant/tenant-quota.module";
import { AuditLogsModule } from "./modules/audit-logs/audit-logs.module";
import { AuthModule } from "./modules/auth/auth.module";
import { BatchTasksModule } from "./modules/batch-tasks/batch-tasks.module";
import { CustomersModule } from "./modules/customers/customers.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { DepartmentsModule } from "./modules/departments/departments.module";
import { DictionariesModule } from "./modules/dictionaries/dictionaries.module";
import { LeadsModule } from "./modules/leads/leads.module";
import { NotificationCenterModule } from "./modules/notification-center/notification-center.module";
import { OfficeAutomationModule } from "./modules/office-automation/office-automation.module";
import { OpenIntegrationModule } from "./modules/open-integration/open-integration.module";
import { RolesModule } from "./modules/roles/roles.module";
import { ProductConfigurationModule } from "./modules/product-configuration/product-configuration.module";
import { RevenueOperationsModule } from "./modules/revenue-operations/revenue-operations.module";
import { SalesOpportunitiesModule } from "./modules/sales-opportunities/sales-opportunities.module";
import { SystemGovernanceModule } from "./modules/system-governance/system-governance.module";
import { TenantOperationsModule } from "./modules/tenant-operations/tenant-operations.module";
import { UnifiedWorkfeedModule } from "./modules/unified-workfeed/unified-workfeed.module";
import { UploadsModule } from "./modules/uploads/uploads.module";
import { UsersModule } from "./modules/users/users.module";
import { WorkflowModule } from "./modules/workflow/workflow.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", ".env.local"]
    }),
    PrismaModule,
    ObservabilityModule,
    JobQueueModule,
    RiskThrottleModule,
    TenantQuotaModule,
    DataScopeModule,
    AuditLogsModule,
    AuthModule,
    BatchTasksModule,
    DepartmentsModule,
    UsersModule,
    RolesModule,
    ProductConfigurationModule,
    CustomersModule,
    LeadsModule,
    SalesOpportunitiesModule,
    RevenueOperationsModule,
    UnifiedWorkfeedModule,
    SystemGovernanceModule,
    TenantOperationsModule,
    DashboardModule,
    DictionariesModule,
    OfficeAutomationModule,
    NotificationCenterModule,
    OpenIntegrationModule,
    UploadsModule,
    WorkflowModule
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard
    },
    {
      provide: APP_GUARD,
      useClass: ApiRateLimitGuard
    },
    {
      provide: APP_GUARD,
      useClass: CsrfGuard
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard
    }
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestObservabilityMiddleware).forRoutes("*");
  }
}
