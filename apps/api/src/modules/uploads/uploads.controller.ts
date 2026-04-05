import { randomUUID } from "crypto";
import { mkdirSync } from "fs";
import { join } from "path";

import { Body, Controller, Get, Post, Query, UploadedFile, UseInterceptors } from "@nestjs/common";
import { AttachmentBusinessType } from "@prisma/client";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";

import type { AuthUser } from "../../common/auth/auth-user.interface";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ListUploadsDto } from "./dto/list-uploads.dto";
import { UploadsService } from "./uploads.service";

const uploadDir = join(process.cwd(), "uploads");
mkdirSync(uploadDir, { recursive: true });

@Controller("uploads")
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Get()
  @Permissions("upload:write")
  list(@Query() query: ListUploadsDto) {
    return this.uploadsService.list(query);
  }

  @Post()
  @Permissions("upload:write")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: uploadDir,
        filename: (_req, file, callback) => {
          const extension = file.originalname.includes(".") ? file.originalname.slice(file.originalname.lastIndexOf(".")) : "";
          callback(null, `${randomUUID()}${extension}`);
        }
      })
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
}

