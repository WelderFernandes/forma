import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Prisma } from "@prisma/client";
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Play,
  Repeat2,
  Search,
  SearchX,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentUser } from "@/server/auth-helpers";
import { getExerciseMediaBadge } from "@/server/exercise-media";
import { getExercises } from "@/server/queries";
import prisma from "@/lib/prisma";
import {
  CATEGORY_LABELS,
  EQUIPMENT_LABELS,
  LEVEL_LABELS,
  MUSCLE_LABELS,
  normalizeMuscle,
  type Category,
  type Equipment,
  type Level,
} from "@/lib/domain/types";
import { cn, formatNumber, titleCase } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Exercícios",
  description:
    "Biblioteca de exercícios com instruções passo a passo, dicas de execução, erros comuns e orientação de respiração.",
};

/** Quantidade máxima de exercícios exibidos por página. */
const PAGE_SIZE = 60;

/** Teto de candidatos lidos do banco quando há busca por nome. */
const SEARCH_CANDIDATE_LIMIT = 500;

/** Rótulos do impacto articular — não existe mapa de domínio para esse campo. */
const IMPACT_LABELS: Record<string, string> = {
  low: "Baixo",
  moderate: "Moderado",
  high: "Alto",
};

const IMPACT_VARIANTS: Record<string, "success" | "warning" | "danger"> = {
  low: "success",
  moderate: "warning",
  high: "danger",
};

/** Ordem didática dos níveis, do mais simples ao mais avançado. */
const DIFFICULTY_ORDER = ["beginner", "intermediate", "advanced"];

/**
 * O banco grava as chaves de músculo sem acento ("gluteos"), enquanto o mapa de
 * domínio usa chaves acentuadas ("glúteos"). Normalizamos as duas pontas para
 * que os rótulos sempre apareçam.
 */
const MUSCLE_LABEL_BY_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(MUSCLE_LABELS).map(([key, label]) => [normalizeMuscle(key), label]),
);

function muscleLabel(value: string): string {
  return MUSCLE_LABEL_BY_KEY[normalizeMuscle(value)] ?? titleCase(value);
}

function equipmentLabel(value: string): string {
  return EQUIPMENT_LABELS[value as Equipment] ?? titleCase(value);
}

function categoryLabel(value: string): string {
  return CATEGORY_LABELS[value as Category] ?? titleCase(value);
}

function levelLabel(value: string): string {
  return LEVEL_LABELS[value as Level] ?? titleCase(value);
}

type Filters = {
  q: string;
  musculo: string;
  equipamento: string;
  categoria: string;
  nivel: string;
  pagina: string;
};

const FILTER_KEYS = ["q", "musculo", "equipamento", "categoria", "nivel"] as const;

type FilterKey = (typeof FILTER_KEYS)[number];

type SearchParams = Record<string, string | string[] | undefined>;

/** Lê um parâmetro de query aceitando valores repetidos. */
function readParam(params: SearchParams, key: string): string {
  const value = params[key];
  if (Array.isArray(value)) return (value[0] ?? "").trim();
  return (value ?? "").trim();
}

/** Monta a URL da biblioteca preservando os filtros ativos. */
function buildHref(filters: Filters, overrides: Partial<Filters> = {}): string {
  const merged = { ...filters, ...overrides };
  const params = new URLSearchParams();

  for (const key of FILTER_KEYS) {
    const value = merged[key];
    if (value) params.set(key, value);
  }
  if (merged.pagina && merged.pagina !== "1") params.set("pagina", merged.pagina);

  const query = params.toString();
  return query ? `/exercicios?${query}` : "/exercicios";
}

/**
 * Monta o filtro do banco. Mantém a mesma lógica de `getExercises`
 * (src/server/queries) para que a contagem total bata com a listagem.
 * O nome não entra aqui: a busca é feita em memória (veja `normalizeText`).
 */
function buildWhere(filters: Filters): Prisma.ExerciseWhereInput {
  const where: Prisma.ExerciseWhereInput = {};

  if (filters.musculo) where.primaryMuscle = filters.musculo;
  if (filters.equipamento) where.equipment = filters.equipamento;
  if (filters.categoria) where.category = filters.categoria;
  if (filters.nivel) where.difficulty = filters.nivel;

  return where;
}

/**
 * Normaliza um texto para comparação: sem acentos, em minúsculas e sem
 * pontuação. O `contains` do SQLite não ignora acentos, então uma busca por
 * "flexao" não encontraria "Flexão" — normalizar os dois lados resolve.
 */
