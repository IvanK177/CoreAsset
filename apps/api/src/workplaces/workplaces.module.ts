import { Module } from "@nestjs/common";
import { WorkplacesService } from "./workplaces.service";
import { WorkplacesResolver } from "./workplaces.resolver";

@Module({
  providers: [WorkplacesService, WorkplacesResolver],
})
export class WorkplacesModule {}