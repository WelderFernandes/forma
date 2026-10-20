/**
 * Cliente server-side da API oficial da MuscleWiki.
 *
 * A chave nunca vai para o cliente. Os vídeos não são baixados nem
 * rehospedados: montamos a URL oficial de streaming com um token de mídia
 * de curta duração, conforme os termos da API.
 */

const DEFAULT_BASE_URL = "https://api.musclewiki.com";
const REQUEST_TIMEOUT_MS = 12_000;
const METADATA_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const MUSCLEWIKI_SITE_URL = "https://musclewiki.com/pt-br";
export const MUSCLEWIKI_METADATA_TTL_MS = METADATA_TTL_MS;

export type MuscleWikiVideo = {
  url: string | null;
  angle: string;
  gender: string;
  og_image: string | null;
};

export type MuscleWikiExercise = {
  id: number;
  name: string;
  primary_muscles: string[];
  category: string;
  difficulty: string | null;
  steps: string[];
  videos: MuscleWikiVideo[];
};

export type MuscleWikiErrorCode =
  | "not-configured"
  | "unauthorized"
  | "forbidden"
  | "quota"
  | "unavailable"
  | "invalid-response";

export class MuscleWikiError extends Error {
  readonly code: MuscleWikiErrorCode;
  readonly status: number;

  constructor(code: MuscleWikiErrorCode, status: number, message: string) {
    super(message);
    this.name = "MuscleWikiError";
    this.code = code;
    this.status = status;
  }
}

function getBaseUrl(): string {
  return (process.env.MUSCLEWIKI_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(
    /\/+$/,
    "",
  );
}

export function getMuscleWikiApiKey(): string {
  return process.env.MUSCLEWIKI_API_KEY?.trim() ?? "";
}

export function isMuscleWikiConfigured(): boolean {
  return getMuscleWikiApiKey().length > 0;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function normalizeVideo(value: unknown): MuscleWikiVideo | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const angle = typeof raw.angle === "string" ? raw.angle : "";
  const gender = typeof raw.gender === "string" ? raw.gender : "";
  if (!angle || !gender) return null;

  return {
    url: nullableString(raw.url),
    angle,
    gender,
    og_image: nullableString(raw.og_image),
  };
}

/** Lê vídeos persistidos no banco (JSON) ou vindos da API. */
export function parseMuscleWikiVideos(value: unknown): MuscleWikiVideo[] {
  let input = value;
  if (typeof value === "string") {
    try {
      input = JSON.parse(value);
    } catch {
      return [];
    }
  }

  return Array.isArray(input)
    ? input
        .map(normalizeVideo)
        .filter((video): video is MuscleWikiVideo => video !== null)
    : [];
}

function normalizeExercise(value: unknown): MuscleWikiExercise | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.id !== "number" || typeof raw.name !== "string") return null;

  return {
    id: raw.id,
    name: raw.name,
    primary_muscles: stringArray(raw.primary_muscles),
    category: typeof raw.category === "string" ? raw.category : "",
    difficulty: nullableString(raw.difficulty),
    steps: stringArray(raw.steps),
    videos: Array.isArray(raw.videos)
      ? raw.videos
          .map(normalizeVideo)
          .filter((video): video is MuscleWikiVideo => video !== null)
      : [],
  };
}

async function requestJson(
  path: string,
  init?: RequestInit,
): Promise<unknown> {
  const apiKey = getMuscleWikiApiKey();
  if (!apiKey) {
    throw new MuscleWikiError(
      "not-configured",
      0,
      "MUSCLEWIKI_API_KEY is not configured",
    );
  }

  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        "X-API-Key": apiKey,
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new MuscleWikiError(
      "unavailable",
      0,
      "MuscleWiki API is unreachable",
    );
  }

  if (!response.ok) {
    const code: MuscleWikiErrorCode =
      response.status === 401
        ? "unauthorized"
        : response.status === 403
          ? "forbidden"
          : response.status === 429
            ? "quota"
            : "unavailable";
    throw new MuscleWikiError(
      code,
      response.status,
      `MuscleWiki API returned ${response.status}`,
    );
  }

  try {
    return await response.json();
  } catch {
    throw new MuscleWikiError(
      "invalid-response",
      response.status,
      "MuscleWiki API returned invalid JSON",
    );
  }
}

