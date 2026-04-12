import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";

import {
  TODO_TYPES,
  WORKFEED_DOMAINS,
  WORKFEED_PRIORITIES,
  type WorkfeedDomain,
  type WorkfeedPriority,
  type WorkfeedTodoType
} from "../unified-workfeed.constants";

export class ListWorkfeedTodosDto {
  @ApiPropertyOptional({
    enum: WORKFEED_DOMAINS,
    description: "按业务域筛选待办。"
  })
  @IsOptional()
  @IsEnum(WORKFEED_DOMAINS)
  domain?: WorkfeedDomain;

  @ApiPropertyOptional({
    enum: TODO_TYPES,
    description: "按待办类型筛选。"
  })
  @IsOptional()
  @IsEnum(TODO_TYPES)
  type?: WorkfeedTodoType;

  @ApiPropertyOptional({
    enum: WORKFEED_PRIORITIES,
    description: "按优先级筛选。"
  })
  @IsOptional()
  @IsEnum(WORKFEED_PRIORITIES)
  priority?: WorkfeedPriority;
}
