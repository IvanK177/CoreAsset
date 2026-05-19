import { Resolver, Query, Mutation, Args, Int } from "@nestjs/graphql";
import { SoftwareService } from "./software.service";

@Resolver("SoftwareCatalog")
export class SoftwareResolver {
  constructor(private softwareService: SoftwareService) {}

  @Query()
  async softwareCatalogs(
    @Args("skip", { nullable: true, type: () => Int }) skip?: number,
    @Args("take", { nullable: true, type: () => Int }) take?: number,
    @Args("search", { nullable: true }) search?: string,
    @Args("category", { nullable: true }) category?: string,
  ) {
    return this.softwareService.findAll({ skip, take, search, category });
  }

  @Query()
  async softwareCatalog(@Args("id") id: string) {
    return this.softwareService.findOne(id);
  }

  @Mutation()
  async createSoftwareCatalog(
    @Args("softwareName") softwareName: string,
    @Args("version") version: string,
    @Args("publisher", { nullable: true }) publisher?: string,
    @Args("category", { nullable: true }) category?: string,
  ) {
    return this.softwareService.create({ softwareName, version, publisher, category });
  }

  @Mutation()
  async updateSoftwareCatalog(
    @Args("id") id: string,
    @Args("softwareName", { nullable: true }) softwareName?: string,
    @Args("version", { nullable: true }) version?: string,
    @Args("publisher", { nullable: true }) publisher?: string,
    @Args("category", { nullable: true }) category?: string,
  ) {
    const data: any = {};
    if (softwareName) data.softwareName = softwareName;
    if (version) data.version = version;
    if (publisher) data.publisher = publisher;
    if (category) data.category = category;
    return this.softwareService.update(id, data);
  }

  @Mutation()
  async deleteSoftwareCatalog(@Args("id") id: string) {
    return this.softwareService.delete(id);
  }
}