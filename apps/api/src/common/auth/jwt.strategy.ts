/** 认证基础设施：负责承载当前登录用户上下文和 JWT 鉴权相关能力。 */
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

import type { AuthUser } from "./auth-user.interface";
import { AuthService } from "@/modules/auth/auth.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_SECRET", "replace-with-a-long-secret")
    });
  }

  async validate(payload: AuthUser): Promise<AuthUser> {
    return this.authService.validateSessionPayload(payload);
  }
}
