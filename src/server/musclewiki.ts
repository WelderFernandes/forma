import "server-only";
import type { Exercise } from "@/generated/prisma/client";
import {
  MUSCLEWIKI_METADATA_TTL_MS,
  getMuscleWikiMediaToken,
  isMuscleWikiConfigured,
  parseMuscleWikiVideos,
  withMuscleWikiMediaToken,
} from "@/lib/musclewiki";

export type ExerciseDemoVideo = {
  angle: string;
  gender: string;
  src: string;
  poster: string | null;
};

export type ExerciseDemo = {
  status: "ready" | "unconfigured" | "no-match" | "stale" | "unavailable";
  videos: ExerciseDemoVideo[];
  sourceName: string | null;
};

const EMPTY: ExerciseDemo = {
  status: "unconfigured",
  videos: [],
  sourceName: null,
};

/**
 * Monta a demonstração a partir dos metadados sincronizados no banco.
 *
 * Esta função é deliberadamente somente leitura: não busca nem grava nada
 * durante o render. Isso evita gastar chamadas da API em prefetch de links
 * e mantém o cache de metadados dentro da janela de 30 dias permitida.
 */
export async function getExerciseDemo(
  exercise: Pick<
    Exercise,
    "muscleWikiVideos" | "muscleWikiName" | "muscleWikiSyncedAt"
  >,
): Promise<ExerciseDemo> {
  if (!isMuscleWikiConfigured()) return EMPTY;

  const syncedAt = exercise.muscleWikiSyncedAt;
  if (!syncedAt) {
    return {
      status: "no-match",
      videos: [],
      sourceName: exercise.muscleWikiName ?? null,
    };
  }

  if (Date.now() - syncedAt.getTime() > MUSCLEWIKI_METADATA_TTL_MS) {
    return {
      status: "stale",
      videos: [],
      sourceName: exercise.muscleWikiName ?? null,
    };
  }

  const stored = parseMuscleWikiVideos(exercise.muscleWikiVideos);
  if (stored.length === 0) {
    return {
      status: "no-match",
      videos: [],
      sourceName: exercise.muscleWikiName ?? null,
    };
  }

  const token = await getMuscleWikiMediaToken();
  if (!token) {
    return {
      status: "unavailable",
      videos: [],
      sourceName: exercise.muscleWikiName ?? null,
    };
  }

  const videos: ExerciseDemoVideo[] = [];
  for (const video of stored) {
    const src = withMuscleWikiMediaToken(video.url, token);
    if (!src) continue;
    videos.push({
      angle: video.angle,
      gender: video.gender,
      src,
      poster: withMuscleWikiMediaToken(video.og_image, token),
    });
  }

  if (videos.length === 0) {
    return {
      status: "no-match",
      videos: [],
      sourceName: exercise.muscleWikiName ?? null,
    };
  }

  return {
    status: "ready",
    videos,
    sourceName: exercise.muscleWikiName ?? null,
  };
}
