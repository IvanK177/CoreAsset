import { PrismaClient } from "@prisma/client";

// Singleton pattern for Prisma Client to prevent multiple instances
// in development (hot-reloading) and production
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ["error", "warn"] });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;

// Re-export Prisma types for convenience
export * from "@prisma/client";