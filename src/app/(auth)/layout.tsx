import Image from "next/image";
import { Logo } from "@/components/logo";
import { Sparkles } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-[1fr_0.92fr]">
      <div className="flex flex-col px-5 py-6 sm:px-10 lg:px-14">
        <div className="flex items-center justify-between">
          <Logo />
          <span className="hidden text-[10px] font-medium uppercase tracking-[0.18em] text-muted sm:block">
            Atelier de treino
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-[400px]">{children}</div>
        </div>

        <p className="mx-auto max-w-md text-center text-[11px] leading-relaxed text-muted lg:mx-0 lg:text-left">
          Ferramenta de bem-estar geral. Não substitui avaliação médica nem
          acompanhamento profissional.
        </p>
      </div>

      <div className="relative hidden overflow-hidden bg-ink lg:block">
        <Image
          src="/media/mind.jpg"
          alt="Silhueta de uma prática de mobilidade ao pôr do sol"
          fill
          priority
          sizes="50vw"
          className="object-cover opacity-90 photo-warm"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/35 to-ink/20" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 70% 35%, rgba(216,246,90,0.12), transparent 70%)",
          }}
        />

        <div className="relative flex h-full flex-col justify-between p-10 text-cream xl:p-14">
          <div className="flex justify-end">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-ink/30 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-cream/75 backdrop-blur">
              <Sparkles className="size-3 text-lime" />
              Plano pessoal em 3 minutos
            </span>
          </div>

          <div className="max-w-md">
            <p className="eyebrow text-lime">A sua forma, todos os dias</p>
            <blockquote className="display-section mt-5 text-[clamp(2.3rem,3.4vw,3.4rem)]">
              “O melhor plano é aquele que{" "}
              <em className="text-lime">você consegue seguir.</em>”
            </blockquote>
            <p className="mt-5 max-w-sm text-[13.5px] leading-relaxed text-cream/55">
              Treino, nutrição e mente no mesmo lugar. Sem extremos, sem culpa,
              sem promessas que não caibam na sua rotina.
            </p>

            <dl className="mt-9 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
              <div>
                <dt className="text-[9px] font-medium uppercase tracking-[0.16em] text-cream/35">
                  Exercícios
                </dt>
                <dd className="mt-1.5 font-display text-[28px] leading-none">
                  68+
                </dd>
              </div>
              <div>
                <dt className="text-[9px] font-medium uppercase tracking-[0.16em] text-cream/35">
                  Fichas
                </dt>
                <dd className="mt-1.5 font-display text-[28px] leading-none">
                  10
                </dd>
              </div>
              <div>
                <dt className="text-[9px] font-medium uppercase tracking-[0.16em] text-cream/35">
                  Receitas
                </dt>
                <dd className="mt-1.5 font-display text-[28px] leading-none">
                  14
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex items-center justify-between text-[9px] font-medium uppercase tracking-[0.18em] text-cream/25">
            <span>Forma · Est. 2026</span>
            <span>São Paulo · BR</span>
          </div>
        </div>
      </div>
    </div>
  );
}
