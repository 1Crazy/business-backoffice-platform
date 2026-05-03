/** 附件扫描服务：为上传链路提供恶意内容检测与 fail-open/fail-closed 策略。 */
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export interface AttachmentScanResult {
  status: "CLEAN" | "MALICIOUS" | "ERROR" | "SKIPPED";
  provider: string;
  message?: string | null;
}

@Injectable()
export class AttachmentScanService {
  constructor(private readonly configService: ConfigService) {}

  async scan(file: Express.Multer.File): Promise<AttachmentScanResult> {
    const mode = this.configService.get<string>("ATTACHMENT_SCAN_MODE", "stub").trim().toLowerCase();

    if (mode === "disabled") {
      return {
        status: "SKIPPED",
        provider: "disabled",
        message: "附件扫描已关闭。"
      };
    }

    if (mode !== "stub") {
      return {
        status: "ERROR",
        provider: mode,
        message: `未知的附件扫描模式: ${mode}`
      };
    }

    const originalName = file.originalname.toLowerCase();
    const body = file.buffer.toString("utf8").toLowerCase();

    if (originalName.includes("eicar") || body.includes("eicar") || body.includes("malware")) {
      return {
        status: "MALICIOUS",
        provider: "stub",
        message: "扫描器识别到恶意内容特征。"
      };
    }

    if (originalName.includes("scan-error")) {
      return {
        status: "ERROR",
        provider: "stub",
        message: "扫描器当前不可用。"
      };
    }

    return {
      status: "CLEAN",
      provider: "stub",
      message: null
    };
  }

  shouldFailClosed(): boolean {
    return this.configService.get<string>("ATTACHMENT_SCAN_FAIL_CLOSED", "false").trim().toLowerCase() === "true";
  }
}
