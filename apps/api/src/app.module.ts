import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { join } from "path";
import { PrismaModule } from "./prisma/prisma.module";
import { HardwareModule } from "./hardware/hardware.module";
import { UsersModule } from "./users/users.module";
import { WorkplacesModule } from "./workplaces/workplaces.module";
import { SoftwareModule } from "./software/software.module";
import { LicensesModule } from "./licenses/licenses.module";
import { FaultsModule } from "./faults/faults.module";
import { DashboardModule } from "./dashboard/dashboard.module";

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      typePaths: [join(process.cwd(), "src/schema.gql")],
      playground: true,
      introspection: true,
    }),
    PrismaModule,
    HardwareModule,
    UsersModule,
    WorkplacesModule,
    SoftwareModule,
    LicensesModule,
    FaultsModule,
    DashboardModule,
  ],
})
export class AppModule {}