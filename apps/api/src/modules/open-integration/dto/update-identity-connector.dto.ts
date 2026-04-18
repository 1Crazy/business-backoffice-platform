import { PartialType } from "@nestjs/swagger";

import { CreateIdentityConnectorDto } from "./create-identity-connector.dto";

export class UpdateIdentityConnectorDto extends PartialType(CreateIdentityConnectorDto) {}
