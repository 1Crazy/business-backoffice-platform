/** auth 模块装配：负责聚合该领域的 controller、service 与跨模块依赖。 */
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

import { JwtStrategy } from "@/common/auth/jwt.strategy";
import { getRequiredJwtSecret } from "@/common/security/security-config.util";
import { RiskThrottleService } from "@/common/security/risk-throttle.service";
import { AuthController } from "./auth.controller";
import { AuthRepository } from "./repositories/auth.repository";
import { AuthService } from "./auth.service";

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: getRequiredJwtSecret(configService),
        signOptions: {
          expiresIn: "12h"
        }
      })
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, JwtStrategy, RiskThrottleService],
  exports: [AuthService]
})
export class AuthModule {}
