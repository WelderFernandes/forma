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

function getPrismaClient() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

// Keep the client lazy so importing server modules during `next build` does not
// require database credentials. The connection is only created on first query.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, property, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export default prisma;
