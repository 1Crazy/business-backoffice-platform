import { PartialType } from "@nestjs/swagger";

import { CreateDictionaryEntryDto } from "./create-dictionary-entry.dto";

export class UpdateDictionaryEntryDto extends PartialType(CreateDictionaryEntryDto) {}

