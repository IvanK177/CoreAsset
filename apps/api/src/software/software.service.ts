import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class SoftwareService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.SoftwareCatalogCreateInput) {
    return this.prisma.softwareCatalog.create({ data });
  }

  async findAll(params?: { skip?: number; take?: number; search?: string; category?: string }) {
    const { skip, take, search, category } = params || {};

    const where: Prisma.SoftwareCatalogWhereInput = {};

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { softwareName: { contains: search, mode: "insensitive" } },
        { publisher: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.softwareCatalog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: { licenses: true },
      }),
      this.prisma.softwareCatalog.count({ where }),
    ]);

    return { items, total };
  }

  async findOne(id: string) {
    const software = await this.prisma.softwareCatalog.findUnique({
      where: { id },
      include: { licenses: { include: { installations: true } } },
    });

    if (!software) {
      throw new NotFoundException(`Software with ID "${id}" not found`);
    }

    return software;
  }

  async update(id: string, data: Prisma.SoftwareCatalogUpdateInput) {
    const existing = await this.prisma.softwareCatalog.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Software with ID "${id}" not found`);
    }

    return this.prisma.softwareCatalog.update({ where: { id }, data });
  }

  async delete(id: string) {
    const existing = await this.prisma.softwareCatalog.findUnique({
      where: { id },
      include: { licenses: true },
    });

    if (!existing) {
      throw new NotFoundException(`Software with ID "${id}" not found`);
    }

    if (existing.licenses.length > 0) {
      throw new Error(
        `Cannot delete software "${existing.softwareName}" — it has ${existing.licenses.length} associated licenses.`
      );
    }

    return this.prisma.softwareCatalog.delete({ where: { id } });
  }
}