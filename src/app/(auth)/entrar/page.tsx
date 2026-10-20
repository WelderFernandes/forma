import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/server/auth-helpers";

export const metadata: Metadata = {
  title: "Entrar",
};

export default async function SignInPage() {
  const user = await getCurrentUser();
  if (user) redirect("/painel");

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow text-muted">Bem-vindo de volta</p>
        <h1 className="display-section mt-3 text-[42px] leading-[0.98]">
          Continue de onde
          <br />
          <em className="text-brand">você parou.</em>
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-muted">
          Seu plano, seu histórico e seu próximo treino estão esperando.
        </p>
      </div>

      <Suspense fallback={null}>
        <AuthForm mode="signin" />
      </Suspense>
    </div>
  );
}
