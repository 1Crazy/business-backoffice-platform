/** uploads 模块控制器：负责路由声明、参数接收和权限边界，不直接处理持久化细节。 */
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

import { AttachmentVo } from "@/common/vo/entity.vo";
import type { AuthUser } from "@/common/auth/auth-user.interface";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Permissions } from "@/common/decorators/permissions.decorator";
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
  @ApiOperation({
    summary: "查询业务附件列表",
    description: "查询业务附件列表。"
  })
  @ApiOkResponse({
    type: AttachmentVo,
    isArray: true
  })
  list(@Query() query: ListUploadsDto, @CurrentUser() user: AuthUser) {
    return this.uploadsService.list(query, user);
  }

  @Post()
  @Permissions("upload:write")
  @ApiOperation({
    summary: "上传业务附件",
    description: "上传客户或线索附件，并返回落库后的附件元数据。"
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    description: "上传附件需要同时提供业务类型、业务实体 ID 和二进制文件。",
    schema: {
      type: "object",
      required: ["businessType", "businessId", "file"],
      properties: {
        businessType: {
          type: "string",
          enum: Object.values(AttachmentBusinessType),
          description: "附件归属的业务类型，例如 CUSTOMER 或 LEAD。"
        },
        businessId: {
          type: "string",
          description: "附件归属的业务实体 ID。"
        },
        file: {
          type: "string",
          format: "binary",
          description: "待上传的二进制附件内容。"
        }
      }
    }
  })
  @UseInterceptors(
	    FileInterceptor("file", {
	      storage: memoryStorage(),
	      limits: {
	        fileSize: MAX_ATTACHMENT_SIZE_BYTES,
	        files: 1,
	        fields: 2
	      }
	    })
	  )
  @ApiOkResponse({
    type: AttachmentVo
  })
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
    summary: "下载业务附件",
    description: "按附件 ID 下载原始文件内容，并在响应头中返回 MIME 类型、文件名和文件大小。"
  })
  @ApiOkResponse({
    description: "返回二进制文件流；调用方应按响应头中的 Content-Type 和 Content-Disposition 处理下载。"
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

  @Get(":id/preview")
  @ApiOperation({
    summary: "预览业务附件",
    description: "按附件 ID 安全预览受支持的附件内容，并保留访问审计记录。"
  })
  @ApiOkResponse({
    description: "返回可内联渲染的二进制文件流；仅支持 PDF、图片和文本类附件。"
  })
  async preview(@Param("id") id: string, @CurrentUser() user: AuthUser, @Res({ passthrough: true }) response: Response) {
    const file = await this.uploadsService.preview(id, user);
    const encodedFileName = encodeURIComponent(file.attachment.originalName);

    response.setHeader("Content-Type", file.attachment.mimeType);
    response.setHeader("Content-Disposition", `inline; filename*=UTF-8''${encodedFileName}`);
    response.setHeader("Cache-Control", "private, no-store, max-age=0");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Content-Security-Policy", "default-src 'none'; img-src 'self' data: blob:; style-src 'unsafe-inline';");

    if (typeof file.size === "number") {
      response.setHeader("Content-Length", String(file.size));
    }

    return new StreamableFile(file.stream);
  }
}
