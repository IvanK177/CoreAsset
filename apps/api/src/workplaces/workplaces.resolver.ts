import { Resolver, Query, Mutation, Args, Int } from "@nestjs/graphql";
import { WorkplacesService } from "./workplaces.service";

@Resolver("Workplace")
export class WorkplacesResolver {
  constructor(private workplacesService: WorkplacesService) {}

  @Query()
  async workplaces(
    @Args("skip", { nullable: true, type: () => Int }) skip?: number,
    @Args("take", { nullable: true, type: () => Int }) take?: number,
    @Args("search", { nullable: true }) search?: string,
    @Args("location", { nullable: true }) location?: string,
  ) {
    return this.workplacesService.findAll({ skip, take, search, location });
  }

  @Query()
  async workplace(@Args("id") id: string) {
    return this.workplacesService.findOne(id);
  }

  @Mutation()
  async createWorkplace(
    @Args("name") name: string,
    @Args("userId") userId: string,
    @Args("hardwareId") hardwareId: string,
    @Args("location", { nullable: true }) location?: string,
  ) {
    return this.workplacesService.create({
      name,
      location,
      user: { connect: { id: userId } },
      hardware: { connect: { id: hardwareId } },
    });
  }

  @Mutation()
  async updateWorkplace(
    @Args("id") id: string,
    @Args("name", { nullable: true }) name?: string,
    @Args("location", { nullable: true }) location?: string,
    @Args("userId", { nullable: true }) userId?: string,
    @Args("hardwareId", { nullable: true }) hardwareId?: string,
  ) {
    const data: any = {};
    if (name) data.name = name;
    if (location) data.location = location;
    if (userId) data.user = { connect: { id: userId } };
    if (hardwareId) data.hardware = { connect: { id: hardwareId } };
    return this.workplacesService.update(id, data);
  }

  @Mutation()
  async deleteWorkplace(@Args("id") id: string) {
    return this.workplacesService.delete(id);
  }
}