import { Module } from "@nestjs/common";
import { HardwareService } from "./hardware.service";
import { HardwareResolver } from "./hardware.resolver";

@Module({
  providers: [HardwareService, HardwareResolver],
})
export class HardwareModule {}