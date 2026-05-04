import { Body, Controller, Get, Param, Post, Req, Res } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";

import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Public } from "@/common/decorators/public.decorator";
import { Permissions } from "@/common/decorators/permissions.decorator";
import { ApiCommonErrorResponses } from "@/common/swagger/common-error-responses.decorator";
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
    description: "使用用户名和密码发起登录；命中高风险策略时会返回 MFA 挑战而不是直接建立完整登录态。"
  })
  @ApiOkResponse({
    type: LoginResponseVo
  })
  @ApiCommonErrorResponses({
    badRequest: "用户名或密码格式不合法，或登录参数缺失。",
    forbidden: "账号已被禁用，或当前登录请求触发了安全限制。"
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
  @ApiOperation({
    summary: "验证登录 MFA 挑战",
    description: "提交登录阶段返回的 MFA ticket 与动态验证码，验证通过后才会建立完整登录态。"
  })
  @ApiOkResponse({
    type: LoginResponseVo
  })
  @ApiCommonErrorResponses({
    badRequest: "ticket 或动态验证码格式不合法，或挑战状态已失效。",
    forbidden: "动态验证码错误、挑战已过期，或当前账号不允许继续登录。"
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
    description: "基于 HttpOnly Cookie 中的 refresh token 刷新访问令牌；请求体不接受明文 refresh token。"
  })
  @ApiOkResponse({
    type: LoginResponseVo
  })
  @ApiCommonErrorResponses({
    badRequest: "请求未满足 CSRF 要求，或仍在请求体中提交了不被允许的字段。",
    unauthorized: "refresh token 缺失、已失效、已撤销或已被轮换。",
    forbidden: "当前请求未通过 CSRF 安全校验。"
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
    description: "撤销当前会话、清理 refresh cookie，并使当前浏览器登录态失效。"
  })
  @ApiOkResponse({
    type: LogoutResponseVo
  })
  @ApiCommonErrorResponses({
    unauthorized: "当前请求没有有效登录身份，无法执行退出。",
    forbidden: "当前请求未通过安全校验。"
  })
  async logout(@CurrentUser() user: AuthUser, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.logout(user);
    clearAuthCookies(response);
    return result;
  }

  @Post("password-reset/request")
  @Public()
  @ApiOperation({
    summary: "申请重置密码",
    description: "提交用户名或已验证邮箱，由系统受理密码重置申请并返回受理结果。"
  })
  @ApiOkResponse({
    type: PasswordResetTokenVo
  })
  @ApiCommonErrorResponses({
    badRequest: "用户名或邮箱格式不合法。"
  })
  requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto);
  }

  @Post("password-reset/confirm")
  @Public()
  @ApiOperation({
    summary: "确认重置密码",
    description: "提交重置令牌和新密码，验证通过后完成密码更新。"
  })
  @ApiOkResponse({
    type: PasswordResetRequestVo
  })
  @ApiCommonErrorResponses({
    badRequest: "重置令牌或新密码格式不合法。",
    forbidden: "重置令牌无效、已过期，或当前操作不被允许。"
  })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post("mfa/configure")
  @ApiOperation({
    summary: "配置 MFA",
    description: "用于开始绑定、确认绑定、轮换恢复码或关闭 MFA；具体行为由 action 字段决定。"
  })
  @ApiOkResponse({
    type: MfaSetupVo
  })
  @ApiCommonErrorResponses({
    badRequest: "配置动作、验证码或恢复码格式不合法。",
    unauthorized: "当前请求没有有效登录身份。",
    forbidden: "验证码错误、恢复码不可用，或当前账号不允许修改 MFA。"
  })
  configureMfa(@CurrentUser() user: AuthUser, @Body() dto: ConfigureMfaDto) {
    return this.authService.configureMfa(user, dto);
  }

  @Post("mfa/verify")
  @ApiOperation({
    summary: "验证已配置的 MFA",
    description: "验证当前账号提交的 MFA 动态验证码或恢复码，常用于完成配置后的确认动作。"
  })
  @ApiOkResponse({
    type: PasswordResetRequestVo
  })
  @ApiCommonErrorResponses({
    badRequest: "动态验证码格式不合法。",
    unauthorized: "当前请求没有有效登录身份。",
    forbidden: "动态验证码错误、恢复码已失效，或 MFA 状态不允许当前操作。"
  })
  verifyMfa(@CurrentUser() user: AuthUser, @Body() dto: VerifyMfaDto) {
    return this.authService.verifyMfa(user, dto);
  }

  @Get("mfa/status")
  @ApiOperation({
    summary: "查询 MFA 状态",
    description: "查询当前登录账号是否启用了 MFA、是否存在待确认绑定，以及最近配置时间。"
  })
  @ApiOkResponse({
    type: MfaStatusVo
  })
  @ApiCommonErrorResponses({
    unauthorized: "当前请求没有有效登录身份。"
  })
  getMfaStatus(@CurrentUser() user: AuthUser) {
    return this.authService.getMfaStatus(user);
  }

  @Get("sessions")
  @ApiOperation({
    summary: "查询当前账号会话",
    description: "查询当前登录账号在本租户下的活跃与历史会话，用于终端治理和安全排查。"
  })
  @ApiOkResponse({
    type: UserSessionVo,
    isArray: true
  })
  @ApiCommonErrorResponses({
    unauthorized: "当前请求没有有效登录身份。"
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
  @ApiCommonErrorResponses({
    unauthorized: "当前请求没有有效登录身份。",
    notFound: "未找到指定会话，或该会话不属于当前账号。"
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
  @ApiCommonErrorResponses({
    unauthorized: "当前请求没有有效登录身份。",
    forbidden: "当前账号没有管理员级会话查询权限。",
    notFound: "未找到目标员工，或目标员工不属于当前租户。"
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
  @ApiCommonErrorResponses({
    unauthorized: "当前请求没有有效登录身份。",
    forbidden: "当前账号没有管理员级会话撤销权限。",
    notFound: "未找到目标员工或目标会话。"
  })
  revokeUserSessionForAdmin(@Param("userId") userId: string, @Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.authService.revokeUserSessionForAdmin(userId, id, user);
  }

  @Get("profile")
  @ApiOperation({
    summary: "获取当前登录用户资料",
    description: "获取当前登录用户的租户、角色、权限和数据范围摘要，供前端初始化权限上下文。"
  })
  @ApiOkResponse({
    type: CurrentUserVo
  })
  @ApiCommonErrorResponses({
    unauthorized: "当前请求没有有效登录身份。"
  })
  getProfile(@CurrentUser() user: AuthUser) {
    return this.authService.getProfile(user.id, user.sessionId);
  }
}
