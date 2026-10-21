import "server-only";
import type { Exercise } from "@/generated/prisma/client";
import {
  EXERCISEDB_DEMOS,
  YMOVE_DEMOS,
  type ExerciseMediaData,
} from "@/lib/exercise-demos";
import { isMuscleWikiConfigured } from "@/lib/musclewiki";
import { getExerciseDemo } from "./musclewiki";

const MUSCLEWIKI_SOURCE_URL = "https://musclewiki.com/pt-br";
const YMOVE_SOURCE_URL = "https://ymove.app/free-exercise-videos";
const EXERCISEDB_SOURCE_URL = "https://oss.exercisedb.dev/docs";

export type ExerciseMediaBadge = "video" | "gif";

/**
 * O ExerciseDB Free é gratuito para uso não comercial. A flag permite manter o
 * projeto premium no modo pessoal e desligar a camada antes de uma publicação
 * comercial, sem mexer no código.
 */
export function isExerciseDbEnabled(): boolean {
  return process.env.EXERCISEDB_FREE_ENABLED?.trim().toLowerCase() === "true";
}

type ExerciseWithMuscleWiki = Pick<
  Exercise,
  "muscleWikiVideos" | "muscleWikiName" | "muscleWikiSyncedAt"
>;

/**
 * Resolve a melhor mídia disponível para um exercício.
 *
 * A leitura é somente local (banco + manifesto). O render nunca faz chamadas
 * externas; os vídeos e animações já estão em `public/demos`.
 *
 * Ordem:
 *   1. MuscleWiki, quando há chave e metadados sincronizados;
 *   2. Your Move, vídeo vertical e licença comercial;
 *   3. ExerciseDB Free, animação compacta e não comercial;
 *   4. `null`, deixando a página seguir apenas com o guia textual.
 */
export async function getExerciseMedia(
  exercise: ExerciseWithMuscleWiki,
  slug: string,
): Promise<ExerciseMediaData | null> {
  const muscleWiki = await getExerciseDemo(exercise);
  if (muscleWiki.status === "ready" && muscleWiki.videos.length > 0) {
    return {
      kind: "video",
      provider: "musclewiki",
      videos: muscleWiki.videos,
      sourceName: muscleWiki.sourceName,
      sourceUrl: MUSCLEWIKI_SOURCE_URL,
      variantNote: null,
      orientation: "landscape",
    };
  }

  const ymove = YMOVE_DEMOS[slug];
  if (ymove) {
    return {
      kind: "video",
      provider: "ymove",
      videos: [
        {
          angle: "front",
          gender: "neutral",
          src: ymove.src,
          poster: ymove.poster,
        },
      ],
      sourceName: ymove.sourceTitle,
      sourceUrl: YMOVE_SOURCE_URL,
      variantNote: ymove.variantNote ?? null,
      orientation: "portrait",
    };
  }

  if (isExerciseDbEnabled()) {
    const exercisedb = EXERCISEDB_DEMOS[slug];
    if (exercisedb) {
      return {
        kind: "gif",
        provider: "exercisedb",
        src: exercisedb.src,
        sourceName: exercisedb.sourceTitle,
        sourceUrl: EXERCISEDB_SOURCE_URL,
        license: "Uso não comercial",
        licenseUrl: EXERCISEDB_SOURCE_URL,
        variantNote: exercisedb.variantNote ?? null,
        width: 180,
        height: 180,
      };
    }
  }

  return null;
}

/**
 * Rótulo curto para a biblioteca. Não consulta o banco: usa o identificador da
 * MuscleWiki já presente na listagem e os manifestos locais.
 */
export function getExerciseMediaBadge(
  slug: string,
  hasMuscleWiki: boolean,
): ExerciseMediaBadge | null {
  if (hasMuscleWiki && isMuscleWikiConfigured()) return "video";
  if (YMOVE_DEMOS[slug]) return "video";
  if (isExerciseDbEnabled() && EXERCISEDB_DEMOS[slug]) return "gif";
  return null;
}
