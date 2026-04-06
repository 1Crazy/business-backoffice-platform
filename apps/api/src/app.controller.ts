/** 根控制器：负责暴露应用级健康检查或基础路由，避免把业务能力耦合到入口层。 */
import { Controller, Get } from "@nestjs/common";

import { Public } from "./common/decorators/public.decorator";

@Controller()
export class AppController {
  @Get("health")
  @Public()
  getHealth(): { status: string; timestamp: string } {
    return {
      status: "ok",
      timestamp: new Date().toISOString()
    };
  }
}
