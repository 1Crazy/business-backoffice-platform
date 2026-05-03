/** auth 模块 DTO：负责接口入参校验和类型约束，不承载业务副作用。 */

export class RefreshTokenDto {
  /**
   * 刷新令牌只允许来自 HttpOnly Cookie。
   * 保留空 DTO 是为了让旧客户端提交 body 字段时被全局 forbidNonWhitelisted 拒绝。
   */
}
