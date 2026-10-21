import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations and schema operations use the direct connection.
    // The application runtime uses DATABASE_URL through PrismaPg.
    url: env("DIRECT_URL"),
  },
});
