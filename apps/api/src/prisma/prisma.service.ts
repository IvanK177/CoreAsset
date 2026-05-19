import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;

  constructor() {
    // Parse DATABASE_URL to extract connection params for pg Pool
    // Format: postgres://user:password@host:port/database?params
    const dbUrl = process.env.DATABASE_URL || "";
    const parsed = new URL(dbUrl);

    const poolConfig = {
      host: parsed.hostname,
      port: Number(parsed.port) || 5432,
      user: parsed.username,
      password: decodeURIComponent(parsed.password), // decode %21 back to !
      database: parsed.pathname.replace(/^\//, ""), // remove leading slash
      max: 5,
      ssl: {
        rejectUnauthorized: false, // Supabase pooler uses a shared certificate
      },
    };

    const pool = new Pool(poolConfig);
    const adapter = new PrismaPg(pool);
    super({ adapter });
    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
    console.log("✅ Prisma connected to PostgreSQL (via pg driver adapter)");
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
    console.log("🔌 Prisma disconnected from PostgreSQL");
  }
}