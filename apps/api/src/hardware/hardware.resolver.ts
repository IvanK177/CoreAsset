import { Resolver, Query, Mutation, Args, Int } from "@nestjs/graphql";
import { HardwareService } from "./hardware.service";
import { HardwareAsset } from "@prisma/client";

@Resolver("HardwareAsset")
export class HardwareResolver {
  constructor(private hardwareService: HardwareService) {}

  @Query()
  async hardwareAssets(
    @Args("skip", { nullable: true, type: () => Int }) skip?: number,
    @Args("take", { nullable: true, type: () => Int }) take?: number,
    @Args("lifecycleState", { nullable: true }) lifecycleState?: string,
    @Args("type", { nullable: true }) type?: string,
    @Args("search", { nullable: true }) search?: string,
  ) {
    return this.hardwareService.findAll({ skip, take, lifecycleState, type, search });
  }

  @Query()
  async hardwareAsset(@Args("id") id: string) {
    return this.hardwareService.findOne(id);
  }

  @Query()
  async hardwareBySerialNumber(@Args("serialNumber") serialNumber: string) {
    return this.hardwareService.findBySerialNumber(serialNumber);
  }

  @Mutation()
  async createHardwareAsset(
    @Args("serialNumber") serialNumber: string,
    @Args("name") name: string,
    @Args("type") type: string,
    @Args("brand") brand: string,
    @Args("model") model: string,
    @Args("lifecycleState", { nullable: true, defaultValue: "active" }) lifecycleState?: string,
    @Args("purchaseDate", { nullable: true }) purchaseDate?: string,
    @Args("warrantyEndDate", { nullable: true }) warrantyEndDate?: string,
    @Args("discoveryMetadata", { nullable: true }) discoveryMetadata?: string,
  ) {
    const data: any = {
      serialNumber,
      name,
      type,
      brand,
      model,
      lifecycleState: lifecycleState || "active",
    };

    if (purchaseDate) data.purchaseDate = new Date(purchaseDate);
    if (warrantyEndDate) data.warrantyEndDate = new Date(warrantyEndDate);
    if (discoveryMetadata) data.discoveryMetadata = JSON.parse(discoveryMetadata);

    return this.hardwareService.create(data);
  }

  @Mutation()
  async updateHardwareAsset(
    @Args("id") id: string,
    @Args("name", { nullable: true }) name?: string,
    @Args("lifecycleState", { nullable: true }) lifecycleState?: string,
    @Args("brand", { nullable: true }) brand?: string,
    @Args("model", { nullable: true }) model?: string,
    @Args("type", { nullable: true }) type?: string,
    @Args("discoveryMetadata", { nullable: true }) discoveryMetadata?: string,
  ) {
    const data: any = {};
    if (name) data.name = name;
    if (lifecycleState) data.lifecycleState = lifecycleState;
    if (brand) data.brand = brand;
    if (model) data.model = model;
    if (type) data.type = type;
    if (discoveryMetadata) data.discoveryMetadata = JSON.parse(discoveryMetadata);

    return this.hardwareService.update(id, data);
  }

  @Mutation()
  async deleteHardwareAsset(@Args("id") id: string) {
    return this.hardwareService.delete(id);
  }

  @Mutation()
  async cascadeDeleteHardwareAsset(@Args("id") id: string) {
    return this.hardwareService.cascadeDelete(id);
  }
}