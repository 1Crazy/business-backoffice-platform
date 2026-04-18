/** 批任务控制器：负责暴露导入导出任务创建、查询和文件下载接口。 */
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
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import type { Response } from "express";

import type { AuthUser } from "@/common/auth/auth-user.interface";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Permissions } from "@/common/decorators/permissions.decorator";
import { BatchTasksService } from "./batch-tasks.service";
import { CreateCustomerExportTaskDto } from "./dto/create-customer-export-task.dto";
import { ListBatchTasksDto } from "./dto/list-batch-tasks.dto";
import { BatchTaskFailureVo, BatchTaskVo } from "./vo/batch-task.vo";

@ApiTags("batch-tasks")
@ApiBearerAuth()
@Controller("batch-tasks")
export class BatchTasksController {
  constructor(private readonly batchTasksService: BatchTasksService) {}

  @Get()
  @Permissions("customer:read")
  @ApiOperation({
    summary: "查询批处理任务",
    description: "查询导入导出异步任务列表。"
  })
  @ApiOkResponse({
    type: BatchTaskVo,
    isArray: true
  })
  listTasks(@Query() query: ListBatchTasksDto) {
    return this.batchTasksService.listTasks(query);
  }

  @Get(":id")
  @Permissions("customer:read")
  @ApiOperation({
    summary: "查询批处理任务详情",
    description: "查询单个导入导出任务详情。"
  })
  @ApiOkResponse({
    type: BatchTaskVo
  })
  getTask(@Param("id") id: string) {
    return this.batchTasksService.getTask(id);
  }

  @Get(":id/failures")
  @Permissions("customer:read")
  @ApiOperation({
    summary: "查询批处理失败明细",
    description: "查询单个批处理任务的失败明细反馈。"
  })
  @ApiOkResponse({
    type: BatchTaskFailureVo,
    isArray: true
  })
  listTaskFailures(@Param("id") id: string) {
    return this.batchTasksService.listTaskFailures(id);
  }

  @Post("customers/export")
  @Permissions("customer:read")
  @ApiOperation({
    summary: "创建客户导出任务",
    description: "基于当前用户可见范围创建客户导出异步任务。"
  })
  @ApiOkResponse({
    type: BatchTaskVo
  })
  createCustomerExportTask(@Body() dto: CreateCustomerExportTaskDto, @CurrentUser() user: AuthUser) {
    return this.batchTasksService.createCustomerExportTask(dto, user);
  }

  @Post("customers/import")
  @Permissions("customer:write")
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    description: "上传客户导入 CSV 文件。",
    schema: {
      type: "object",
      required: ["file"],
      properties: {
        ownerId: {
          type: "string",
          description: "导入后默认负责人 ID；为空时默认归当前用户。"
        },
        file: {
          type: "string",
          format: "binary",
          description: "CSV 导入文件。"
        }
      }
    }
  })
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage()
    })
  )
  @ApiOperation({
    summary: "创建客户导入任务",
    description: "提交客户导入 CSV 文件，并以异步任务方式处理。"
  })
  @ApiOkResponse({
    type: BatchTaskVo
  })
  createCustomerImportTask(
    @UploadedFile() file: Express.Multer.File,
    @Body("ownerId") ownerId: string | undefined,
    @CurrentUser() user: AuthUser
  ) {
    return this.batchTasksService.createCustomerImportTask(file, ownerId, user);
  }

  @Get(":id/result")
  @Permissions("customer:read")
  @ApiOperation({
    summary: "下载批任务结果文件",
    description: "下载导出结果文件。"
  })
  async downloadResult(@Param("id") id: string, @CurrentUser() user: AuthUser, @Res({ passthrough: true }) response: Response) {
    const file = await this.batchTasksService.downloadResultFile(id, user);
    const encodedFileName = encodeURIComponent(file.fileName);

    response.setHeader("Content-Type", file.mimeType);
    response.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodedFileName}`);

    if (typeof file.size === "number") {
      response.setHeader("Content-Length", String(file.size));
    }

    return new StreamableFile(file.stream);
  }

  @Get(":id/failure-file")
  @Permissions("customer:read")
  @ApiOperation({
    summary: "下载批任务失败文件",
    description: "下载导入失败明细文件。"
  })
  async downloadFailureFile(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) response: Response
  ) {
    const file = await this.batchTasksService.downloadFailureFile(id, user);
    const encodedFileName = encodeURIComponent(file.fileName);

    response.setHeader("Content-Type", file.mimeType);
    response.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodedFileName}`);

    if (typeof file.size === "number") {
      response.setHeader("Content-Length", String(file.size));
    }

    return new StreamableFile(file.stream);
  }
}
