import type { Metadata } from "next";
import { Database, Info, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Label } from "@/components/ui/primitives";
import { getCurrentUser } from "@/server/auth-helpers";
import { getProfile } from "@/server/queries";
import { ProfileForm } from "@/components/configuracoes/profile-form";
import { SignOutButton } from "@/components/configuracoes/sign-out-button";
import { normalizeTrainingDays } from "@/lib/domain/schedule";
import type { ActivityLevel } from "@/lib/domain/types";

export const metadata: Metadata = {
  title: "Configurações",
};

// Versão do aplicativo — acompanhe o campo "version" do package.json.
const APP_VERSION = "0.1.0";

const SEX_LABELS: Record<string, string> = {
  female: "Feminino",
  male: "Masculino",
  other: "Outro",
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const profile = await getProfile(user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Seu perfil"
        title="Configurações"
        description="Ajuste o perfil que alimenta os treinos, as metas de nutrição e as recomendações."
      />

      <ProfileForm
        name={user.name}
        sexLabel={SEX_LABELS[profile?.sex ?? "other"] ?? "Outro"}
        initial={{
          heightCm: profile?.heightCm ?? null,
          weightKg: profile?.weightKg ?? null,
          goal: profile?.goal ?? null,
          level: profile?.level ?? null,
          activity: (profile?.activity ?? "moderate") as ActivityLevel,
          daysPerWeek: profile?.daysPerWeek ?? 3,
          trainingDays: normalizeTrainingDays(
            profile?.trainingDays,
            profile?.daysPerWeek ?? 3,
          ),
          sessionMinutes: profile?.sessionMinutes ?? 30,
          equipment: profile?.equipment ?? [],
          focusAreas: profile?.focusAreas ?? [],
          lowImpact: profile?.lowImpact ?? false,
          waterTargetMl: profile?.waterTargetMl ?? 2000,
          stepTarget: profile?.stepTarget ?? 8000,
          fastingEnabled: profile?.fastingEnabled ?? false,
          fastingHours: profile?.fastingHours ?? 16,
        }}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Conta */}
        <Card>
          <CardHeader>
            <CardTitle>Conta</CardTitle>
            <CardDescription>Dados de acesso à sua conta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="conta-nome">Nome</Label>
              <Input id="conta-nome" value={user.name} readOnly disabled />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="conta-email">E-mail</Label>
              <Input id="conta-email" value={user.email} readOnly disabled />
              <p className="text-xs text-muted-foreground">
                Para trocar o e-mail ou a senha, fale com o suporte.
              </p>
            </div>
            <div className="flex justify-end">
              <SignOutButton />
            </div>
          </CardContent>
        </Card>

        {/* Dados */}
        <Card>
          <CardHeader>
            <CardTitle>Dados</CardTitle>
            <CardDescription>Onde ficam os seus registros</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-3.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand">
                <Database className="size-4" />
              </span>
              <div className="space-y-1">
                <p className="text-sm font-medium">Tudo fica no servidor</p>
                <p className="text-sm text-muted-foreground">
                  Treinos, refeições, medidas, desafios e dicas lidas são gravados no servidor do
                  Forma, vinculados apenas à sua conta. Nada é compartilhado com terceiros.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-3.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand">
                <ShieldCheck className="size-4" />
              </span>
              <div className="space-y-1">
                <p className="text-sm font-medium">Exclusão de registros</p>
                <p className="text-sm text-muted-foreground">
                  A remoção de dados é feita pela equipe de suporte, para que nada seja apagado
                  por engano. Peça a exclusão da conta pelo e-mail cadastrado.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sobre */}
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle>Sobre</CardTitle>
            <CardDescription>Versão e limites do aplicativo</CardDescription>
          </div>
          <Badge variant="outline">versão {APP_VERSION}</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-3.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand">
              <Info className="size-4" />
            </span>
            <p className="text-sm text-muted-foreground">
              O Forma é uma ferramenta de bem-estar para organizar treinos, alimentação e
              hábitos. As estimativas de calorias, macronutrientes e composição corporal são
              aproximações e{" "}
              <strong className="text-foreground">não substituem avaliação médica</strong> nem
              acompanhamento com profissional de saúde. Em caso de dor, lesão, condição
              específica ou dúvida sobre a sua dieta, procure um médico ou nutricionista.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
