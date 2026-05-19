import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    // Hardware stats by lifecycle state
    const hardwareByState = await this.prisma.hardwareAsset.groupBy({
      by: ["lifecycleState"],
      _count: { id: true },
    });

    // Hardware stats by type
    const hardwareByType = await this.prisma.hardwareAsset.groupBy({
      by: ["type"],
      _count: { id: true },
    });

    // Total counts
    const totalHardware = await this.prisma.hardwareAsset.count();
    const totalUsers = await this.prisma.user.count();
    const totalWorkplaces = await this.prisma.workplace.count();
    const totalSoftware = await this.prisma.softwareCatalog.count();
    const totalLicenses = await this.prisma.license.count();

    // License usage stats
    const licenses = await this.prisma.license.findMany({
      include: {
        software: true,
        installations: { where: { status: "active" } },
      },
    });

    const licenseStats = licenses.map((license) => ({
      id: license.id,
      softwareName: license.software.softwareName,
      version: license.software.version,
      concurrencyLimit: license.concurrencyLimit,
      usedCount: license.installations.length,
      availableCount: license.concurrencyLimit - license.installations.length,
      isOverLimit: license.installations.length > license.concurrencyLimit,
      expiryDate: license.expiryDate,
    }));

    // Fault incident stats
    const faultsByStatus = await this.prisma.faultHistoryIncident.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    const faultsBySeverity = await this.prisma.faultHistoryIncident.groupBy({
      by: ["severity"],
      _count: { id: true },
    });

    const totalFaults = await this.prisma.faultHistoryIncident.count();

    // Expiring licenses (within 30 days)
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiringLicenses = await this.prisma.license.findMany({
      where: {
        expiryDate: {
          lte: thirtyDaysLater,
          gte: now,
        },
      },
      include: { software: true },
    });

    return {
      hardware: {
        total: totalHardware,
        byState: hardwareByState.map((item) => ({
          state: item.lifecycleState,
          count: item._count.id,
        })),
        byType: hardwareByType.map((item) => ({
          type: item.type,
          count: item._count.id,
        })),
      },
      users: { total: totalUsers },
      workplaces: { total: totalWorkplaces },
      software: { total: totalSoftware },
      licenses: {
        total: totalLicenses,
        stats: licenseStats,
        expiringSoon: expiringLicenses.map((l) => ({
          id: l.id,
          softwareName: l.software.softwareName,
          expiryDate: l.expiryDate,
        })),
      },
      faults: {
        total: totalFaults,
        byStatus: faultsByStatus.map((item) => ({
          status: item.status,
          count: item._count.id,
        })),
        bySeverity: faultsBySeverity.map((item) => ({
          severity: item.severity,
          count: item._count.id,
        })),
      },
    };
  }
}