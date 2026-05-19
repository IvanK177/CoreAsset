import { Resolver, Query } from "@nestjs/graphql";
import { DashboardService } from "./dashboard.service";

@Resolver("DashboardStats")
export class DashboardResolver {
  constructor(private dashboardService: DashboardService) {}

  @Query()
  async dashboardStats() {
    return this.dashboardService.getDashboardStats();
  }
}