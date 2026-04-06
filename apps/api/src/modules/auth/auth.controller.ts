/** auth 模块控制器：负责路由声明、参数接收和权限边界，不直接处理持久化细节。 */
import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Public } from "@/common/decorators/public.decorator";
import type { AuthUser } from "@/common/auth/auth-user.interface";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { AuthService } from "./auth.service";
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
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
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
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }

  @Post("logout")
  @ApiOperation({
    summary: "退出当前会话",
    description: "退出当前会话。"
  })
  @ApiOkResponse({
    type: LogoutResponseVo
  })
  logout(@CurrentUser() user: AuthUser) {
    return this.authService.logout(user);
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
