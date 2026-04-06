/** uploads 模块装配：负责聚合该领域的 controller、service 与跨模块依赖。 */
import { Module } from "@nestjs/common";

import { LocalAttachmentStorageDriver } from "./storage/local-attachment-storage.driver";
import { UploadsRepository } from "./repositories/uploads.repository";
import { ATTACHMENT_STORAGE_DRIVER } from "./storage/attachment-storage.driver";
import { UploadsController } from "./uploads.controller";
import { UploadsService } from "./uploads.service";

@Module({
  controllers: [UploadsController],
  providers: [
    UploadsService,
    UploadsRepository,
    LocalAttachmentStorageDriver,
    {
      provide: ATTACHMENT_STORAGE_DRIVER,
      useExisting: LocalAttachmentStorageDriver
    }
  ]
})
export class UploadsModule {}
