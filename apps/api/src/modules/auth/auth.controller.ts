import { Body, Controller, Get, Post } from "@nestjs/common";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import type { AuthUser } from "../../common/auth/auth-user.interface";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @Public()
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post("refresh")
  @Public()
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }

  @Post("logout")
  logout(@CurrentUser() user: AuthUser) {
    return this.authService.logout(user);
  }

  @Get("profile")
  getProfile(@CurrentUser() user: AuthUser) {
    return this.authService.getProfile(user.id, user.sessionId);
  }
}
