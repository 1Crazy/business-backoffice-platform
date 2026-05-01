/** auth 模块控制器：负责路由声明、参数接收和权限边界，不直接处理持久化细节。 */
import { Body, Controller, Get, Post, Req, Res } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";

import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Public } from "@/common/decorators/public.decorator";
import type { AuthUser } from "@/common/auth/auth-user.interface";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { AuthService } from "./auth.service";
import { CurrentUserVo, LoginResponseVo, LogoutResponseVo } from "./vo/auth.vo";

const REFRESH_TOKEN_COOKIE_NAME = "platform_refresh_token";
const REFRESH_COOKIE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;

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
    this.setRefreshTokenCookie(response, loginResponse.refreshToken);
    return loginResponse;
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
    const refreshToken = dto.refreshToken ?? this.readCookie(request.headers.cookie, REFRESH_TOKEN_COOKIE_NAME);
    const loginResponse = await this.authService.refresh({ refreshToken });
    this.setRefreshTokenCookie(response, loginResponse.refreshToken);
    return loginResponse;
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
    this.clearRefreshTokenCookie(response);
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

  private setRefreshTokenCookie(response: Response, refreshToken: string): void {
    response.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: REFRESH_COOKIE_MAX_AGE_MS,
      path: "/api/auth"
    });
  }

  private clearRefreshTokenCookie(response: Response): void {
    response.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/api/auth"
    });
  }

  private readCookie(cookieHeader: string | undefined, name: string): string | undefined {
    return cookieHeader
      ?.split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith(`${name}=`))
      ?.slice(name.length + 1);
  }
}
