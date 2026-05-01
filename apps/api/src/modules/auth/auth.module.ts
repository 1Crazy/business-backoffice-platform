/** auth 模块装配：负责聚合该领域的 controller、service 与跨模块依赖。 */
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

import { JwtStrategy } from "@/common/auth/jwt.strategy";
import { getJwtAccessTokenTtl, getRequiredJwtSecret } from "@/common/security/security-config.util";
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
          expiresIn: getJwtAccessTokenTtl(configService)
        }
      })
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, JwtStrategy],
  exports: [AuthService]
})
export class AuthModule {}
