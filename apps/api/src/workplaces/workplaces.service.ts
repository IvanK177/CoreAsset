import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class WorkplacesService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.WorkplaceCreateInput) {
    return this.prisma.workplace.create({
      data,
      include: { user: true, hardware: true },
    });
  }

  async findAll(params?: { skip?: number; take?: number; search?: string; location?: string }) {
    const { skip, take, search, location } = params || {};

    const where: Prisma.WorkplaceWhereInput = {};

    if (location) {
      where.location = { contains: location, mode: "insensitive" };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
        { user: { fullName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.workplace.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: { user: true, hardware: true },
      }),
      this.prisma.workplace.count({ where }),
    ]);

    return { items, total };
  }

  async findOne(id: string) {
    const workplace = await this.prisma.workplace.findUnique({
      where: { id },
      include: {
        user: true,
        hardware: {
          include: {
            installations: { include: { license: { include: { software: true } } } },
            faultIncidents: true,
          },
        },
      },
    });

    if (!workplace) {
      throw new NotFoundException(`Workplace with ID "${id}" not found`);
    }

    return workplace;
  }

  async update(id: string, data: Prisma.WorkplaceUpdateInput) {
    const existing = await this.prisma.workplace.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Workplace with ID "${id}" not found`);
    }

    return this.prisma.workplace.update({
      where: { id },
      data,
      include: { user: true, hardware: true },
    });
  }

  async delete(id: string) {
    const existing = await this.prisma.workplace.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Workplace with ID "${id}" not found`);
    }

    return this.prisma.workplace.delete({ where: { id } });
  }
}