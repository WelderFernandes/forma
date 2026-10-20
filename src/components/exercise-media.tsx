"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ExternalLink,
  Play,
  RefreshCw,
  Repeat2,
  VideoOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ExerciseMediaData,
  ExerciseMediaVideo,
} from "@/lib/exercise-demos";

const ANGLE_LABELS: Record<string, string> = {
  front: "Frente",
  side: "Lateral",
  "3/4": "3/4",
};

const GENDER_LABELS: Record<string, string> = {
  male: "Masculino",
  female: "Feminino",
  neutral: "Demonstração",
};

const PROVIDER_LABELS: Record<"musclewiki" | "ymove", string> = {
  musclewiki: "MuscleWiki",
  ymove: "Your Move",
};

type ExerciseMediaProps = {
  media: ExerciseMediaData;
  exerciseName: string;
  preferredGender?: string | null;
};

type VideoMedia = Extract<ExerciseMediaData, { kind: "video" }>;
type GifMedia = Extract<ExerciseMediaData, { kind: "gif" }>;

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function sourceDiffers(sourceName: string | null, exerciseName: string) {
  return Boolean(
    sourceName &&
      sourceName.trim().toLowerCase() !== exerciseName.trim().toLowerCase(),
  );
}

export function ExerciseMedia({
  media,
  exerciseName,
  preferredGender,
}: ExerciseMediaProps) {
  if (media.kind === "gif") {
    return <MovementStudy media={media} exerciseName={exerciseName} />;
  }

  return (
    <VideoStudy
      media={media}
      exerciseName={exerciseName}
      preferredGender={preferredGender}
    />
  );
}

