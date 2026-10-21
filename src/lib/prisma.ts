import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function resolveDatabaseConfig() {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    throw new Error("DATABASE_URL não configurada.");
  }

  const url = new URL(rawUrl);
  if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
    throw new Error("DATABASE_URL precisa usar o protocolo PostgreSQL.");
  }

  const schema = url.searchParams.get("schema") ?? "public";
  url.searchParams.delete("schema");

  const poolMax = Number.parseInt(process.env.DATABASE_POOL_MAX ?? "10", 10);

  return {
    connectionString: url.toString(),
    schema,
    max: Number.isFinite(poolMax) && poolMax > 0 ? poolMax : 10,
  };
}

function createPrismaClient() {
  const { connectionString, schema, max } = resolveDatabaseConfig();
  const adapter = new PrismaPg(
    {
      connectionString,
      max,
      connectionTimeoutMillis: 5_000,
    },
    { schema },
  );

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
