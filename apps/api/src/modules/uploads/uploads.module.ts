/** uploads 模块装配：负责聚合该领域的 controller、service 与跨模块依赖。 */
import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { SystemGovernanceModule } from "../system-governance/system-governance.module";
import { AttachmentScanService } from "./attachment-scan.service";
import { LocalAttachmentStorageDriver } from "./storage/local-attachment-storage.driver";
import { ObjectStorageAttachmentStorageDriver } from "./storage/object-storage-attachment-storage.driver";
import { UploadsRepository } from "./repositories/uploads.repository";
import { ATTACHMENT_STORAGE_DRIVER } from "./storage/attachment-storage.driver";
import { UploadsController } from "./uploads.controller";
import { ATTACHMENT_STORAGE_DRIVER_MODES, type AttachmentStorageDriverMode } from "./uploads.constants";
import { UploadsService } from "./uploads.service";

@Module({
  imports: [SystemGovernanceModule],
  controllers: [UploadsController],
  providers: [
    UploadsService,
    UploadsRepository,
    AttachmentScanService,
    LocalAttachmentStorageDriver,
    ObjectStorageAttachmentStorageDriver,
    {
      provide: ATTACHMENT_STORAGE_DRIVER,
      useFactory: (
        configService: ConfigService,
        localDriver: LocalAttachmentStorageDriver,
        objectStorageDriver: ObjectStorageAttachmentStorageDriver
      ) => {
        const rawMode = (configService.get<string>("ATTACHMENT_STORAGE_DRIVER") ?? ATTACHMENT_STORAGE_DRIVER_MODES[0]).trim();
        const configuredMode: AttachmentStorageDriverMode = ATTACHMENT_STORAGE_DRIVER_MODES.includes(
          rawMode as AttachmentStorageDriverMode
        )
          ? (rawMode as AttachmentStorageDriverMode)
          : "local";

        return configuredMode === "object-storage" ? objectStorageDriver : localDriver;
      },
      inject: [ConfigService, LocalAttachmentStorageDriver, ObjectStorageAttachmentStorageDriver]
    }
  ],
  exports: [UploadsService, ATTACHMENT_STORAGE_DRIVER]
})
export class UploadsModule {}