function VideoStudy({
  media,
  exerciseName,
  preferredGender,
}: {
  media: VideoMedia;
  exerciseName: string;
  preferredGender?: string | null;
}) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const [started, setStarted] = useState(false);

  const genders = useMemo(
    () => unique(media.videos.map((video) => video.gender.toLowerCase())),
    [media.videos],
  );
  const angles = useMemo(
    () => unique(media.videos.map((video) => video.angle.toLowerCase())),
    [media.videos],
  );

  const initialGender = useMemo(() => {
    const preferred = preferredGender?.toLowerCase();
    if (preferred && genders.includes(preferred)) return preferred;
    return genders[0] ?? "";
  }, [genders, preferredGender]);

  const initialAngle = useMemo(() => {
    if (angles.includes("front")) return "front";
    return angles[0] ?? "";
  }, [angles]);

  const [gender, setGender] = useState(initialGender);
  const [angle, setAngle] = useState(initialAngle);

  const anglesForGender = useMemo(
    () =>
      unique(
        media.videos
          .filter((video) => video.gender.toLowerCase() === gender)
          .map((video) => video.angle.toLowerCase()),
      ),
    [gender, media.videos],
  );
  const visibleAngles = anglesForGender.length > 0 ? anglesForGender : angles;
  const activeAngle = visibleAngles.includes(angle)
    ? angle
    : visibleAngles.includes("front")
      ? "front"
      : (visibleAngles[0] ?? "");

  const current: ExerciseMediaVideo | undefined = useMemo(() => {
    return (
      media.videos.find(
        (video) =>
          video.gender.toLowerCase() === gender &&
          video.angle.toLowerCase() === activeAngle,
      ) ??
      media.videos.find((video) => video.gender.toLowerCase() === gender) ??
      media.videos.find(
        (video) => video.angle.toLowerCase() === activeAngle,
      ) ??
      media.videos[0]
    );
  }, [activeAngle, gender, media.videos]);

  useEffect(() => {
    setFailed(false);
    setStarted(false);
  }, [current?.src]);

  if (!current) return null;

  const providerLabel = PROVIDER_LABELS[media.provider];
  const isPortrait = media.orientation === "portrait";
  const differs = sourceDiffers(media.sourceName, exerciseName);

  function handlePlay() {
    const element = videoRef.current;
    if (!element) return;
    if (element.ended) element.currentTime = 0;
    setStarted(true);
    void element.play().catch(() => setStarted(false));
  }

  return (
    <section
      aria-label={`Demonstração em vídeo de ${exerciseName}`}
      className="overflow-hidden rounded-[1.8rem] border border-white/10 bg-ink text-cream shadow-[0_24px_70px_-38px_rgba(11,16,8,0.95)]"
    >
      <div
        className={cn(
          "grid",
          isPortrait
            ? "lg:grid-cols-[minmax(0,0.9fr)_1.1fr]"
            : "lg:grid-cols-[1.6fr_1fr]",
        )}
      >
        <div
          className={cn(
            "relative flex items-center justify-center",
            isPortrait
              ? "bg-[#d9d5cb] p-4 sm:p-6 lg:p-8"
              : "bg-[#050705] p-3 sm:p-4",
          )}
        >
          <div
            className={cn(
              "relative overflow-hidden border border-black/10 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.75)]",
              isPortrait
                ? "aspect-[9/16] w-full max-w-[320px] rounded-[1.5rem] bg-[#e7e3da]"
                : "aspect-video w-full rounded-[1.2rem] bg-[#050705]",
            )}
          >
            {!failed ? (
              <>
                <video
                  ref={videoRef}
                  key={current.src}
                  src={current.src}
                  poster={current.poster ?? undefined}
                  controls={started}
                  playsInline
                  preload="metadata"
                  aria-label={`Vídeo demonstrativo de ${exerciseName}`}
                  className="h-full w-full object-contain"
                  onPlay={() => setStarted(true)}
                  onEnded={() => setStarted(false)}
                  onError={() => setFailed(true)}
                />

                {!started ? (
                  <button
                    type="button"
                    onClick={handlePlay}
                    aria-label={`Reproduzir demonstração de ${exerciseName}`}
                    className="group absolute inset-0 z-[2] flex flex-col items-center justify-center gap-3 bg-gradient-to-t from-black/30 via-black/0 to-black/10 p-6 text-center text-cream transition-colors hover:bg-black/10"
                  >
                    <span className="flex size-16 items-center justify-center rounded-full border border-white/25 bg-ink/80 text-lime shadow-[0_18px_38px_-18px_rgba(0,0,0,0.9)] backdrop-blur-sm transition-transform duration-300 group-hover:scale-105">
                      <Play className="ml-0.5 size-7 fill-current" />
                    </span>
                    <span className="rounded-full border border-white/15 bg-ink/70 px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-cream/85 backdrop-blur-sm">
                      Reproduzir
                    </span>
                  </button>
                ) : null}
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink px-6 text-center">
                <span className="flex size-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-cream/70">
                  <VideoOff className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-medium text-cream">
                    Não foi possível carregar o vídeo.
                  </p>
                  <p className="mt-1 text-xs text-cream/50">
                    A demonstração continua disponível na fonte.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFailed(false);
                      setStarted(false);
                      router.refresh();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-xs font-semibold text-cream/80 transition-colors hover:border-white/30 hover:text-cream"
                  >
                    <RefreshCw className="size-3.5" />
                    Tentar novamente
                  </button>
                  <a
                    href={media.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-lime/40 bg-lime/10 px-3.5 py-1.5 text-xs font-semibold text-lime transition-colors hover:bg-lime/20"
                  >
                    Abrir fonte
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>
              </div>
            )}

            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-end gap-2 p-3.5">
              <span className="rounded-full border border-white/15 bg-ink/60 px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-cream/75 backdrop-blur-sm">
                {providerLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-7 p-5 sm:p-6 lg:p-8">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-lime/80">
              Movimento em vídeo
            </p>
            <h2 className="mt-2 max-w-md font-display text-[clamp(2rem,3.4vw,3.05rem)] leading-[1.02] tracking-[-0.02em] text-cream">
              Veja a execução
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-cream/60">
              Use o vídeo para conferir amplitude, ritmo e posição de
              articulações antes de começar as séries.
            </p>
            {differs ? (
              <p className="mt-3 max-w-md text-xs leading-relaxed text-cream/40">
                Demonstração: {media.sourceName}
              </p>
            ) : null}
            {media.variantNote ? (
              <div className="mt-5 max-w-md rounded-2xl border border-lime/20 bg-lime/[0.06] p-3.5">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-lime/75">
                  Variação em vídeo
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-cream/60">
                  {media.variantNote}
                </p>
              </div>
            ) : null}

            <div className="mt-5 max-w-md border-t border-white/10 pt-4">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-cream/35">
                O que observar
              </p>
              <dl className="mt-2.5 space-y-2.5">
                <div className="flex gap-3">
                  <dt className="w-[5.5rem] shrink-0 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-lime/60">
                    Amplitude
                  </dt>
                  <dd className="text-xs leading-relaxed text-cream/55">
                    Compare os extremos do movimento com a sua mobilidade.
                  </dd>
                </div>
                <div className="flex gap-3">
                  <dt className="w-[5.5rem] shrink-0 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-lime/60">
                    Ritmo
                  </dt>
                  <dd className="text-xs leading-relaxed text-cream/55">
                    Desça com controle e suba sem perder a posição.
                  </dd>
                </div>
                <div className="flex gap-3">
                  <dt className="w-[5.5rem] shrink-0 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-lime/60">
                    Articulações
                  </dt>
                  <dd className="text-xs leading-relaxed text-cream/55">
                    Observe joelhos, cotovelos e coluna em relação ao seu corpo.
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="space-y-4">
            {genders.length > 1 ? (
              <div className="space-y-2">
                <p className="text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-cream/35">
                  Modelo
                </p>
                <div
                  className="flex flex-wrap gap-2"
                  role="group"
                  aria-label="Modelo da demonstração"
                >
                  {genders.map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={gender === option}
                      onClick={() => setGender(option)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                        gender === option
                          ? "border-lime bg-lime text-ink"
                          : "border-white/15 text-cream/60 hover:border-white/30 hover:text-cream",
                      )}
                    >
                      {GENDER_LABELS[option] ?? option}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {visibleAngles.length > 1 ? (
              <div className="space-y-2">
                <p className="text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-cream/35">
                  Ângulo
                </p>
                <div
                  className="flex flex-wrap gap-2"
                  role="group"
                  aria-label="Ângulo do vídeo"
                >
                  {visibleAngles.map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={activeAngle === option}
                      onClick={() => setAngle(option)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                        activeAngle === option
                          ? "border-lime bg-lime text-ink"
                          : "border-white/15 text-cream/60 hover:border-white/30 hover:text-cream",
                      )}
                    >
                      {ANGLE_LABELS[option] ?? option}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
              <a
                href={media.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-cream/45 transition-colors hover:text-lime"
              >
                {media.provider === "ymove"
                  ? "Vídeo por Your Move"
                  : "Demonstração por MuscleWiki"}
                <ExternalLink className="size-3.5" />
              </a>
              <a
                href="#como-executar"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-lime/80 transition-colors hover:text-lime"
              >
                Ver passo a passo
                <ArrowDown className="size-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MovementStudy({
  media,
  exerciseName,
}: {
  media: GifMedia;
  exerciseName: string;
}) {
  const differs = sourceDiffers(media.sourceName, exerciseName);

  return (
    <section
      aria-label={`Animação demonstrativa de ${exerciseName}`}
      className="overflow-hidden rounded-[1.8rem] border border-border-soft bg-surface-warm text-foreground shadow-card"
    >
      <div className="grid gap-5 p-5 sm:grid-cols-[204px_minmax(0,1fr)] sm:items-center sm:gap-6 sm:p-6">
        <div className="mx-auto w-[204px] max-w-full">
          <div className="relative aspect-square overflow-hidden rounded-[1.6rem] border border-ink/10 bg-[#f7f3e7] p-3 shadow-[0_18px_40px_-30px_rgba(11,16,8,0.6)]">
            {/* O fundo do GIF é branco; multiply faz a figura assentar no papel. */}
            <Image
              src={media.src}
              alt={`Animação demonstrativa de ${exerciseName}`}
              width={media.width}
              height={media.height}
              loading="lazy"
              unoptimized
              className="h-full w-full object-contain mix-blend-multiply"
            />
            <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-ink/80 px-2 py-1 text-[0.55rem] font-semibold uppercase tracking-[0.14em] text-cream/80 backdrop-blur-sm">
              <Repeat2 className="size-3" />
              Ciclo
            </span>
          </div>
          <p className="mt-2 text-center text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Prévia em ciclo
          </p>
        </div>

        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-brand">
            Animação compacta
          </p>
          <h2 className="mt-2 font-display text-[clamp(1.8rem,3vw,2.7rem)] leading-[1.02] tracking-[-0.02em]">
            Estudo de movimento
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
            Uma prévia em ciclo para visualizar a trajetória. O passo a passo
            abaixo completa a execução.
          </p>
          {differs ? (
            <p className="mt-2 max-w-lg text-xs leading-relaxed text-muted-foreground">
              Base: {media.sourceName}
            </p>
          ) : null}
          {media.variantNote ? (
            <div className="mt-4 max-w-lg rounded-2xl border border-brand/20 bg-brand/[0.06] p-3.5">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-brand">
                Variação em animação
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {media.variantNote}
              </p>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border-soft pt-4">
            <a
              href={media.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-brand"
            >
              Animação por ExerciseDB
              <ExternalLink className="size-3.5" />
            </a>
            <a
              href={media.licenseUrl}
              target="_blank"
              rel="noreferrer"
              title="Licença de uso não comercial do ExerciseDB Free"
              className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:border-brand/30 hover:text-brand"
            >
              {media.license}
            </a>
            <a
              href="#como-executar"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand transition-colors hover:text-brand/80"
            >
              Passo a passo
              <ArrowDown className="size-3.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
