import { Module } from "@nestjs/common";
import { FaultsService } from "./faults.service";
import { FaultsResolver } from "./faults.resolver";

@Module({
  providers: [FaultsService, FaultsResolver],
})
export class FaultsModule {}