import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding-wizard";
import { getCurrentUser } from "@/server/auth-helpers";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Monte seu plano",
  description:
    "Responda 11 perguntas sobre objetivo, corpo e rotina e receba um plano de treino e metas nutricionais sob medida.",
};

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");

  const profile = await prisma.userProfile.findUnique({
    where: { userId: user.id },
  });
  if (profile?.onboarded) redirect("/painel");

  return <OnboardingWizard name={user.name} />;
}
