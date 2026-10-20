"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Dumbbell,
  Flame,
  HeartPulse,
  Loader2,
  Minus,
  Plus,
  Repeat,
  Scale,
  ShieldCheck,
  Sparkles,
  Timer,
  TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { completeOnboarding } from "@/server/actions/profile";
import {
  generatePlanFromProfile,
  previewPlan,
  type PlanPreview,
} from "@/server/actions/plan";
import {
  adjustCalories,
  calculateBmi,
  calculateBmr,
  calculateMacros,
  calculateTdee,
} from "@/lib/domain/calculators";
import {
  WEEKDAYS,
  fitTrainingDays,
  formatTrainingDays,
} from "@/lib/domain/schedule";

/* ───────────────────────────── Tipos e constantes ───────────────────────────── */

type Sex = "female" | "male" | "other" | "";

type Draft = {
  goal: string;
  sex: Sex;
  age: number;
  heightCm: string;
  weightKg: string;
  level: string;
  equipment: string[];
  daysPerWeek: number;
  trainingDays: number[];
  sessionMinutes: number;
  activity: string;
  focusAreas: string[];
  lowImpact: boolean;
};

const INITIAL: Draft = {
  goal: "",
  sex: "",
  age: 30,
  heightCm: "170",
  weightKg: "72",
  level: "",
  equipment: ["none"],
  daysPerWeek: 3,
  trainingDays: [1, 3, 5],
  sessionMinutes: 45,
  activity: "",
  focusAreas: [],
  lowImpact: false,
};

const STORAGE_KEY = "forma.onboarding.v2";
const RESULT_STEP = 13;
const QUESTION_COUNT = 12;
const PLAN_KEYS = new Set<keyof Draft>([
  "goal",
  "level",
  "equipment",
  "daysPerWeek",
  "sessionMinutes",
  "focusAreas",
  "lowImpact",
]);

const GOALS = [
  {
    id: "lose_weight",
    label: "Emagrecer",
    body: "Reduzir gordura preservando músculo.",
    icon: TrendingDown,
  },
  {
    id: "build_muscle",
    label: "Ganhar massa",
    body: "Hipertrofia com progressão de carga.",
    icon: Dumbbell,
  },
  {
    id: "recompose",
    label: "Recompor",
    body: "Trocar gordura por músculo.",
    icon: Repeat,
  },
  {
    id: "mobility",
    label: "Mobilidade",
    body: "Amplitude, postura e controle.",
    icon: Activity,
  },
  {
    id: "endurance",
    label: "Condicionamento",
    body: "Mais fôlego no dia a dia.",
    icon: HeartPulse,
  },
  {
    id: "general_health",
    label: "Saúde geral",
    body: "Movimento regular e energia.",
    icon: Sparkles,
  },
];

const SEX_OPTIONS = [
  { id: "female" as const, label: "Feminino", body: "Cálculo metabólico feminino" },
  { id: "male" as const, label: "Masculino", body: "Cálculo metabólico masculino" },
  { id: "other" as const, label: "Outro", body: "Cálculo neutro" },
];

const ACTIVITY_OPTIONS = [
  {
    id: "sedentary",
    label: "Sedentário",
    body: "Passo o dia sentado(a), pouco movimento fora do treino.",
  },
  {
    id: "light",
    label: "Leve",
    body: "Caminho um pouco, mas não treino com frequência.",
  },
  {
    id: "moderate",
    label: "Moderado",
    body: "Treino de 3 a 5 vezes por semana.",
  },
  {
    id: "active",
    label: "Ativo",
    body: "Treino de 6 a 7 vezes ou tenho trabalho físico.",
  },
  {
    id: "athlete",
    label: "Atleta",
    body: "Treino duas vezes ao dia ou rotina intensa.",
  },
];

const LEVELS = [
  {
    id: "beginner",
    label: "Nunca treinei",
    body: "Estou começando agora e quero aprender o básico.",
  },
  {
    id: "intermediate",
    label: "Já treinei",
    body: "Alguns meses de academia e conheço os movimentos.",
  },
  {
    id: "advanced",
    label: "Treino há anos",
    body: "Conheço meu corpo e busco progressão e periodização.",
  },
];

const EQUIPMENT_OPTIONS = [
  { id: "none", label: "Só o corpo", body: "Sem equipamento" },
  { id: "dumbbell", label: "Halteres", body: "Par de halteres" },
  { id: "barbell", label: "Barra", body: "Com anilhas" },
  { id: "band", label: "Elástico", body: "Faixa de resistência" },
  { id: "kettlebell", label: "Kettlebell", body: "Peso russo" },
  { id: "machine", label: "Aparelhos", body: "Academia" },
  { id: "bench", label: "Banco", body: "Para apoio" },
  { id: "mat", label: "Tapete", body: "Para o chão" },
  { id: "step", label: "Step", body: "Plataforma" },
  { id: "cable", label: "Cabo", body: "Polia" },
  { id: "bike", label: "Bicicleta", body: "Ergométrica" },
];

const FOCUS_OPTIONS = [
  { id: "peito", label: "Peito" },
  { id: "costas", label: "Costas" },
  { id: "quadril", label: "Glúteos" },
  { id: "pernas", label: "Pernas" },
  { id: "ombro", label: "Ombros" },
  { id: "bracos", label: "Braços" },
  { id: "core", label: "Core" },
  { id: "cardio", label: "Cardio" },
  { id: "mobilidade", label: "Mobilidade" },
];

