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
