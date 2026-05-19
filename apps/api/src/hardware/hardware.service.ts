import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class HardwareService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // CREATE
  // ============================================
  async create(data: Prisma.HardwareAssetCreateInput) {
    return this.prisma.hardwareAsset.create({ data });
  }

  // ============================================
  // READ — All hardware with pagination and filtering
  // ============================================
  async findAll(params?: {
    skip?: number;
    take?: number;
    lifecycleState?: string;
    type?: string;
    search?: string;
  }) {
    const { skip, take, lifecycleState, type, search } = params || {};

    const where: Prisma.HardwareAssetWhereInput = {};

    if (lifecycleState) {
      where.lifecycleState = lifecycleState;
    }

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { serialNumber: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
        { model: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.hardwareAsset.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          installations: { include: { license: { include: { software: true } } } },
          faultIncidents: true,
          workplaces: { include: { user: true } },
        },
      }),
      this.prisma.hardwareAsset.count({ where }),
    ]);

    return { items, total };
  }

  // ============================================
  // READ — Single hardware by ID
  // ============================================
  async findOne(id: string) {
    const hardware = await this.prisma.hardwareAsset.findUnique({
      where: { id },
      include: {
        installations: { include: { license: { include: { software: true } } } },
        faultIncidents: { orderBy: { reportedAt: "desc" } },
        workplaces: { include: { user: true } },
      },
    });

    if (!hardware) {
      throw new NotFoundException(`Hardware asset with ID "${id}" not found`);
    }

    return hardware;
  }

  // ============================================
  // READ — Search by serial number
  // ============================================
  async findBySerialNumber(serialNumber: string) {
    const hardware = await this.prisma.hardwareAsset.findUnique({
      where: { serialNumber },
      include: {
        installations: { include: { license: { include: { software: true } } } },
        faultIncidents: true,
        workplaces: { include: { user: true } },
      },
    });

    if (!hardware) {
      throw new NotFoundException(`Hardware with serial number "${serialNumber}" not found`);
    }

    return hardware;
  }

  // ============================================
  // UPDATE
  // ============================================
  async update(id: string, data: Prisma.HardwareAssetUpdateInput) {
    const existing = await this.prisma.hardwareAsset.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Hardware asset with ID "${id}" not found`);
    }

    return this.prisma.hardwareAsset.update({
      where: { id },
      data,
    });
  }

  // ============================================
  // DELETE — Safe delete with orphan protection
  // ============================================
  async delete(id: string) {
    const existing = await this.prisma.hardwareAsset.findUnique({
      where: { id },
      include: {
        installations: true,
        faultIncidents: true,
        workplaces: true,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Hardware asset with ID "${id}" not found`);
    }

    // Check for dependent records
    if (existing.installations.length > 0) {
      throw new ConflictException(
        `Cannot delete hardware "${existing.name}" — it has ${existing.installations.length} software installations. Remove installations first or use cascade delete.`
      );
    }

    if (existing.workplaces.length > 0) {
      throw new ConflictException(
        `Cannot delete hardware "${existing.name}" — it is assigned to ${existing.workplaces.length} workplaces. Unassign from workplaces first.`
      );
    }

    // Safe to delete — no orphaned records will be created
    // Fault incidents are linked via Restrict, so we need to check them too
    if (existing.faultIncidents.length > 0) {
      throw new ConflictException(
        `Cannot delete hardware "${existing.name}" — it has ${existing.faultIncidents.length} fault history records. Resolve or remove incidents first.`
      );
    }

    return this.prisma.hardwareAsset.delete({ where: { id } });
  }

  // ============================================
  // CASCADE DELETE — Removes all dependent records first
  // ============================================
  async cascadeDelete(id: string) {
    const existing = await this.prisma.hardwareAsset.findUnique({
      where: { id },
      include: {
        installations: true,
        faultIncidents: true,
        workplaces: true,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Hardware asset with ID "${id}" not found`);
    }

    // Use transaction to ensure atomicity
    return this.prisma.$transaction(async (tx) => {
      // 1. Delete software installations
      await tx.softwareInstallation.deleteMany({
        where: { hardwareId: id },
      });

      // 2. Delete fault history incidents
      await tx.faultHistoryIncident.deleteMany({
        where: { hardwareId: id },
      });

      // 3. Unassign from workplaces (delete workplace records)
      await tx.workplace.deleteMany({
        where: { hardwareId: id },
      });

      // 4. Finally delete the hardware asset
      return tx.hardwareAsset.delete({ where: { id } });
    });
  }
}