const STEP_MEDIA = [
  {
    image: "/media/run.jpg",
    alt: "Pessoas correndo ao amanhecer",
    kicker: "Seu ponto de partida",
    quote: "A constância vence a intensidade. Sempre.",
    caption: "Um plano feito para a sua rotina — não para a rotina de outra pessoa.",
  },
  {
    image: "/media/gym.jpg",
    alt: "Fileira de halteres na academia",
    kicker: "Direção",
    quote: "O objetivo certo muda tudo o que vem depois.",
    caption: "Divisão, volume e faixa de repetições são definidos a partir daqui.",
  },
  {
    image: "/media/hero.jpg",
    alt: "Barra com anilhas no chão da academia",
    kicker: "Precisão",
    quote: "Números sem julgamento. Só contexto.",
    caption: "Usamos seus dados apenas para calcular metabolismo e metas.",
  },
  {
    image: "/media/run.jpg",
    alt: "Pessoas correndo ao amanhecer",
    kicker: "Ritmo",
    quote: "O melhor treino é o que cabe na sua semana.",
    caption: "Você escolhe quantos dias e quanto tempo tem de verdade.",
  },
  {
    image: "/media/gym.jpg",
    alt: "Fileira de halteres na academia",
    kicker: "Estrutura",
    quote: "Menos improviso. Mais intenção em cada série.",
    caption: "O plano se adapta ao equipamento que você tem em mãos.",
  },
  {
    image: "/media/mind.jpg",
    alt: "Prática de mobilidade ao pôr do sol",
    kicker: "Equilíbrio",
    quote: "Treinar também é aprender a se escutar.",
    caption: "Mobilidade, sono e recuperação entram no mesmo plano.",
  },
];

function birthDateFromAge(age: number) {
  const year = new Date().getFullYear() - age;
  return `${year}-06-15`;
}

function formatValue(value: number, decimals = 0) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/* ───────────────────────────── Componente principal ───────────────────────────── */

