/**
 * Sincroniza os exercícios do Forma com os vídeos oficiais da MuscleWiki.
 *
 * Uso:
 *   pnpm db:musclewiki                         # prévia, sem gravar
 *   pnpm db:musclewiki -- --apply              # grava os metadados
 *   pnpm db:musclewiki -- --apply --force      # revalida tudo
 *   pnpm db:musclewiki -- --apply --only=prancha
 *
 * Requer MUSCLEWIKI_API_KEY no .env. Os vídeos não são baixados: guardamos
 * apenas IDs, nomes e URLs oficiais de streaming por até 30 dias.
 */

import { prisma } from "../src/lib/prisma";
import {
  MUSCLEWIKI_METADATA_TTL_MS,
  isMuscleWikiConfigured,
  pickBestMuscleWikiMatch,
  searchMuscleWiki,
} from "../src/lib/musclewiki";
import { getMuscleWikiQuery } from "../src/lib/musclewiki-queries";

// Permite rodar também via `tsx scripts/...` sem depender do --env-file.
try {
  const loadEnvFile = (
    process as typeof process & { loadEnvFile?: (path?: string) => void }
  ).loadEnvFile;
  loadEnvFile?.(".env");
} catch {
  // O arquivo .env pode não existir; as variáveis do shell continuam válidas.
}

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const force = args.includes("--force");
const only = args.find((arg) => arg.startsWith("--only="))?.split("=")[1] ?? "";

type SyncResult = {
  slug: string;
  name: string;
  query: string;
  matchedName: string | null;
  matchId: number | null;
  videoCount: number;
  status: "match" | "no-match" | "skipped" | "error";
};

async function main() {
  if (!isMuscleWikiConfigured()) {
    console.error(
      "\n✖ MUSCLEWIKI_API_KEY não configurada.\n" +
        "  Adicione a chave ao .env (o acesso pelo app exige TESTING ou superior)\n" +
        "  e rode novamente: pnpm db:musclewiki -- --apply\n",
    );
    process.exitCode = 1;
    return;
  }

  const exercises = await prisma.exercise.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      muscleWikiSyncedAt: true,
    },
  });

  const selected = only
    ? exercises.filter((exercise) => exercise.slug === only)
    : exercises;

  if (selected.length === 0) {
    console.error(`\n✖ Nenhum exercício encontrado${only ? ` para "${only}"` : ""}.\n`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `\n→ MuscleWiki · ${selected.length} exercício${selected.length > 1 ? "s" : ""}` +
      `${apply ? " · gravando" : " · prévia (use --apply para gravar)"}\n`,
  );

  const results: SyncResult[] = [];
  let fatalError = false;

  for (const [index, exercise] of selected.entries()) {
    const query = getMuscleWikiQuery(exercise.name, exercise.slug);
    const prefix = `[${String(index + 1).padStart(2, "0")}/${selected.length}]`;

    if (
      !force &&
      exercise.muscleWikiSyncedAt &&
      Date.now() - exercise.muscleWikiSyncedAt.getTime() < MUSCLEWIKI_METADATA_TTL_MS
    ) {
      console.log(`${prefix} ${exercise.slug} · já sincronizado (use --force para refazer)`);
      results.push({
        slug: exercise.slug,
        name: exercise.name,
        query,
        matchedName: null,
        matchId: null,
        videoCount: 0,
        status: "skipped",
      });
      continue;
    }

    try {
      const candidates = await searchMuscleWiki(query, 5);
      const match = pickBestMuscleWikiMatch(candidates, query);
      const videoCount = match?.videos.filter((video) => video.url).length ?? 0;

      if (!match) {
        console.log(`${prefix} ${exercise.slug} · sem correspondência para "${query}"`);
        results.push({
          slug: exercise.slug,
          name: exercise.name,
          query,
          matchedName: null,
          matchId: null,
          videoCount: 0,
          status: "no-match",
        });
      } else {
        console.log(
          `${prefix} ${exercise.slug} → ${match.name} (id ${match.id}) · ${videoCount} vídeo${videoCount === 1 ? "" : "s"}`,
        );
        results.push({
          slug: exercise.slug,
          name: exercise.name,
          query,
          matchedName: match.name,
          matchId: match.id,
          videoCount,
          status: "match",
        });

        if (apply) {
          await prisma.exercise.update({
            where: { id: exercise.id },
            data: {
              // Só sinaliza "tem vídeo" na biblioteca quando há URL reproduzível.
              muscleWikiId: videoCount > 0 ? match.id : null,
              muscleWikiName: match.name,
              muscleWikiVideos: JSON.stringify(match.videos),
              muscleWikiSyncedAt: new Date(),
            },
          });
        }
      }
    } catch (error) {
      const code =
        error && typeof error === "object" && "code" in error
          ? String((error as { code: unknown }).code)
          : "error";
      console.log(`${prefix} ${exercise.slug} · falhou (${code})`);
      results.push({
        slug: exercise.slug,
        name: exercise.name,
        query,
        matchedName: null,
        matchId: null,
        videoCount: 0,
        status: "error",
      });

      // Erros de autenticação/cota não vão melhorar nas próximas chamadas.
      if (code === "unauthorized" || code === "forbidden" || code === "quota") {
        fatalError = true;
        break;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 120));
  }

  const matched = results.filter((result) => result.status === "match").length;
  const skipped = results.filter((result) => result.status === "skipped").length;
  const missing = results.filter((result) => result.status === "no-match").length;
  const errors = results.filter((result) => result.status === "error").length;

  console.log(
    `\n${apply ? "✔ Sincronização concluída" : "Prévia concluída"} · ` +
      `${matched} com vídeo · ${missing} sem correspondência · ` +
      `${skipped} já atualizados · ${errors} erros\n`,
  );

  if (!apply && matched > 0) {
    console.log("Rode novamente com --apply para gravar os metadados.\n");
  }

  if (fatalError) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error("\n✖ Falha ao sincronizar:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
