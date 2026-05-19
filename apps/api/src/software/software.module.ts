import { Module } from "@nestjs/common";
import { SoftwareService } from "./software.service";
import { SoftwareResolver } from "./software.resolver";

@Module({
  providers: [SoftwareService, SoftwareResolver],
})
export class SoftwareModule {}