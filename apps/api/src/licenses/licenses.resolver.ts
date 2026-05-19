import { Resolver, Query, Mutation, Args, Int, Float } from "@nestjs/graphql";

@Resolver("License")
export class LicensesResolver {
  constructor(private licensesService: any) {}

  @Query()
  async licenses(
    @Args("skip", { nullable: true, type: () => Int }) skip?: number,
    @Args("take", { nullable: true, type: () => Int }) take?: number,
    @Args("softwareId", { nullable: true }) softwareId?: string,
  ) {
    return this.licensesService.findAll({ skip, take, softwareId });
  }

  @Query()
  async license(@Args("id") id: string) {
    return this.licensesService.findOne(id);
  }

  @Mutation()
  async createLicense(
    @Args("softwareId") softwareId: string,
    @Args("concurrencyLimit", { type: () => Int, defaultValue: 1 }) concurrencyLimit: number,
    @Args("licenseKey", { nullable: true }) licenseKey?: string,
    @Args("purchaseDate", { nullable: true }) purchaseDate?: string,
    @Args("expiryDate", { nullable: true }) expiryDate?: string,
    @Args("price", { nullable: true, type: () => Float }) price?: number,
  ) {
    const data: any = {
      concurrencyLimit,
      software: { connect: { id: softwareId } },
    };
    if (licenseKey) data.licenseKey = licenseKey;
    if (purchaseDate) data.purchaseDate = new Date(purchaseDate);
    if (expiryDate) data.expiryDate = new Date(expiryDate);
    if (price) data.price = price;

    return this.licensesService.create(data);
  }

  @Mutation()
  async updateLicense(
    @Args("id") id: string,
    @Args("concurrencyLimit", { nullable: true, type: () => Int }) concurrencyLimit?: number,
    @Args("licenseKey", { nullable: true }) licenseKey?: string,
    @Args("expiryDate", { nullable: true }) expiryDate?: string,
    @Args("price", { nullable: true, type: () => Float }) price?: number,
  ) {
    const data: any = {};
    if (concurrencyLimit) data.concurrencyLimit = concurrencyLimit;
    if (licenseKey) data.licenseKey = licenseKey;
    if (expiryDate) data.expiryDate = new Date(expiryDate);
    if (price) data.price = price;
    return this.licensesService.update(id, data);
  }

  @Mutation()
  async deleteLicense(@Args("id") id: string) {
    return this.licensesService.delete(id);
  }

  // ============================================
  // CRITICAL: Assign license to hardware with concurrency check
  // ============================================
  @Mutation()
  async assignLicenseToHardware(
    @Args("hardwareId") hardwareId: string,
    @Args("licenseId") licenseId: string,
  ) {
    return this.licensesService.assignLicenseToHardware(hardwareId, licenseId);
  }

  @Mutation()
  async unassignLicenseFromHardware(
    @Args("hardwareId") hardwareId: string,
    @Args("licenseId") licenseId: string,
  ) {
    return this.licensesService.unassignLicenseFromHardware(hardwareId, licenseId);
  }
}