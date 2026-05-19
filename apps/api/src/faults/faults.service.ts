import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class FaultsService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.FaultHistoryIncidentCreateInput) {
    return this.prisma.faultHistoryIncident.create({
      data,
      include: { hardware: true },
    });
  }

  async findAll(params?: { skip?: number; take?: number; hardwareId?: string; status?: string; severity?: string }) {
    const { skip, take, hardwareId, status, severity } = params || {};

    const where: Prisma.FaultHistoryIncidentWhereInput = {};
    if (hardwareId) where.hardwareId = hardwareId;
    if (status) where.status = status;
    if (severity) where.severity = severity;

    const [items, total] = await Promise.all([
      this.prisma.faultHistoryIncident.findMany({
        where,
        skip,
        take,
        orderBy: { reportedAt: "desc" },
        include: { hardware: true },
      }),
      this.prisma.faultHistoryIncident.count({ where }),
    ]);

    return { items, total };
  }

  async findOne(id: string) {
    const incident = await this.prisma.faultHistoryIncident.findUnique({
      where: { id },
      include: { hardware: true },
    });

    if (!incident) {
      throw new NotFoundException(`Fault incident with ID "${id}" not found`);
    }

    return incident;
  }

  async update(id: string, data: Prisma.FaultHistoryIncidentUpdateInput) {
    const existing = await this.prisma.faultHistoryIncident.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Fault incident with ID "${id}" not found`);
    }

    return this.prisma.faultHistoryIncident.update({
      where: { id },
      data,
      include: { hardware: true },
    });
  }

  async resolveIncident(id: string) {
    const existing = await this.prisma.faultHistoryIncident.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Fault incident with ID "${id}" not found`);
    }

    return this.prisma.faultHistoryIncident.update({
      where: { id },
      data: {
        status: "resolved",
        resolvedAt: new Date(),
      },
      include: { hardware: true },
    });
  }

  async delete(id: string) {
    const existing = await this.prisma.faultHistoryIncident.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Fault incident with ID "${id}" not found`);
    }

    return this.prisma.faultHistoryIncident.delete({ where: { id } });
  }
}