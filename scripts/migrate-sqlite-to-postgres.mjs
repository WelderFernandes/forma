/**
 * Migra os dados do SQLite legado para o Postgres configurado em DATABASE_URL.
 *
 * Uso:
 *   pnpm db:import:sqlite
 *   pnpm db:import:sqlite -- --force
 *
 * O destino precisa estar vazio. Use --force apenas quando quiser substituir
 * todos os dados existentes no Postgres (inclusive usuários) pelo snapshot SQLite.
 */

import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import pg from "pg";

// Pais antes dos filhos, para respeitar as foreign keys do schema Prisma.
const MODELS = [
  "User",
  "Session",
  "Account",
  "Verification",
  "UserProfile",
  "Exercise",
  "Favorite",
  "WorkoutTemplate",
  "TemplateExercise",
  "WorkoutSession",
  "WorkoutExercise",
  "SetLog",
  "CardioSession",
  "BodyMetric",
  "Food",
  "MealEntry",
  "WaterLog",
  "StepLog",
  "FastingSession",
  "MealPlan",
  "Recipe",
  "MindTip",
  "TipRead",
  "Challenge",
  "UserChallenge",
  "Achievement",
  "UserAchievement",
  "CycleLog",
];

const ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const sourceArg = process.argv.find((arg) => arg.startsWith("--source="));
const sourcePath = path.resolve(
  sourceArg ? sourceArg.slice("--source=".length) : path.join(ROOT, "prisma", "dev.db"),
);
const force = process.argv.includes("--force");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não configurada. Ajuste o .env antes de importar.");
}

const databaseUrl = new URL(process.env.DATABASE_URL);
if (databaseUrl.protocol !== "postgresql:" && databaseUrl.protocol !== "postgres:") {
  throw new Error(
    "DATABASE_URL precisa apontar para um Postgres. Ajuste o .env antes de importar.",
  );
}

const schema = databaseUrl.searchParams.get("schema") ?? "public";
if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(schema)) {
  throw new Error(`Schema inválido em DATABASE_URL: ${schema}`);
}
databaseUrl.searchParams.delete("schema");

if (!fs.existsSync(sourcePath)) {
  throw new Error(`Banco SQLite não encontrado em ${sourcePath}`);
}

function quoteIdentifier(value) {
  return `"${value.replaceAll('"', '""')}"`;
}

function qualify(modelName) {
  return `${quoteIdentifier(schema)}.${quoteIdentifier(modelName)}`;
}

function convertValue(value, sqliteType) {
  if (value === null || value === undefined) return null;

  const type = String(sqliteType ?? "").toUpperCase();
  if (type.includes("DATETIME") || type.includes("TIMESTAMP")) {
    const date =
      typeof value === "number" || typeof value === "bigint"
        ? new Date(Number(value))
        : new Date(String(value));
    if (Number.isNaN(date.getTime())) {
      throw new Error(`Data inválida: ${value}`);
    }
    return date;
  }
  if (type.includes("BOOL")) {
    return value === true || value === 1 || value === "1";
  }
  if (type.includes("BIGINT")) {
    return String(value);
  }
  return value;
}

function readSourceModel(sqlite, modelName) {
  const columns = sqlite.prepare(`PRAGMA table_info(${quoteIdentifier(modelName)})`).all();
  if (columns.length === 0) {
    throw new Error(`Tabela ausente no SQLite: ${modelName}`);
  }

  const select = columns.map((column) => quoteIdentifier(column.name)).join(", ");
  const rows = sqlite.prepare(`SELECT ${select} FROM ${quoteIdentifier(modelName)}`).all();

  return {
    columns: columns.map((column) => ({
      name: column.name,
      type: column.type,
    })),
    rows,
  };
}

async function main() {
  const sqlite = new DatabaseSync(sourcePath, { readOnly: true });
  const client = new pg.Client({ connectionString: databaseUrl.toString() });

  try {
    console.log(`-> SQLite: ${sourcePath}`);
    console.log(`-> Postgres: ${databaseUrl.host}, schema ${schema}`);

    const source = new Map();
    for (const modelName of MODELS) {
      source.set(modelName, readSourceModel(sqlite, modelName));
    }

    await client.connect();

    const destinationCounts = new Map();
    let destinationRows = 0;
    for (const modelName of MODELS) {
      const result = await client.query(`SELECT count(*)::int AS count FROM ${qualify(modelName)}`);
      const count = result.rows[0].count;
      destinationCounts.set(modelName, count);
      destinationRows += count;
    }

    if (destinationRows > 0 && !force) {
      throw new Error(
        "O Postgres de destino não está vazio. Use --force para substituir os dados existentes.",
      );
    }

    await client.query("BEGIN");
    try {
      if (destinationRows > 0) {
        console.log("! --force ativo: removendo os dados atuais do Postgres...");
        await client.query(
          `TRUNCATE TABLE ${MODELS.map(qualify).join(", ")} RESTART IDENTITY CASCADE`,
        );
      }

      for (const modelName of MODELS) {
        const { columns, rows } = source.get(modelName);
        if (rows.length === 0) {
          console.log(`  - ${modelName}: 0`);
          continue;
        }

        const columnNames = columns.map((column) => column.name);
        const insert = `INSERT INTO ${qualify(modelName)} (${columnNames
          .map(quoteIdentifier)
          .join(", ")}) VALUES `;
        const rowPlaceholders = `(${columnNames.map((_, index) => `$${index + 1}`).join(", ")})`;
        const batchSize = Math.max(1, Math.floor(30_000 / columnNames.length));

        for (let offset = 0; offset < rows.length; offset += batchSize) {
          const batch = rows.slice(offset, offset + batchSize);
          const placeholders = [];
          const values = [];
          for (const row of batch) {
            placeholders.push(
              rowPlaceholders.replace(/\$(\d+)/g, (_, index) => {
                values.push(convertValue(row[columnNames[index - 1]], columns[index - 1].type));
                return `$${values.length}`;
              }),
            );
          }
          await client.query(`${insert}${placeholders.join(", ")}`, values);
        }

        console.log(`  + ${modelName}: ${rows.length}`);
      }

      for (const modelName of MODELS) {
        const result = await client.query(`SELECT count(*)::int AS count FROM ${qualify(modelName)}`);
        const expected = source.get(modelName).rows.length;
        if (result.rows[0].count !== expected) {
          throw new Error(
            `${modelName}: esperado ${expected}, encontrado ${result.rows[0].count} no Postgres.`,
          );
        }
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }

    const total = [...source.values()].reduce((sum, model) => sum + model.rows.length, 0);
    console.log(`\nMigração concluída: ${total} registros copiados e conferidos.`);
  } finally {
    await client.end().catch(() => {});
    sqlite.close();
  }
}

main().catch((error) => {
  console.error(`\nFalha na migração: ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