function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** Converte o parâmetro de página em um número válido. */
function parsePage(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-brand bg-brand text-brand-foreground"
          : "border-border bg-background text-muted-foreground hover:border-brand/40 hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

function FilterGroup({
  title,
  filterKey,
  options,
  active,
  filters,
}: {
  title: string;
  filterKey: FilterKey;
  options: { value: string; label: string }[];
  active: string;
  filters: Filters;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="flex flex-wrap gap-1.5">
        <FilterChip href={buildHref(filters, { [filterKey]: "", pagina: "1" })} active={!active}>
          Todos
        </FilterChip>
        {options.map((option) => (
          <FilterChip
            key={option.value}
            href={buildHref(filters, {
              [filterKey]: active === option.value ? "" : option.value,
              pagina: "1",
            })}
            active={active === option.value}
          >
            {option.label}
          </FilterChip>
        ))}
      </div>
    </div>
  );
}

export default async function ExercisesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const filters: Filters = {
    q: readParam(params, "q"),
    musculo: readParam(params, "musculo"),
    equipamento: readParam(params, "equipamento"),
    categoria: readParam(params, "categoria"),
    nivel: readParam(params, "nivel"),
    pagina: readParam(params, "pagina"),
  };

  const where = buildWhere(filters);
  const busca = normalizeText(filters.q);

  const [libraryTotal, muscleRows, equipmentRows, categoryRows, difficultyRows, user] =
    await Promise.all([
      prisma.exercise.count(),
      prisma.exercise.findMany({
        distinct: ["primaryMuscle"],
        select: { primaryMuscle: true },
      }),
      prisma.exercise.findMany({ distinct: ["equipment"], select: { equipment: true } }),
      prisma.exercise.findMany({ distinct: ["category"], select: { category: true } }),
      prisma.exercise.findMany({ distinct: ["difficulty"], select: { difficulty: true } }),
      getCurrentUser(),
    ]);

  // `getExercises` não aceita offset, então buscamos até o fim da página atual
  // e cortamos o trecho que pertence a ela (a ordenação é por nome).
  const listar = async (limit: number) =>
    getExercises({
      muscle: filters.musculo || undefined,
      equipment: filters.equipamento || undefined,
      category: filters.categoria || undefined,
      difficulty: filters.nivel || undefined,
      limit,
    });

  let total: number;
  let totalPages: number;
  let page: number;
  let exercises: Awaited<ReturnType<typeof getExercises>>;

  if (busca) {
    // Com busca, filtramos os candidatos em memória para ignorar acentos
    // ("flexao" precisa encontrar "Flexão de Barra").
    const candidatos = await listar(SEARCH_CANDIDATE_LIMIT);
    const filtrados = candidatos.filter((exercise) =>
      normalizeText(exercise.name).includes(busca),
    );

    total = filtrados.length;
    totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    page = Math.min(parsePage(filters.pagina), totalPages);
    exercises = filtrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  } else {
    total = await prisma.exercise.count({ where });
    totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    page = Math.min(parsePage(filters.pagina), totalPages);

    const candidatos = await listar(page * PAGE_SIZE);
    exercises = candidatos.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }

  const favorites = user ? await prisma.favorite.findMany({ where: { userId: user.id } }) : [];
  const favoriteIds = new Set(favorites.map((favorite) => favorite.exerciseId));

  const byLabel = (a: { label: string }, b: { label: string }) =>
    a.label.localeCompare(b.label, "pt-BR");

  const muscleOptions = muscleRows
    .map((row) => ({ value: row.primaryMuscle, label: muscleLabel(row.primaryMuscle) }))
    .sort(byLabel);

  const equipmentOptions = equipmentRows
    .map((row) => ({ value: row.equipment, label: equipmentLabel(row.equipment) }))
    .sort(byLabel);

  const categoryOptions = categoryRows
    .map((row) => ({ value: row.category, label: categoryLabel(row.category) }))
    .sort(byLabel);

  const difficultyOptions = difficultyRows
    .map((row) => ({ value: row.difficulty, label: levelLabel(row.difficulty) }))
    .sort(
      (a, b) =>
        DIFFICULTY_ORDER.indexOf(a.value) - DIFFICULTY_ORDER.indexOf(b.value),
    );

  const activeFilterCount = [
    filters.q,
    filters.musculo,
    filters.equipamento,
    filters.categoria,
    filters.nivel,
  ].filter(Boolean).length;

  const firstResult = exercises.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const lastResult = (page - 1) * PAGE_SIZE + exercises.length;

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <PageHeader
        eyebrow="Biblioteca"
        title="Exercícios"
        description={`${formatNumber(libraryTotal)} exercícios com passo a passo, dicas de execução e erros comuns.`}
        actions={
          favorites.length > 0 ? (
            <Badge variant="brand">
              <Star className="size-3 fill-current" />
              {favorites.length}{" "}
              {favorites.length === 1 ? "favorito" : "favoritos"}
            </Badge>
          ) : undefined
        }
      />

      {/* Busca */}
      <Card>
        <CardContent className="p-4">
          <form method="get" action="/exercicios" className="flex flex-col gap-2 sm:flex-row">
            {/* Preserva os filtros ativos ao buscar */}
            {filters.musculo && <input type="hidden" name="musculo" value={filters.musculo} />}
            {filters.equipamento && (
              <input type="hidden" name="equipamento" value={filters.equipamento} />
            )}
            {filters.categoria && (
              <input type="hidden" name="categoria" value={filters.categoria} />
            )}
            {filters.nivel && <input type="hidden" name="nivel" value={filters.nivel} />}

            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={filters.q}
                placeholder="Busque pelo nome do exercício (ex.: agachamento)"
                aria-label="Buscar exercício"
                className="pl-10"
              />
            </div>
            <Button type="submit" variant="brand">
              <Search className="size-4" />
              Buscar
            </Button>
            {activeFilterCount > 0 && (
              <Button asChild variant="ghost" size="lg">
                <Link href="/exercicios">
                  <X className="size-4" />
                  Limpar
                </Link>
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Filtros */}
      <details open={activeFilterCount > 0} className="group rounded-2xl border border-border bg-card">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-brand" />
            Filtros
            {activeFilterCount > 0 && (
              <Badge variant="brand">{activeFilterCount} ativo{activeFilterCount > 1 ? "s" : ""}</Badge>
            )}
          </span>
          <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>
        <div className="space-y-4 border-t border-border p-4">
          <FilterGroup
            title="Grupo muscular"
            filterKey="musculo"
            options={muscleOptions}
            active={filters.musculo}
            filters={filters}
          />
          <FilterGroup
            title="Equipamento"
            filterKey="equipamento"
            options={equipmentOptions}
            active={filters.equipamento}
            filters={filters}
          />
          <FilterGroup
            title="Categoria"
            filterKey="categoria"
            options={categoryOptions}
            active={filters.categoria}
            filters={filters}
          />
          <FilterGroup
            title="Nível"
            filterKey="nivel"
            options={difficultyOptions}
            active={filters.nivel}
            filters={filters}
          />
        </div>
      </details>

      {/* Resultados */}
      {exercises.length === 0 ? (
        <EmptyState
          icon={libraryTotal === 0 ? Dumbbell : SearchX}
          title={
            libraryTotal === 0
              ? "A biblioteca está vazia"
              : "Nenhum exercício encontrado"
          }
          description={
            libraryTotal === 0
              ? "Ainda não há exercícios cadastrados. Assim que a biblioteca for preenchida, ela aparece aqui."
              : "Não encontramos exercícios com esses filtros. Tente outra busca ou limpe os filtros para ver toda a biblioteca."
          }
          action={
            activeFilterCount > 0 ? (
              <Button asChild variant="brand">
                <Link href="/exercicios">Limpar filtros</Link>
              </Button>
            ) : null
          }
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {exercises.map((exercise) => {
              const impact = exercise.impact;
              const mediaBadge = getExerciseMediaBadge(
                exercise.slug,
                Boolean(exercise.muscleWikiId),
              );
              return (
                <Card
                  key={exercise.id}
                  className="group relative flex h-full flex-col transition-colors hover:border-brand/40"
                >
                  <CardHeader className="gap-2 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="font-display text-base leading-snug">
                        <Link
                          href={`/exercicios/${exercise.slug}`}
                          className="after:absolute after:inset-0 after:content-['']"
                        >
                          {exercise.name}
                        </Link>
                      </CardTitle>
                      {favoriteIds.has(exercise.id) && (
                        <Star
                          className="size-4 shrink-0 fill-amber-400 text-amber-400"
                          aria-label="Favorito"
                        />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      <Badge variant="brand">{muscleLabel(exercise.primaryMuscle)}</Badge>
                      <Badge variant="outline">{equipmentLabel(exercise.equipment)}</Badge>
                      <Badge>{levelLabel(exercise.difficulty)}</Badge>
                      <Badge variant={IMPACT_VARIANTS[impact] ?? "default"}>
                        Impacto {IMPACT_LABELS[impact] ?? impact}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardFooter className="mt-auto justify-between gap-3 text-xs text-muted-foreground">
                    <span>{categoryLabel(exercise.category)}</span>
                    <div className="flex items-center gap-3">
                      {mediaBadge ? (
                        <span className="inline-flex items-center gap-1 font-medium text-brand">
                          {mediaBadge === "video" ? (
                            <Play className="size-3 fill-current" />
                          ) : (
                            <Repeat2 className="size-3" />
                          )}
                          {mediaBadge === "video" ? "Vídeo" : "Animação"}
                        </span>
                      ) : null}
                      <span className="inline-flex items-center gap-1 font-medium text-brand">
                        Ver detalhes
                        <ArrowRight className="size-3.5" />
                      </span>
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {/* Paginação */}
          <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando{" "}
              <span className="font-medium text-foreground">{formatNumber(firstResult)}</span>–
              <span className="font-medium text-foreground">{formatNumber(lastResult)}</span> de{" "}
              <span className="font-medium text-foreground">{formatNumber(total)}</span> exercícios
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={buildHref(filters, { pagina: String(page - 1) })}
                    scroll={false}
                    aria-disabled={page <= 1}
                    className={cn(page <= 1 && "pointer-events-none opacity-50")}
                  >
                    <ChevronLeft className="size-4" />
                    Anterior
                  </Link>
                </Button>
                <span className="text-xs text-muted-foreground">
                  Página {page} de {totalPages}
                </span>
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={buildHref(filters, { pagina: String(page + 1) })}
                    scroll={false}
                    aria-disabled={page >= totalPages}
                    className={cn(page >= totalPages && "pointer-events-none opacity-50")}
                  >
                    Próxima
                    <ChevronRight className="size-4" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
