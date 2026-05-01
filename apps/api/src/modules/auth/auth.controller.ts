import { Body, Controller, Get, Post, Req, Res } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";

import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Public } from "@/common/decorators/public.decorator";
import type { AuthUser } from "@/common/auth/auth-user.interface";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { AuthService } from "./auth.service";
import {
  clearRefreshTokenCookie,
  readRefreshTokenCookie,
  setRefreshTokenCookie,
  toClientLoginResponse
} from "./auth-cookie.util";
import { CurrentUserVo, LoginResponseVo, LogoutResponseVo } from "./vo/auth.vo";

@ApiTags("auth")
@ApiBearerAuth()
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @Public()
  @ApiOperation({
    summary: "账号密码登录",
    description: "账号密码登录。"
  })
  @ApiOkResponse({
    type: LoginResponseVo
  })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const loginResponse = await this.authService.login(dto);
    setRefreshTokenCookie(response, loginResponse.refreshToken);
    return toClientLoginResponse(loginResponse);
  }

  @Post("refresh")
  @Public()
  @ApiOperation({
    summary: "刷新访问令牌",
    description: "刷新访问令牌。"
  })
  @ApiOkResponse({
    type: LoginResponseVo
  })
  async refresh(@Body() dto: RefreshTokenDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const refreshToken = readRefreshTokenCookie(request.headers.cookie) ?? dto.refreshToken;
    const loginResponse = await this.authService.refresh({ refreshToken });
    setRefreshTokenCookie(response, loginResponse.refreshToken);
    return toClientLoginResponse(loginResponse);
  }

  @Post("logout")
  @ApiOperation({
    summary: "退出当前会话",
    description: "退出当前会话。"
  })
  @ApiOkResponse({
    type: LogoutResponseVo
  })
  async logout(@CurrentUser() user: AuthUser, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.logout(user);
    clearRefreshTokenCookie(response);
    return result;
  }

  @Get("profile")
  @ApiOperation({
    summary: "获取当前登录用户资料",
    description: "获取当前登录用户资料。"
  })
  @ApiOkResponse({
    type: CurrentUserVo
  })
  getProfile(@CurrentUser() user: AuthUser) {
    return this.authService.getProfile(user.id, user.sessionId);
  }
}
