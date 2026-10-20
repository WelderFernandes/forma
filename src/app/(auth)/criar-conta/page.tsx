import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/server/auth-helpers";

export const metadata: Metadata = {
  title: "Criar conta",
};

export default async function SignUpPage() {
  const user = await getCurrentUser();
  if (user) redirect("/painel");

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow text-muted">Comece hoje · é grátis</p>
        <h1 className="display-section mt-3 text-[42px] leading-[0.98]">
          Sua forma,
          <br />
          <em className="text-brand">no seu tempo.</em>
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-muted">
          Crie sua conta e responda 11 perguntas. Seu plano fica pronto em cerca
          de 3 minutos.
        </p>
      </div>

      <Suspense fallback={null}>
        <AuthForm mode="signup" />
      </Suspense>
    </div>
  );
}
