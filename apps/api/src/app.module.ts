import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";

import { AppController } from "./app.controller";
import { DataScopeModule } from "./common/data-scope/data-scope.module";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { PermissionsGuard } from "./common/guards/permissions.guard";
import { PrismaModule } from "./common/prisma/prisma.module";
import { AuditLogsModule } from "./modules/audit-logs/audit-logs.module";
import { AuthModule } from "./modules/auth/auth.module";
import { CustomersModule } from "./modules/customers/customers.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { DepartmentsModule } from "./modules/departments/departments.module";
import { DictionariesModule } from "./modules/dictionaries/dictionaries.module";
import { LeadsModule } from "./modules/leads/leads.module";
import { RolesModule } from "./modules/roles/roles.module";
import { UploadsModule } from "./modules/uploads/uploads.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", ".env.local"]
    }),
    PrismaModule,
    DataScopeModule,
    AuditLogsModule,
    AuthModule,
    DepartmentsModule,
    UsersModule,
    RolesModule,
    CustomersModule,
    LeadsModule,
    DashboardModule,
    DictionariesModule,
    UploadsModule
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard
    }
  ]
})
export class AppModule {}
