import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data });
  }

  async findAll(params?: { skip?: number; take?: number; search?: string; department?: string }) {
    const { skip, take, search, department } = params || {};

    const where: Prisma.UserWhereInput = {};

    if (department) {
      where.department = department;
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { employeeId: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: { workplaces: { include: { hardware: true } } },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { workplaces: { include: { hardware: { include: { installations: { include: { license: { include: { software: true } } } } } } } } },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return user;
  }

  async update(id: string, data: Prisma.UserUpdateInput) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return this.prisma.user.update({ where: { id }, data });
  }

  async delete(id: string) {
    const existing = await this.prisma.user.findUnique({
      where: { id },
      include: { workplaces: true },
    });

    if (!existing) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    if (existing.workplaces.length > 0) {
      throw new ConflictException(
        `Cannot delete user "${existing.fullName}" — assigned to ${existing.workplaces.length} workplaces. Unassign first.`
      );
    }

    return this.prisma.user.delete({ where: { id } });
  }
}