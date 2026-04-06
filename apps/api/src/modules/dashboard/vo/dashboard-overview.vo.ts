/** dashboard 模块 VO：负责 Swagger 与接口返回契约，避免直接暴露持久化结构。 */
import { ApiProperty } from "@nestjs/swagger";

export class DashboardOverviewVo {
  @ApiProperty({
    description: "startDate 字段。",
format: "date-time"
  })
  startDate!: string;

  @ApiProperty({
    description: "endDate 字段。",
format: "date-time"
  })
  endDate!: string;

  @ApiProperty({
    description: "newCustomers 字段。"
  })
  newCustomers!: number;

  @ApiProperty({
    description: "followUpCount 字段。"
  })
  followUpCount!: number;

  @ApiProperty({
    description: "convertedLeads 字段。"
  })
  convertedLeads!: number;

  @ApiProperty({
    description: "totalLeads 字段。"
  })
  totalLeads!: number;

  @ApiProperty({
    description: "conversionRate 字段。"
  })
  conversionRate!: number;

  @ApiProperty({
    description: "pendingReminders 字段。"
  })
  pendingReminders!: number;
}