export function OnboardingWizard({ name }: { name: string }) {
  const router = useRouter();
  const firstName = name.split(" ")[0] || "você";

  const [step, setStep] = React.useState(0);
  const [draft, setDraft] = React.useState<Draft>(INITIAL);
  const [hydrated, setHydrated] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [preview, setPreview] = React.useState<PlanPreview | null>(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [previewError, setPreviewError] = React.useState(false);
  const [buildStage, setBuildStage] = React.useState(0);
  const timerRef = React.useRef<number | null>(null);

  /* Persistência local — voltar ou atualizar não perde respostas. */
  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { draft?: Partial<Draft>; step?: number };
        if (parsed.draft) {
          setDraft((prev) => ({ ...prev, ...parsed.draft }));
        }
        if (
          typeof parsed.step === "number" &&
          parsed.step >= 0 &&
          parsed.step <= RESULT_STEP
        ) {
          setStep(parsed.step);
        }
      }
    } catch {
      /* rascunho inválido é ignorado */
    } finally {
      setHydrated(true);
    }
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ draft, step }),
      );
    } catch {
      /* armazenamento indisponível */
    }
  }, [draft, step, hydrated]);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const update = React.useCallback(
    <K extends keyof Draft>(key: K, value: Draft[K]) => {
      setDraft((prev) => ({ ...prev, [key]: value }));
      if (PLAN_KEYS.has(key)) setPreview(null);
    },
    [],
  );

  function goTo(next: number) {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setPending(false);
    setStep(Math.max(0, Math.min(RESULT_STEP, next)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    goTo(step - 1);
  }

  function scheduleNext() {
    if (pending) return;
    setPending(true);
    timerRef.current = window.setTimeout(() => {
      setPending(false);
      setStep((s) => Math.min(RESULT_STEP, s + 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 260);
  }

  function choose<K extends keyof Draft>(key: K, value: Draft[K]) {
    update(key, value);
    scheduleNext();
  }

  const canContinue = React.useMemo(() => {
    switch (step) {
      case 1:
        return draft.goal !== "";
      case 2:
        return draft.sex !== "";
      case 3:
        return draft.age >= 16 && draft.age <= 75;
      case 4:
        return Number(draft.heightCm) >= 140 && Number(draft.heightCm) <= 210;
      case 5:
        return Number(draft.weightKg) >= 40 && Number(draft.weightKg) <= 180;
      case 6:
        return draft.activity !== "";
      case 7:
        return draft.level !== "";
      case 8:
        return draft.daysPerWeek >= 2 && draft.daysPerWeek <= 6;
      case 9:
        return draft.trainingDays.length === draft.daysPerWeek;
      case 10:
        return draft.sessionMinutes >= 20 && draft.sessionMinutes <= 90;
      case 11:
        return draft.equipment.length > 0;
      case 12:
        return true;
      default:
        return true;
    }
  }, [step, draft]);

  const loadPreview = React.useCallback(async () => {
    setPreviewLoading(true);
    setPreviewError(false);
    try {
      const result = await previewPlan({
        goal: draft.goal,
        level: draft.level || "beginner",
        equipment: draft.equipment,
        daysPerWeek: draft.daysPerWeek,
        sessionMinutes: draft.sessionMinutes,
        focusAreas: draft.focusAreas,
        lowImpact: draft.lowImpact,
      });
      setPreview(result);
    } catch {
      setPreviewError(true);
    } finally {
      setPreviewLoading(false);
    }
  }, [
    draft.goal,
    draft.level,
    draft.equipment,
    draft.daysPerWeek,
    draft.sessionMinutes,
    draft.focusAreas,
    draft.lowImpact,
  ]);

  React.useEffect(() => {
    if (step !== RESULT_STEP) return;
    setBuildStage(0);
    const interval = window.setInterval(() => {
      setBuildStage((s) => Math.min(3, s + 1));
    }, 780);
    return () => window.clearInterval(interval);
  }, [step]);

  React.useEffect(() => {
    if (step !== RESULT_STEP || preview || previewLoading || previewError) return;
    void loadPreview();
  }, [step, preview, previewLoading, previewError, loadPreview]);

  const age = draft.age;
  const weight = Number(draft.weightKg);
  const height = Number(draft.heightCm);
  const effectiveSex = (draft.sex || "other") as "female" | "male" | "other";
  const effectiveActivity = (draft.activity || "moderate") as
    | "sedentary"
    | "light"
    | "moderate"
    | "active"
    | "athlete";

  const metrics = React.useMemo(() => {
    const bmr = calculateBmr({
      sex: effectiveSex,
      weightKg: weight,
      heightCm: height,
      age,
    }).bmr;
    const tdee = calculateTdee({ bmr, activity: effectiveActivity }).tdee;
    const adjustment = adjustCalories(tdee, draft.goal);
    const macros = calculateMacros({
      calories: adjustment.calories,
      weightKg: weight,
      goal: draft.goal,
    });
    const bmi = calculateBmi(weight, height);
    return {
      bmr,
      tdee,
      calories: macros.calories,
      protein: macros.protein,
      carbs: macros.carbs,
      fat: macros.fat,
      bmi,
    };
  }, [
    effectiveSex,
    weight,
    height,
    age,
    effectiveActivity,
    draft.goal,
  ]);

  async function finish() {
    if (saving) return;
    setSaving(true);
    try {
      await completeOnboarding({
        sex: effectiveSex,
        birthDate: birthDateFromAge(age),
        heightCm: height,
        weightKg: weight,
        goal: draft.goal,
        level: (draft.level || "beginner") as
          | "beginner"
          | "intermediate"
          | "advanced",
        equipment: draft.equipment,
        daysPerWeek: draft.daysPerWeek,
        sessionMinutes: draft.sessionMinutes,
        focusAreas: draft.focusAreas,
        lowImpact: draft.lowImpact,
        activity: effectiveActivity,
      });

      await generatePlanFromProfile();
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      toast.success("Plano criado. Bem-vindo à Forma.");
      router.push("/painel");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível criar seu plano agora.",
      );
    } finally {
      setSaving(false);
    }
  }

  /* ── Tela de construção / resultado ── */
  if (step === RESULT_STEP) {
    return (
      <ResultScreen
        firstName={firstName}
        draft={draft}
        preview={preview}
        metrics={metrics}
        buildStage={buildStage}
        loading={previewLoading}
        error={previewError}
        saving={saving}
        onRetry={() => {
          setPreviewError(false);
          void loadPreview();
        }}
        onFinish={finish}
        onBack={() => goTo(11)}
      />
    );
  }

  /* ── Fluxo de perguntas ── */
  return (
    <div className="relative min-h-dvh bg-ink text-cream">
      <div className="lg:grid lg:min-h-dvh lg:grid-cols-[1.06fr_0.94fr]">
        <div className="relative flex min-h-dvh flex-col">
          <div
            className="pointer-events-none absolute inset-0 lg:hidden"
            style={{
              background:
                "radial-gradient(70% 40% at 50% 0%, rgba(216,246,90,0.09), transparent 70%)",
            }}
          />

          <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
            <Logo tone="light" href="/" />
            <div className="flex items-center gap-4">
              {step > 0 && (
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cream/35">
                  {String(step).padStart(2, "0")} / {QUESTION_COUNT}
                </span>
              )}
              <Link
                href="/"
                className="text-[11px] font-medium uppercase tracking-[0.14em] text-cream/40 transition-colors hover:text-cream"
              >
                Sair
              </Link>
            </div>
          </header>

          {step > 0 && (
            <div className="relative z-10 px-5 sm:px-8 lg:px-12">
              <div className="flex gap-1.5">
                {Array.from({ length: QUESTION_COUNT }, (_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors duration-500",
                      i < step ? "bg-lime" : "bg-white/10",
                    )}
                  />
                ))}
              </div>
            </div>
          )}

          <main
            key={step}
            className="animate-step relative z-10 flex flex-1 flex-col justify-center px-5 py-9 sm:px-8 lg:px-12 xl:px-20"
          >
            <div className="mx-auto w-full max-w-[570px]">
              {step === 0 && <WelcomeStep firstName={firstName} />}

              {step === 1 && (
                <StepShell
                  eyebrow="Objetivo"
                  title={
                    <>
                      O que você quer
                      <br />
                      <em className="text-lime">construir?</em>
                    </>
                  }
                  hint="Isso define a divisão, o volume e a faixa de repetições do seu plano."
                >
                  <div className="mt-7 grid gap-2.5 sm:grid-cols-2">
                    {GOALS.map((goal) => (
                      <ChoiceCard
                        key={goal.id}
                        selected={draft.goal === goal.id}
                        onClick={() => choose("goal", goal.id)}
                        icon={goal.icon}
                        title={goal.label}
                        body={goal.body}
                        compact
                      />
                    ))}
                  </div>
                </StepShell>
              )}

              {step === 2 && (
                <StepShell
                  eyebrow="Sobre você"
                  title={
                    <>
                      Como o seu corpo
                      <br />
                      <em className="text-lime">se identifica?</em>
                    </>
                  }
                  hint="Usamos apenas para estimar seu metabolismo basal e metas calóricas."
                >
                  <div className="mt-7 grid gap-2.5">
                    {SEX_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => choose("sex", option.id)}
                        aria-pressed={draft.sex === option.id}
                        className={cn(
                          "group flex items-center justify-between gap-4 rounded-2xl border p-5 text-left transition-all duration-200",
                          draft.sex === option.id
                            ? "border-lime bg-lime/[0.08]"
                            : "border-white/10 bg-white/[0.035] hover:border-white/25 hover:bg-white/[0.06]",
                        )}
                      >
                        <div>
                          <p className="text-[16px] font-semibold tracking-[-0.02em]">
                            {option.label}
                          </p>
                          <p className="mt-0.5 text-[12.5px] text-cream/40">
                            {option.body}
                          </p>
                        </div>
                        <SelectionMark selected={draft.sex === option.id} />
                      </button>
                    ))}
                  </div>
                </StepShell>
              )}

              {step === 3 && (
                <StepShell
                  eyebrow="Idade"
                  title={
                    <>
                      Quantos anos
                      <br />
                      <em className="text-lime">você tem?</em>
                    </>
                  }
                  hint="A idade entra no cálculo do gasto energético diário."
                >
                  <div className="mt-8">
                    <MetricPicker
                      value={draft.age}
                      min={16}
                      max={75}
                      step={1}
                      unit="anos"
                      onChange={(value) => update("age", value)}
                    />
                  </div>
                </StepShell>
              )}

              {step === 4 && (
                <StepShell
                  eyebrow="Altura"
                  title={
                    <>
                      Qual é a sua
                      <br />
                      <em className="text-lime">altura?</em>
                    </>
                  }
                  hint="Usamos para calcular IMC, volume de treino e metas nutricionais."
                >
                  <div className="mt-8">
                    <MetricPicker
                      value={Number(draft.heightCm)}
                      min={140}
                      max={210}
                      step={1}
                      unit="cm"
                      onChange={(value) => update("heightCm", String(value))}
                    />
                  </div>
                </StepShell>
              )}

              {step === 5 && (
                <StepShell
                  eyebrow="Peso"
                  title={
                    <>
                      Qual é o seu
                      <br />
                      <em className="text-lime">peso hoje?</em>
                    </>
                  }
                  hint="Pode ajustar depois. O importante é começar de algum lugar."
                >
                  <div className="mt-8">
                    <MetricPicker
                      value={Number(draft.weightKg)}
                      min={40}
                      max={180}
                      step={0.5}
                      unit="kg"
                      decimals={1}
                      onChange={(value) => update("weightKg", String(value))}
                    />
                  </div>
                </StepShell>
              )}

              {step === 6 && (
                <StepShell
                  eyebrow="Rotina"
                  title={
                    <>
                      Quanto você se move
                      <br />
                      <em className="text-lime">fora do treino?</em>
                    </>
                  }
                  hint="Sua rotina diária muda o gasto calórico — e o plano precisa saber."
                >
                  <div className="mt-7 grid gap-2.5">
                    {ACTIVITY_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => choose("activity", option.id)}
                        aria-pressed={draft.activity === option.id}
                        className={cn(
                          "flex items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-200",
                          draft.activity === option.id
                            ? "border-lime bg-lime/[0.08]"
                            : "border-white/10 bg-white/[0.035] hover:border-white/25 hover:bg-white/[0.06]",
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-9 shrink-0 place-items-center rounded-full border text-[11px] font-semibold",
                            draft.activity === option.id
                              ? "border-lime/30 bg-lime text-lime-ink"
                              : "border-white/10 bg-white/[0.05] text-cream/45",
                          )}
                        >
                          {option.label.slice(0, 1)}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[14px] font-semibold">
                            {option.label}
                          </span>
                          <span className="mt-0.5 block text-[12px] leading-relaxed text-cream/40">
                            {option.body}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </StepShell>
              )}

              {step === 7 && (
                <StepShell
                  eyebrow="Experiência"
                  title={
                    <>
                      Qual a sua relação
                      <br />
                      <em className="text-lime">com o treino?</em>
                    </>
                  }
                  hint="Não existe resposta errada. O plano começa no seu nível."
                >
                  <div className="mt-7 grid gap-2.5">
                    {LEVELS.map((level) => (
                      <button
                        key={level.id}
                        type="button"
                        onClick={() => choose("level", level.id)}
                        aria-pressed={draft.level === level.id}
                        className={cn(
                          "flex items-center justify-between gap-4 rounded-2xl border p-5 text-left transition-all duration-200",
                          draft.level === level.id
                            ? "border-lime bg-lime/[0.08]"
                            : "border-white/10 bg-white/[0.035] hover:border-white/25 hover:bg-white/[0.06]",
                        )}
                      >
                        <div>
                          <p className="text-[15px] font-semibold tracking-[-0.02em]">
                            {level.label}
                          </p>
                          <p className="mt-0.5 text-[12.5px] text-cream/40">
                            {level.body}
                          </p>
                        </div>
                        <SelectionMark selected={draft.level === level.id} />
                      </button>
                    ))}
                  </div>
                </StepShell>
              )}

              {step === 8 && (
                <StepShell
                  eyebrow="Frequência"
                  title={
                    <>
                      Quantos dias por semana
                      <br />
                      <em className="text-lime">cabem na sua vida?</em>
                    </>
                  }
                  hint="Escolha o que você realmente consegue cumprir. O plano se adapta."
                >
                  <div className="mt-8 grid grid-cols-5 gap-2">
                    {[2, 3, 4, 5, 6].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => choose("daysPerWeek", days)}
                        aria-pressed={draft.daysPerWeek === days}
                        className={cn(
                          "flex flex-col items-center justify-center rounded-2xl border py-4 transition-all duration-200",
                          draft.daysPerWeek === days
                            ? "border-lime bg-lime text-lime-ink"
                            : "border-white/10 bg-white/[0.035] text-cream hover:border-white/25",
                        )}
                      >
                        <span className="font-display text-[34px] leading-none">
                          {days}
                        </span>
                        <span
                          className={cn(
                            "mt-1 text-[9px] font-semibold uppercase tracking-[0.12em]",
                            draft.daysPerWeek === days
                              ? "text-lime-ink/60"
                              : "text-cream/35",
                          )}
                        >
                          dias
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-4 text-center text-[11px] text-cream/30">
                    Recomendamos 3 dias para começar com consistência.
                  </p>
                </StepShell>
              )}

              {step === 9 && (
                <StepShell
                  eyebrow="Duração"
                  title={
                    <>
                      Quanto tempo por
                      <br />
                      <em className="text-lime">sessão de treino?</em>
                    </>
                  }
                  hint="O plano ajusta o número de exercícios e o descanso ao seu tempo."
                >
                  <div className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {[
                      { value: 20, label: "Express" },
                      { value: 30, label: "Enxuto" },
                      { value: 45, label: "Equilibrado" },
                      { value: 60, label: "Completo" },
                      { value: 75, label: "Intenso" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => choose("sessionMinutes", option.value)}
                        aria-pressed={draft.sessionMinutes === option.value}
                        className={cn(
                          "flex flex-col items-start rounded-2xl border p-4 text-left transition-all duration-200",
                          draft.sessionMinutes === option.value
                            ? "border-lime bg-lime text-lime-ink"
                            : "border-white/10 bg-white/[0.035] hover:border-white/25",
                        )}
                      >
                        <span className="font-display text-[32px] leading-none">
                          {option.value}
                          <span className="ml-1 font-body text-[10px] font-semibold uppercase tracking-[0.1em] opacity-50">
                            min
                          </span>
                        </span>
                        <span
                          className={cn(
                            "mt-1.5 text-[10px] font-medium uppercase tracking-[0.12em]",
                            draft.sessionMinutes === option.value
                              ? "text-lime-ink/60"
                              : "text-cream/35",
                          )}
                        >
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </StepShell>
              )}

              {step === 10 && (
                <StepShell
                  eyebrow="Equipamento"
                  title={
                    <>
                      Com o que você
                      <br />
                      <em className="text-lime">pode treinar?</em>
                    </>
                  }
                  hint="Marque tudo o que tiver. Seu plano usa apenas o que existe na sua realidade."
                >
                  <div className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {EQUIPMENT_OPTIONS.map((option) => {
                      const selected = draft.equipment.includes(option.id);
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => toggleEquipment(option.id)}
                          aria-pressed={selected}
                          className={cn(
                            "flex flex-col items-start rounded-2xl border p-3.5 text-left transition-all duration-200",
                            selected
                              ? "border-lime bg-lime/[0.08]"
                              : "border-white/10 bg-white/[0.035] hover:border-white/25 hover:bg-white/[0.06]",
                          )}
                        >
                          <span className="flex w-full items-start justify-between gap-2">
                            <span className="text-[13px] font-semibold">
                              {option.label}
                            </span>
                            <span
                              className={cn(
                                "grid size-4 shrink-0 place-items-center rounded-full border",
                                selected
                                  ? "border-lime bg-lime text-lime-ink"
                                  : "border-white/20",
                              )}
                            >
                              {selected && (
                                <Check className="size-2.5" strokeWidth={3} />
                              )}
                            </span>
                          </span>
                          <span className="mt-0.5 text-[10.5px] text-cream/35">
                            {option.body}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </StepShell>
              )}

              {step === 11 && (
                <StepShell
                  eyebrow="Prioridades"
                  title={
                    <>
                      O que você quer
                      <br />
                      <em className="text-lime">priorizar?</em>
                    </>
                  }
                  hint="Opcional. Usamos para equilibrar o volume entre os grupos musculares."
                >
                  <div className="mt-7 flex flex-wrap gap-2">
                    {FOCUS_OPTIONS.map((option) => {
                      const selected = draft.focusAreas.includes(option.id);
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => toggleFocus(option.id)}
                          aria-pressed={selected}
                          className={cn(
                            "rounded-full border px-4 py-2.5 text-[12.5px] font-medium transition-all duration-200",
                            selected
                              ? "border-lime bg-lime text-lime-ink"
                              : "border-white/12 bg-white/[0.035] text-cream/65 hover:border-white/30 hover:text-cream",
                          )}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-8 flex items-start justify-between gap-5 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                    <div>
                      <p className="text-[13.5px] font-semibold">
                        Prefiro treino de baixo impacto
                      </p>
                      <p className="mt-1 max-w-sm text-[12px] leading-relaxed text-cream/40">
                        Prioriza movimentos sem impacto nas articulações — ideal
                        para joelhos, coluna ou retorno gradual.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => update("lowImpact", !draft.lowImpact)}
                      aria-pressed={draft.lowImpact}
                      aria-label="Alternar treino de baixo impacto"
                      className={cn(
                        "relative mt-0.5 h-7 w-12 shrink-0 rounded-full border transition-colors duration-200",
                        draft.lowImpact
                          ? "border-lime bg-lime"
                          : "border-white/15 bg-white/10",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-1/2 size-5 -translate-y-1/2 rounded-full transition-all duration-200",
                          draft.lowImpact
                            ? "left-[22px] bg-lime-ink"
                            : "left-1 bg-cream/70",
                        )}
                      />
                    </button>
                  </div>
                </StepShell>
              )}
            </div>
          </main>

          <footer className="relative z-10 px-5 pb-6 pt-2 sm:px-8 lg:px-12 xl:px-20">
            <div className="mx-auto flex w-full max-w-[570px] items-center justify-between gap-3">
              {step > 0 && (
                <Button
                  variant="ghost"
                  onClick={back}
                  disabled={pending}
                  className="text-cream/55 hover:bg-white/10 hover:text-cream"
                >
                  <ArrowLeft className="size-4" />
                  Voltar
                </Button>
              )}

              {step === 0 ? (
                <div className="flex flex-1 items-center justify-end gap-3">
                  <Button
                    asChild
                    variant="ghost"
                    className="text-cream/55 hover:bg-white/10 hover:text-cream"
                  >
                    <Link href="/entrar">Já tenho conta</Link>
                  </Button>
                  <Button
                    variant="brand"
                    size="lg"
                    onClick={() => goTo(1)}
                    className="px-7"
                  >
                    Começar
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="brand"
                  size="lg"
                  onClick={() => goTo(step + 1)}
                  disabled={!canContinue || pending}
                  loading={saving}
                  className="min-w-[150px]"
                >
                  Continuar
                  <ArrowRight className="size-4" />
                </Button>
              )}
            </div>
          </footer>
        </div>

        <MediaPanel step={step} />
      </div>
    </div>
  );

  function toggleEquipment(value: string) {
    setDraft((prev) => {
      let equipment: string[];
      if (value === "none") {
        equipment = prev.equipment.includes("none") ? [] : ["none"];
      } else {
        const withoutNone = prev.equipment.filter((item) => item !== "none");
        equipment = withoutNone.includes(value)
          ? withoutNone.filter((item) => item !== value)
          : [...withoutNone, value];
      }
      return { ...prev, equipment };
    });
    setPreview(null);
  }

  function toggleFocus(value: string) {
    setDraft((prev) => {
      const focusAreas = prev.focusAreas.includes(value)
        ? prev.focusAreas.filter((item) => item !== value)
        : [...prev.focusAreas, value];
      return { ...prev, focusAreas };
    });
    setPreview(null);
  }
}

/* ───────────────────────────── Blocos de UI ───────────────────────────── */

function WelcomeStep({ firstName }: { firstName: string }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-3 py-1.5 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-cream/65">
          <Sparkles className="size-3 text-lime" />
          Bem-vindo à Forma
        </span>
      </div>

      <h1 className="display-hero mt-7 text-[clamp(3rem,6.8vw,5rem)] text-cream">
        Vamos desenhar
        <br />
        <em className="text-lime">o seu plano.</em>
      </h1>

      <p className="mt-6 max-w-md text-[15px] leading-relaxed text-cream/55">
        Olá, {firstName}. Em 3 minutos e 11 perguntas, você sai daqui com um
        treino que considera seu corpo, seu tempo e a sua rotina.
      </p>

      <div className="mt-8 grid grid-cols-3 gap-2 border-y border-white/10 py-5">
        {[
          { value: "11", label: "perguntas" },
          { value: "3", label: "minutos" },
          { value: "100%", label: "personalizado" },
        ].map((item) => (
          <div key={item.label}>
            <p className="font-display text-[32px] leading-none text-cream">
              {item.value}
            </p>
            <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-cream/30">
              {item.label}
            </p>
          </div>
        ))}
      </div>

      <ul className="mt-6 space-y-2.5">
        {[
          "Plano de treino com divisão, séries e descanso",
          "Metas calóricas e de proteína calculadas",
          "Fichas editáveis e biblioteca com execução explicada",
        ].map((item) => (
          <li
            key={item}
            className="flex items-start gap-2.5 text-[12.5px] text-cream/50"
          >
            <Check className="mt-0.5 size-3.5 shrink-0 text-lime" />
            {item}
          </li>
        ))}
      </ul>

      <p className="mt-7 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-cream/25">
        <ShieldCheck className="size-3.5" />
        Seus dados ficam privados
      </p>
    </div>
  );
}

function StepShell({
  eyebrow,
  title,
  hint,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-lime">
        {eyebrow}
      </p>
      <h1 className="mt-4 font-display text-[clamp(2.2rem,4.6vw,3.5rem)] leading-[0.98] text-cream">
        {title}
      </h1>
      <p className="mt-3 max-w-md text-[13px] leading-relaxed text-cream/40">
        {hint}
      </p>
      {children}
    </div>
  );
}

function ChoiceCard({
  selected,
  onClick,
  icon: Icon,
  title,
  body,
  compact = false,
}: {
  selected: boolean;
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  body: string;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "group flex items-start gap-3.5 rounded-2xl border text-left transition-all duration-200",
        compact ? "p-3.5" : "p-4",
        selected
          ? "border-lime bg-lime/[0.08]"
          : "border-white/10 bg-white/[0.035] hover:border-white/25 hover:bg-white/[0.06]",
      )}
    >
      {Icon && (
        <span
          className={cn(
            "mt-0.5 grid size-9 shrink-0 place-items-center rounded-full border transition-colors",
            selected
              ? "border-lime/30 bg-lime text-lime-ink"
              : "border-white/10 bg-white/[0.05] text-cream/45",
          )}
        >
          <Icon className="size-4" strokeWidth={1.8} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold tracking-[-0.01em]">
          {title}
        </span>
        <span className="mt-0.5 block text-[11.5px] leading-relaxed text-cream/40">
          {body}
        </span>
      </span>
      <SelectionMark selected={selected} />
    </button>
  );
}

function SelectionMark({ selected }: { selected: boolean }) {
  return (
    <span
      className={cn(
        "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border transition-colors",
        selected ? "border-lime bg-lime text-lime-ink" : "border-white/20",
      )}
    >
      {selected && <Check className="size-3" strokeWidth={3} />}
    </span>
  );
}

function MetricPicker({
  value,
  min,
  max,
  step,
  unit,
  decimals = 0,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  decimals?: number;
  onChange: (value: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const clamp = (next: number) =>
    Math.min(max, Math.max(min, Math.round(next / step) * step));

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-end gap-2">
          <span className="font-display text-[clamp(4.5rem,10vw,6.4rem)] leading-[0.8] tabular text-cream">
            {formatValue(value, decimals)}
          </span>
          <span className="pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/35">
            {unit}
          </span>
        </div>

        <div className="flex gap-1.5 pb-1">
          <button
            type="button"
            onClick={() => onChange(clamp(value - step))}
            aria-label={`Diminuir ${unit}`}
            className="grid size-10 place-items-center rounded-full border border-white/12 bg-white/[0.04] text-cream/60 transition-colors hover:border-white/30 hover:text-cream"
          >
            <Minus className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onChange(clamp(value + step))}
            aria-label={`Aumentar ${unit}`}
            className="grid size-10 place-items-center rounded-full border border-white/12 bg-white/[0.04] text-cream/60 transition-colors hover:border-white/30 hover:text-cream"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      <div className="relative mt-9 h-9">
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/12" />
        <div
          className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-lime"
          style={{ width: `${pct}%` }}
        />
        <div
          className="pointer-events-none absolute top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-ink bg-lime shadow-[0_0_0_1px_rgba(216,246,90,0.5)]"
          style={{ left: `${pct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-label={`Selecionar ${unit}`}
          onChange={(event) => onChange(Number(event.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>

      <div className="flex justify-between text-[9px] font-semibold uppercase tracking-[0.16em] text-cream/25">
        <span>
          {min} {unit}
        </span>
        <span>
          {max} {unit}
        </span>
      </div>
    </div>
  );
}

function MediaPanel({ step }: { step: number }) {
  const media = STEP_MEDIA[Math.min(step, STEP_MEDIA.length - 1)];

  return (
    <aside className="relative hidden overflow-hidden bg-ink-2 lg:block">
      <Image
        key={media.image}
        src={media.image}
        alt={media.alt}
        fill
        sizes="45vw"
        className="animate-fade object-cover opacity-85 photo-warm"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/25 to-ink/45" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/25 to-transparent" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 50% at 60% 20%, rgba(216,246,90,0.08), transparent 65%)",
        }}
      />

      <div className="relative flex h-full flex-col justify-between p-10 text-cream xl:p-14">
        <div className="flex items-start justify-between">
          <span className="rounded-full border border-white/20 bg-ink/30 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-cream/60 backdrop-blur">
            Onboarding · Forma
          </span>
          <span className="font-display text-[40px] leading-none text-cream/25">
            {String(Math.max(step, 1)).padStart(2, "0")}
          </span>
        </div>

        <div key={step} className="animate-rise max-w-md">
          <p className="eyebrow text-lime">{media.kicker}</p>
          <blockquote className="mt-4 font-display text-[clamp(2rem,3.1vw,3rem)] leading-[1.02] tracking-[-0.02em]">
            {media.quote}
          </blockquote>
          <p className="mt-4 max-w-xs text-[12px] leading-relaxed text-cream/65">
            {media.caption}
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 pt-5">
          <div className="flex gap-1.5">
            {STEP_MEDIA.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1 rounded-full transition-all duration-500",
                  i === step ? "w-6 bg-lime" : "w-1.5 bg-white/20",
                )}
              />
            ))}
          </div>
          <span className="text-[9px] font-medium uppercase tracking-[0.16em] text-cream/25">
            Plano pessoal · 2026
          </span>
        </div>
      </div>
    </aside>
  );
}

/* ───────────────────────────── Construção e resultado ───────────────────────────── */

type Metrics = {
  bmr: number;
  tdee: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  bmi: ReturnType<typeof calculateBmi>;
};

const BUILD_MESSAGES = [
  "Lendo seu perfil e objetivo",
  "Selecionando exercícios compatíveis",
  "Equilibrando volume e recuperação",
  "Montando sua primeira semana",
];

function ResultScreen({
  firstName,
  draft,
  preview,
  metrics,
  buildStage,
  loading,
  error,
  saving,
  onRetry,
  onFinish,
  onBack,
}: {
  firstName: string;
  draft: Draft;
  preview: PlanPreview | null;
  metrics: Metrics;
  buildStage: number;
  loading: boolean;
  error: boolean;
  saving: boolean;
  onRetry: () => void;
  onFinish: () => void;
  onBack: () => void;
}) {
  const done = buildStage >= 3;
  const ready = done && preview !== null;

  return (
    <div className="relative min-h-dvh bg-ink text-cream">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 45% at 50% 0%, rgba(216,246,90,0.1), transparent 70%)",
        }}
      />

      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Logo tone="light" href="/" />
        <button
          type="button"
          onClick={onBack}
          className="text-[11px] font-medium uppercase tracking-[0.14em] text-cream/40 transition-colors hover:text-cream"
        >
          Ajustar respostas
        </button>
      </header>

      {!ready ? (
        <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-92px)] max-w-lg flex-col items-center justify-center px-5 pb-16 text-center">
          <div className="relative grid size-24 place-items-center">
            <div className="absolute inset-0 rounded-full border border-white/10" />
            <div className="absolute inset-0 animate-spin-slow rounded-full border-2 border-transparent border-t-lime" />
            <span className="grid size-16 place-items-center rounded-full border border-lime/20 bg-lime/10">
              <Dumbbell className="size-6 text-lime" />
            </span>
          </div>

          <p className="eyebrow mt-8 text-lime">Montando seu plano</p>
          <h1 className="display-section mt-3 text-[38px]">
            Um instante,
            <br />
            <em className="text-lime">{firstName}.</em>
          </h1>

          <div className="mt-8 w-full max-w-sm space-y-3 text-left">
            {BUILD_MESSAGES.map((message, i) => {
              const complete = done || i < buildStage || (ready && i <= buildStage);
              const current = !done && i === buildStage;
              return (
                <div
                  key={message}
                  className={cn(
                    "flex items-center gap-3 rounded-full border px-4 py-2.5 transition-all duration-500",
                    complete
                      ? "border-lime/25 bg-lime/[0.07] text-cream"
                      : current
                        ? "border-white/15 bg-white/[0.05] text-cream/70"
                        : "border-white/[0.06] text-cream/25",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-5 shrink-0 place-items-center rounded-full border",
                      complete
                        ? "border-lime bg-lime text-lime-ink"
                        : "border-white/15",
                    )}
                  >
                    {complete ? (
                      <Check className="size-3" strokeWidth={3} />
                    ) : current ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : null}
                  </span>
                  <span className="text-[12px] font-medium">{message}</span>
                </div>
              );
            })}
          </div>

          {error && (
            <div className="mt-8 w-full max-w-sm rounded-2xl border border-danger/30 bg-danger/10 p-4 text-center">
              <p className="text-[12.5px] text-cream/70">
                Não conseguimos montar o plano agora.
              </p>
              <Button
                variant="brand"
                size="sm"
                onClick={onRetry}
                className="mt-3"
              >
                Tentar novamente
              </Button>
            </div>
          )}

          {loading && !error && (
            <p className="mt-6 text-[10px] uppercase tracking-[0.16em] text-cream/25">
              Calculando com seus dados
            </p>
          )}
        </div>
      ) : (
        <div className="relative z-10 mx-auto max-w-[1120px] px-5 pb-16 pt-6 sm:px-8 lg:px-12">
          <div className="grid gap-10 lg:grid-cols-[1fr_400px] lg:gap-12">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-lime/25 bg-lime/[0.08] px-3 py-1.5 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-lime">
                  <Sparkles className="size-3" />
                  Plano pronto
                </span>
                <span className="text-[9.5px] font-medium uppercase tracking-[0.16em] text-cream/30">
                  {preview.daysPerWeek}x por semana
                </span>
              </div>

              <h1 className="display-hero mt-6 text-[clamp(2.8rem,5.8vw,4.8rem)]">
                Feito para {firstName},
                <br />
                <em className="text-lime">pronto para começar.</em>
              </h1>

              <p className="mt-5 max-w-lg text-[14.5px] leading-relaxed text-cream/50">
                {preview.description}
              </p>

              <div className="mt-7 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-[11px] text-cream/60">
                  <CalendarDays className="size-3.5 text-lime" />
                  {preview.daysPerWeek} treinos por semana
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-[11px] text-cream/60">
                  <Timer className="size-3.5 text-lime" />~{preview.estMinutes} min
                  por sessão
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-[11px] text-cream/60">
                  <Dumbbell className="size-3.5 text-lime" />
                  {preview.items.length} exercícios
                </span>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {[
                  {
                    icon: CalendarDays,
                    label: "Treinos",
                    value: `${preview.daysPerWeek}x`,
                    unit: "/ semana",
                  },
                  {
                    icon: Timer,
                    label: "Sessão",
                    value: `${draft.sessionMinutes}`,
                    unit: "min",
                  },
                  {
                    icon: Flame,
                    label: "Meta",
                    value: formatValue(metrics.calories),
                    unit: "kcal",
                  },
                  {
                    icon: Scale,
                    label: "IMC",
                    value: formatValue(metrics.bmi.value, 1),
                    unit: metrics.bmi.label,
                  },
                ].map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-2xl border border-white/10 bg-white/[0.035] p-3.5"
                  >
                    <metric.icon className="size-3.5 text-lime" />
                    <p className="mt-3 text-[9px] font-semibold uppercase tracking-[0.14em] text-cream/30">
                      {metric.label}
                    </p>
                    <p className="mt-0.5 font-display text-[26px] leading-none text-cream">
                      {metric.value}
                      <span className="ml-1 font-body text-[9px] font-medium text-cream/35">
                        {metric.unit}
                      </span>
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cream/35">
                    Sua primeira semana
                  </p>
                  <p className="text-[10px] text-cream/30">3 dias de descanso</p>
                </div>
                <div className="mt-3 grid grid-cols-7 gap-1.5">
                  {["seg", "ter", "qua", "qui", "sex", "sáb", "dom"].map(
                    (day, index) => {
                      const active = trainingDays(
                        preview.daysPerWeek,
                      ).includes(index);
                      return (
                        <div
                          key={day}
                          className={cn(
                            "flex flex-col items-center gap-1.5 rounded-xl border py-2.5",
                            active
                              ? "border-lime/30 bg-lime/[0.1] text-lime"
                              : "border-white/[0.06] text-cream/25",
                          )}
                        >
                          <span className="text-[9px] font-medium uppercase tracking-[0.06em]">
                            {day}
                          </span>
                          <span
                            className={cn(
                              "size-1.5 rounded-full",
                              active ? "bg-lime" : "bg-white/15",
                            )}
                          />
                        </div>
                      );
                    },
                  )}
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  variant="brand"
                  size="lg"
                  onClick={onFinish}
                  loading={saving}
                  className="px-8"
                >
                  Começar meu plano
                  <ArrowRight className="size-4" />
                </Button>
                <p className="max-w-xs text-[10.5px] leading-relaxed text-cream/30">
                  Você pode editar a ficha, trocar exercícios e ajustar metas
                  depois. Nada é definitivo.
                </p>
              </div>
            </div>

            <aside className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5">
              <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-lime">
                    Sua primeira sessão
                  </p>
                  <p className="mt-1 text-[15px] font-semibold">
                    {preview.name}
                  </p>
                </div>
                <span className="rounded-full border border-white/12 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-cream/40">
                  {preview.split}
                </span>
              </div>

              <ul className="mt-2 divide-y divide-white/[0.07]">
                {preview.items.slice(0, 5).map((item, index) => (
                  <li
                    key={item.key}
                    className="flex items-start gap-3 py-3.5"
                  >
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-white/10 text-[9px] font-semibold text-cream/40">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-medium text-cream/85">
                        {item.exerciseName}
                      </p>
                      <p className="mt-0.5 text-[10.5px] text-cream/35">
                        {item.sets} × {item.reps} · {item.restSeconds}s descanso
                        {item.rpe ? ` · RPE ${item.rpe}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              {preview.items.length > 5 && (
                <p className="border-t border-white/10 pt-3 text-[10px] uppercase tracking-[0.12em] text-cream/25">
                  + {preview.items.length - 5} exercícios nesta ficha
                </p>
              )}

              <div className="mt-4 rounded-2xl border border-lime/20 bg-lime/[0.06] p-3.5">
                <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-lime">
                  <Flame className="size-3" />
                  Meta nutricional
                </p>
                <p className="mt-1.5 font-display text-[26px] leading-none">
                  {formatValue(metrics.calories)}{" "}
                  <span className="font-body text-[10px] text-cream/40">
                    kcal / dia
                  </span>
                </p>
                <p className="mt-1 text-[10px] text-cream/35">
                  {metrics.protein} g proteína · {metrics.carbs} g carboidrato ·{" "}
                  {metrics.fat} g gordura
                </p>
              </div>
            </aside>
          </div>

          <p className="mt-10 border-t border-white/10 pt-5 text-[10px] leading-relaxed text-cream/25">
            Ferramenta de bem-estar geral. Não substitui avaliação médica,
            fisioterápica ou nutricional. Se você tem alguma condição de saúde,
            converse com um profissional antes de começar.
          </p>
        </div>
      )}
    </div>
  );
}
