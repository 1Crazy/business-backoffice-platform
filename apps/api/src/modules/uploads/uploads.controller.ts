import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags
} from "@nestjs/swagger";
import { AttachmentBusinessType } from "@prisma/client";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import type { Response } from "express";

import type { AuthUser } from "../../common/auth/auth-user.interface";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ListUploadsDto } from "./dto/list-uploads.dto";
import { MAX_ATTACHMENT_SIZE_BYTES } from "./uploads.constants";
import { UploadsService } from "./uploads.service";

@ApiTags("uploads")
@ApiBearerAuth()
@Controller("uploads")
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Get()
  @Permissions("upload:write")
  list(@Query() query: ListUploadsDto, @CurrentUser() user: AuthUser) {
    return this.uploadsService.list(query, user);
  }

  @Post()
  @Permissions("upload:write")
  @ApiOperation({
    summary: "上传业务附件"
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["businessType", "businessId", "file"],
      properties: {
        businessType: {
          type: "string",
          enum: Object.values(AttachmentBusinessType)
        },
        businessId: {
          type: "string"
        },
        file: {
          type: "string",
          format: "binary"
        }
      }
    }
  })
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: {
        fileSize: MAX_ATTACHMENT_SIZE_BYTES
      }
    })
  )
  upload(
    @Body("businessType") businessType: AttachmentBusinessType,
    @Body("businessId") businessId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthUser
  ) {
    return this.uploadsService.create(
      {
        businessType,
        businessId,
        file
      },
      user
    );
  }

  @Get(":id/download")
  @ApiOperation({
    summary: "下载业务附件"
  })
  @ApiOkResponse({
    description: "附件文件流返回。"
  })
  async download(@Param("id") id: string, @CurrentUser() user: AuthUser, @Res({ passthrough: true }) response: Response) {
    const file = await this.uploadsService.download(id, user);
    const encodedFileName = encodeURIComponent(file.attachment.originalName);

    response.setHeader("Content-Type", file.attachment.mimeType);
    response.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodedFileName}`);

    if (typeof file.size === "number") {
      response.setHeader("Content-Length", String(file.size));
    }

    return new StreamableFile(file.stream);
  }
}
