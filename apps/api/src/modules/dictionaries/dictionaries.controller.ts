/** dictionaries 模块控制器：负责路由声明、参数接收和权限边界，不直接处理持久化细节。 */
import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import type { AuthUser } from "@/common/auth/auth-user.interface";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Permissions } from "@/common/decorators/permissions.decorator";
import { CreateDictionaryEntryDto } from "./dto/create-dictionary-entry.dto";
import { ListDictionariesDto } from "./dto/list-dictionaries.dto";
import { UpdateDictionaryEntryDto } from "./dto/update-dictionary-entry.dto";
import { DictionariesService } from "./dictionaries.service";
import { DictionaryEntryVo } from "./vo/dictionary-entry.vo";

@ApiTags("dictionaries")
@ApiBearerAuth()
@Controller("dictionaries")
export class DictionariesController {
  constructor(private readonly dictionariesService: DictionariesService) {}

  @Get()
  @Permissions("dictionary:read")
  @ApiOperation({
    summary: "查询字典条目列表",
    description: "查询字典条目列表。"
  })
  @ApiOkResponse({
    type: DictionaryEntryVo,
    isArray: true
  })
  list(@Query() query: ListDictionariesDto) {
    return this.dictionariesService.list(query);
  }

  @Post()
  @Permissions("dictionary:write")
  @ApiOperation({
    summary: "创建字典条目",
    description: "创建字典条目。"
  })
  @ApiOkResponse({
    type: DictionaryEntryVo
  })
  create(@Body() dto: CreateDictionaryEntryDto, @CurrentUser() user: AuthUser) {
    return this.dictionariesService.create(dto, user);
  }

  @Patch(":id")
  @Permissions("dictionary:write")
  @ApiOperation({
    summary: "更新字典条目",
    description: "更新字典条目。"
  })
  @ApiOkResponse({
    type: DictionaryEntryVo
  })
  update(@Param("id") id: string, @Body() dto: UpdateDictionaryEntryDto, @CurrentUser() user: AuthUser) {
    return this.dictionariesService.update(id, dto, user);
  }
}
