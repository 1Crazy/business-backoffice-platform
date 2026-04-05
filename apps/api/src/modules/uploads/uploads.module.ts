import { Module } from "@nestjs/common";

import { LocalAttachmentStorageDriver } from "./storage/local-attachment-storage.driver";
import { ATTACHMENT_STORAGE_DRIVER } from "./storage/attachment-storage.driver";
import { UploadsController } from "./uploads.controller";
import { UploadsService } from "./uploads.service";

@Module({
  controllers: [UploadsController],
  providers: [
    UploadsService,
    LocalAttachmentStorageDriver,
    {
      provide: ATTACHMENT_STORAGE_DRIVER,
      useExisting: LocalAttachmentStorageDriver
    }
  ]
})
export class UploadsModule {}
