import { Body, Controller, Get, Param, Post, Req, Res } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";

import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Public } from "@/common/decorators/public.decorator";
import { Permissions } from "@/common/decorators/permissions.decorator";
import type { AuthUser } from "@/common/auth/auth-user.interface";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { RequestPasswordResetDto } from "./dto/request-password-reset.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { ConfigureMfaDto } from "./dto/configure-mfa.dto";
import { VerifyLoginMfaDto } from "./dto/verify-login-mfa.dto";
import { VerifyMfaDto } from "./dto/verify-mfa.dto";
import { AuthService } from "./auth.service";
import { RequireCsrf } from "@/common/decorators/require-csrf.decorator";
import {
  clearAuthCookies,
  readRefreshTokenCookie,
  setAuthCookies,
  toClientLoginResponse
} from "./auth-cookie.util";
import {
  CurrentUserVo,
  LoginResponseVo,
  LogoutResponseVo,
  MfaStatusVo,
  MfaSetupVo,
  PasswordResetRequestVo,
  PasswordResetTokenVo,
  UserSessionVo
} from "./vo/auth.vo";

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
    if (loginResponse.success) {
      setAuthCookies(response, loginResponse.accessToken, loginResponse.refreshToken);
    } else {
      clearAuthCookies(response);
    }
    return toClientLoginResponse(loginResponse);
  }

  @Post("mfa/login/verify")
  @Public()
  @ApiOkResponse({
    type: LoginResponseVo
  })
  async verifyLoginMfa(@Body() dto: VerifyLoginMfaDto, @Res({ passthrough: true }) response: Response) {
    const loginResponse = await this.authService.verifyLoginMfa(dto);
    setAuthCookies(response, loginResponse.accessToken, loginResponse.refreshToken);
    return toClientLoginResponse(loginResponse);
  }

  @Post("refresh")
  @Public()
  @RequireCsrf()
  @ApiOperation({
    summary: "刷新访问令牌",
    description: "刷新访问令牌。"
  })
  @ApiOkResponse({
    type: LoginResponseVo
  })
  async refresh(@Body() _dto: RefreshTokenDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const refreshToken = readRefreshTokenCookie(request.headers.cookie);
    const loginResponse = await this.authService.refresh({ refreshToken });
    setAuthCookies(response, loginResponse.accessToken, loginResponse.refreshToken);
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
    clearAuthCookies(response);
    return result;
  }

  @Post("password-reset/request")
  @Public()
  @ApiOkResponse({
    type: PasswordResetTokenVo
  })
  requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto);
  }

  @Post("password-reset/confirm")
  @Public()
  @ApiOkResponse({
    type: PasswordResetRequestVo
  })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post("mfa/configure")
  @ApiOkResponse({
    type: MfaSetupVo
  })
  configureMfa(@CurrentUser() user: AuthUser, @Body() dto: ConfigureMfaDto) {
    return this.authService.configureMfa(user, dto);
  }

  @Post("mfa/verify")
  @ApiOkResponse({
    type: PasswordResetRequestVo
  })
  verifyMfa(@CurrentUser() user: AuthUser, @Body() dto: VerifyMfaDto) {
    return this.authService.verifyMfa(user, dto);
  }

  @Get("mfa/status")
  @ApiOkResponse({
    type: MfaStatusVo
  })
  getMfaStatus(@CurrentUser() user: AuthUser) {
    return this.authService.getMfaStatus(user);
  }

  @Get("sessions")
  @ApiOperation({
    summary: "查询当前账号会话",
    description: "查询当前账号在本租户下的会话列表。"
  })
  @ApiOkResponse({
    type: UserSessionVo,
    isArray: true
  })
  listMySessions(@CurrentUser() user: AuthUser) {
    return this.authService.listMySessions(user);
  }

  @Post("sessions/:id/revoke")
  @ApiOperation({
    summary: "撤销当前账号的其他会话",
    description: "撤销当前账号在其他设备上的活跃会话；当前会话应通过 logout 退出。"
  })
  @ApiOkResponse({
    type: LogoutResponseVo
  })
  revokeMySession(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.authService.revokeMySession(id, user);
  }

  @Get("users/:userId/sessions")
  @Permissions("user:write")
  @ApiOperation({
    summary: "管理员查询员工会话",
    description: "授权管理员查询同租户员工的会话列表。"
  })
  @ApiOkResponse({
    type: UserSessionVo,
    isArray: true
  })
  listUserSessionsForAdmin(@Param("userId") userId: string, @CurrentUser() user: AuthUser) {
    return this.authService.listUserSessionsForAdmin(userId, user);
  }

  @Post("users/:userId/sessions/:id/revoke")
  @Permissions("user:write")
  @ApiOperation({
    summary: "管理员撤销员工会话",
    description: "授权管理员撤销同租户员工的活跃会话。"
  })
  @ApiOkResponse({
    type: LogoutResponseVo
  })
  revokeUserSessionForAdmin(@Param("userId") userId: string, @Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.authService.revokeUserSessionForAdmin(userId, id, user);
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
