import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma CLI commands that touch the database need DIRECT_URL (or DATABASE_URL).
// `prisma generate` does not, so the datasource is omitted when no URL is set.
// This keeps production builds independent from database credentials.
const directUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  ...(directUrl ? { datasource: { url: directUrl } } : {}),
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
