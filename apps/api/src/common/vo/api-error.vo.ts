import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/** 通用错误响应 VO：统一描述接口异常时返回的 HTTP 结构。 */
export class ApiErrorResponseVo {
  @ApiProperty({
    description: "HTTP 状态码。",
    example: 400
  })
  statusCode!: number;

  @ApiProperty({
    description: "面向调用方的错误消息；校验失败时可能是字符串数组。",
    oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }]
  })
  message!: string | string[];

  @ApiPropertyOptional({
    description: "业务异常名称或错误码；部分场景下可能不存在。",
    example: "ForbiddenException",
    nullable: true
  })
  error?: string | null;

  @ApiProperty({
    description: "请求路径。",
    example: "/api/customers"
  })
  path!: string;

  @ApiProperty({
    description: "错误返回时间。",
    format: "date-time"
  })
  timestamp!: string;
}
