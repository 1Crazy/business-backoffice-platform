import { ApiProperty } from "@nestjs/swagger";

export class DashboardOverviewResponseDto {
  @ApiProperty({
    format: "date-time"
  })
  startDate!: string;

  @ApiProperty({
    format: "date-time"
  })
  endDate!: string;

  @ApiProperty()
  newCustomers!: number;

  @ApiProperty()
  followUpCount!: number;

  @ApiProperty()
  convertedLeads!: number;

  @ApiProperty()
  totalLeads!: number;

  @ApiProperty()
  conversionRate!: number;

  @ApiProperty()
  pendingReminders!: number;
}
