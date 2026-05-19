import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class LicensesService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // CREATE — New license
  // ============================================
  async create(data: Prisma.LicenseCreateInput) {
    return this.prisma.license.create({
      data,
      include: { software: true },
    });
  }

  // ============================================
  // READ — All licenses with stats
  // ============================================
  async findAll(params?: { skip?: number; take?: number; softwareId?: string }) {
    const { skip, take, softwareId } = params || {};

    const where: Prisma.LicenseWhereInput = {};
    if (softwareId) where.softwareId = softwareId;

    const [items, total] = await Promise.all([
      this.prisma.license.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          software: true,
          installations: { where: { status: "active" } },
        },
      }),
      this.prisma.license.count({ where }),
    ]);

    // Calculate usage stats for each license
    const enrichedItems = items.map((license) => ({
      ...license,
      usedCount: license.installations.length,
      availableCount: license.concurrencyLimit - license.installations.length,
      isOverLimit: license.installations.length > license.concurrencyLimit,
    }));

    return { items: enrichedItems, total };
  }

  // ============================================
  // READ — Single license by ID
  // ============================================
  async findOne(id: string) {
    const license = await this.prisma.license.findUnique({
      where: { id },
      include: {
        software: true,
        installations: {
          where: { status: "active" },
          include: { hardware: true },
        },
      },
    });

    if (!license) {
      throw new NotFoundException(`License with ID "${id}" not found`);
    }

    return {
      ...license,
      usedCount: license.installations.length,
      availableCount: license.concurrencyLimit - license.installations.length,
    };
  }

  // ============================================
  // UPDATE — License properties
  // ============================================
  async update(id: string, data: Prisma.LicenseUpdateInput) {
    const existing = await this.prisma.license.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`License with ID "${id}" not found`);
    }

    return this.prisma.license.update({
      where: { id },
      data,
      include: { software: true },
    });
  }

  // ============================================
  // DELETE — License with dependency check
  // ============================================
  async delete(id: string) {
    const existing = await this.prisma.license.findUnique({
      where: { id },
      include: { installations: true },
    });

    if (!existing) {
      throw new NotFoundException(`License with ID "${id}" not found`);
    }

    if (existing.installations.length > 0) {
      throw new ConflictException(
        `Cannot delete license — it has ${existing.installations.length} active installations. Uninstall software from hardware first.`
      );
    }

    return this.prisma.license.delete({ where: { id } });
  }

  // ============================================
  // CRITICAL: Assign license to hardware with concurrency check
  // Uses pessimistic locking (SELECT FOR UPDATE) to prevent
  // race conditions when multiple requests try to assign
  // the same license simultaneously
  // ============================================
  async assignLicenseToHardware(hardwareId: string, licenseId: string) {
    return this.prisma.$transaction(async (tx) => {
      // Step 1: Verify hardware exists
      const hardware = await tx.hardwareAsset.findUnique({
        where: { id: hardwareId },
      });

      if (!hardware) {
        throw new NotFoundException(`Hardware with ID "${hardwareId}" not found`);
      }

      // Step 2: Pessimistic lock on the license row
      // This prevents concurrent transactions from reading the same license
      // until this transaction completes
      const license = await tx.$queryRaw<Array<{ id: string; concurrency_limit: number }>>`
        SELECT id, concurrency_limit FROM licenses WHERE id = ${licenseId} FOR UPDATE
      `;

      if (!license || license.length === 0) {
        throw new NotFoundException(`License with ID "${licenseId}" not found`);
      }

      const concurrencyLimit = license[0].concurrency_limit;

      // Step 3: Count current active installations for this license
      const currentInstallations = await tx.softwareInstallation.count({
        where: {
          licenseId,
          status: "active",
        },
      });

      // Step 4: Check if limit is exceeded
      if (currentInstallations >= concurrencyLimit) {
        throw new ConflictException(
          `License limit exceeded! This license allows ${concurrencyLimit} concurrent installations, but ${currentInstallations} are already active. No more installations permitted.`
        );
      }

      // Step 5: Check if this hardware already has this license installed
      const existingInstallation = await tx.softwareInstallation.findUnique({
        where: {
          hardwareId_licenseId: { hardwareId, licenseId },
        },
      });

      if (existingInstallation) {
        throw new ConflictException(
          `This hardware already has this license installed (installation ID: ${existingInstallation.id}).`
        );
      }

      // Step 6: Create the installation record
      const installation = await tx.softwareInstallation.create({
        data: {
          hardwareId,
          licenseId,
          status: "active",
        },
        include: {
          hardware: true,
          license: { include: { software: true } },
        },
      });

      return installation;
    });
  }

  // ============================================
  // Uninstall license from hardware
  // ============================================
  async unassignLicenseFromHardware(hardwareId: string, licenseId: string) {
    const installation = await this.prisma.softwareInstallation.findUnique({
      where: { hardwareId_licenseId: { hardwareId, licenseId } },
    });

    if (!installation) {
      throw new NotFoundException(
        `No installation found for hardware "${hardwareId}" with license "${licenseId}".`
      );
    }

    // Mark as uninstalled rather than deleting (for audit trail)
    return this.prisma.softwareInstallation.update({
      where: { id: installation.id },
      data: { status: "uninstalled" },
      include: {
        hardware: true,
        license: { include: { software: true } },
      },
    });
  }
}