/** Busca exercícios por texto. Retorna uma lista já normalizada. */
export async function searchMuscleWiki(
  query: string,
  limit = 5,
): Promise<MuscleWikiExercise[]> {
  const term = query.trim();
  if (term.length < 2) return [];

  const params = new URLSearchParams({
    q: term,
    limit: String(Math.min(Math.max(limit, 1), 50)),
  });
  const data = await requestJson(`/search?${params.toString()}`);
  const record =
    data && typeof data === "object"
      ? (data as { results?: unknown; data?: unknown })
      : null;
  const rows = Array.isArray(data)
    ? data
    : Array.isArray(record?.results)
      ? record.results
      : Array.isArray(record?.data)
        ? record.data
        : [];

  return rows
    .map(normalizeExercise)
    .filter((exercise): exercise is MuscleWikiExercise => exercise !== null);
}

/** Busca um exercício pelo ID oficial. */
export async function getMuscleWikiExercise(
  id: number,
): Promise<MuscleWikiExercise | null> {
  const data = await requestJson(`/exercises/${id}`);
  return normalizeExercise(data);
}

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokens(value: string): string[] {
  return normalizeName(value)
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Escolhe o resultado mais próximo da consulta. A pontuação é conservadora
 * para evitar casar "supino" com um exercício completamente diferente.
 */
export function pickBestMuscleWikiMatch(
  results: MuscleWikiExercise[],
  query: string,
): MuscleWikiExercise | null {
  const normalizedQuery = normalizeName(query);
  if (!normalizedQuery) return null;
  const queryTokens = new Set(tokens(query));

  let best: MuscleWikiExercise | null = null;
  let bestScore = 0;

  for (const result of results) {
    const normalizedResult = normalizeName(result.name);
    if (!normalizedResult) continue;

    let score = 0;
    if (normalizedResult === normalizedQuery) {
      score = 100;
    } else if (
      normalizedResult.includes(normalizedQuery) ||
      normalizedQuery.includes(normalizedResult)
    ) {
      score = 80;
    } else {
      const resultTokens = new Set(tokens(result.name));
      let overlap = 0;
      for (const token of queryTokens) {
        if (resultTokens.has(token)) overlap += 1;
      }
      if (overlap === 0) continue;
      score = (overlap / queryTokens.size) * 60;
      score -= Math.max(0, resultTokens.size - queryTokens.size) * 1.5;
    }

    if (score > bestScore) {
      bestScore = score;
      best = result;
    }
  }

  return bestScore >= 20 ? best : null;
}

let mediaTokenCache: {
  key: string;
  token: string;
  expiresAt: number;
} | null = null;
let mediaTokenInflight: Promise<string | null> | null = null;
let mediaTokenFailureUntil = 0;

/**
 * Troca a chave permanente por um token de mídia de curta duração.
 * O token é reutilizado enquanto estiver válido; nunca é persistido.
 */
export async function getMuscleWikiMediaToken(): Promise<string | null> {
  if (!isMuscleWikiConfigured()) return null;
  if (Date.now() < mediaTokenFailureUntil) return null;

  const key = getMuscleWikiApiKey();
  if (
    mediaTokenCache &&
    mediaTokenCache.key === key &&
    mediaTokenCache.expiresAt > Date.now() + 30_000
  ) {
    return mediaTokenCache.token;
  }

  if (mediaTokenInflight) return mediaTokenInflight;

  mediaTokenInflight = (async () => {
    try {
      const data = await requestJson("/media/token", { method: "POST" });
      const token =
        data && typeof data === "object" && typeof (data as { token?: unknown }).token === "string"
          ? (data as { token: string }).token
          : null;
      if (!token) {
        mediaTokenFailureUntil = Date.now() + 60_000;
        return null;
      }

      const expiresIn =
        data && typeof data === "object" && typeof (data as { expires_in?: unknown }).expires_in === "number"
          ? (data as { expires_in: number }).expires_in
          : 900;
      const lifetimeMs = Math.max(60, Math.min(expiresIn, 3600) - 60) * 1000;
      mediaTokenCache = {
        key,
        token,
        expiresAt: Date.now() + lifetimeMs,
      };
      return token;
    } catch {
      mediaTokenFailureUntil = Date.now() + 60_000;
      return null;
    } finally {
      mediaTokenInflight = null;
    }
  })();

  return mediaTokenInflight;
}

/** Anexa o token de mídia a uma URL oficial de streaming. */
export function withMuscleWikiMediaToken(
  rawUrl: string | null,
  token: string | null,
): string | null {
  if (!rawUrl || !token) return null;

  try {
    const base = getBaseUrl();
    const absolute = rawUrl.startsWith("http")
      ? rawUrl
      : `${base}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;
    const url = new URL(absolute);
    if (!url.pathname.startsWith("/stream/")) return null;
    url.searchParams.set("token", token);
    return url.toString();
  } catch {
    return null;
  }
}
