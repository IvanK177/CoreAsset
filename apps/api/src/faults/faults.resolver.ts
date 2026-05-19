import { Resolver, Query, Mutation, Args, Int } from "@nestjs/graphql";

@Resolver("FaultHistoryIncident")
export class FaultsResolver {
  constructor(private faultsService: any) {}

  @Query()
  async faultHistoryIncidents(
    @Args("skip", { nullable: true, type: () => Int }) skip?: number,
    @Args("take", { nullable: true, type: () => Int }) take?: number,
    @Args("hardwareId", { nullable: true }) hardwareId?: string,
    @Args("status", { nullable: true }) status?: string,
    @Args("severity", { nullable: true }) severity?: string,
  ) {
    return this.faultsService.findAll({ skip, take, hardwareId, status, severity });
  }

  @Query()
  async faultHistoryIncident(@Args("id") id: string) {
    return this.faultsService.findOne(id);
  }

  @Mutation()
  async createFaultHistoryIncident(
    @Args("hardwareId") hardwareId: string,
    @Args("incidentDescription") incidentDescription: string,
    @Args("severity", { nullable: true, defaultValue: "medium" }) severity?: string,
  ) {
    return this.faultsService.create({
      incidentDescription,
      severity: severity || "medium",
      hardware: { connect: { id: hardwareId } },
    });
  }

  @Mutation()
  async updateFaultHistoryIncident(
    @Args("id") id: string,
    @Args("incidentDescription", { nullable: true }) incidentDescription?: string,
    @Args("severity", { nullable: true }) severity?: string,
    @Args("status", { nullable: true }) status?: string,
  ) {
    const data: any = {};
    if (incidentDescription) data.incidentDescription = incidentDescription;
    if (severity) data.severity = severity;
    if (status) data.status = status;
    return this.faultsService.update(id, data);
  }

  @Mutation()
  async resolveFaultHistoryIncident(@Args("id") id: string) {
    return this.faultsService.resolveIncident(id);
  }

  @Mutation()
  async deleteFaultHistoryIncident(@Args("id") id: string) {
    return this.faultsService.delete(id);
  }
}