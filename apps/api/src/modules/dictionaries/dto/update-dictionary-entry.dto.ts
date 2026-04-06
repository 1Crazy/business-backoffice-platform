/** dictionaries 模块 DTO：负责接口入参校验和类型约束，不承载业务副作用。 */
import { PartialType } from "@nestjs/swagger";

import { CreateDictionaryEntryDto } from "./create-dictionary-entry.dto";

export class UpdateDictionaryEntryDto extends PartialType(CreateDictionaryEntryDto) {}

