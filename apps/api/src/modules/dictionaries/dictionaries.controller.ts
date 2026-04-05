import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";

import type { AuthUser } from "../../common/auth/auth-user.interface";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { CreateDictionaryEntryDto } from "./dto/create-dictionary-entry.dto";
import { ListDictionariesDto } from "./dto/list-dictionaries.dto";
import { UpdateDictionaryEntryDto } from "./dto/update-dictionary-entry.dto";
import { DictionariesService } from "./dictionaries.service";

@Controller("dictionaries")
export class DictionariesController {
  constructor(private readonly dictionariesService: DictionariesService) {}

  @Get()
  @Permissions("dictionary:read")
  list(@Query() query: ListDictionariesDto) {
    return this.dictionariesService.list(query);
  }

  @Post()
  @Permissions("dictionary:write")
  create(@Body() dto: CreateDictionaryEntryDto, @CurrentUser() user: AuthUser) {
    return this.dictionariesService.create(dto, user);
  }

  @Patch(":id")
  @Permissions("dictionary:write")
  update(@Param("id") id: string, @Body() dto: UpdateDictionaryEntryDto, @CurrentUser() user: AuthUser) {
    return this.dictionariesService.update(id, dto, user);
  }
}

