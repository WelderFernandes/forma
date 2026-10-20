import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { applyOnboarding, createGeneratedTemplate } from "@/server/onboarding";

const schema = z.object({
  sex: z.enum(["female", "male", "other"]),
  birthDate: z.string().min(4),
  heightCm: z.coerce.number().min(100).max(250),
  weightKg: z.coerce.number().min(30).max(350),
  goal: z.string().min(1),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  equipment: z.array(z.string()).max(12),
  daysPerWeek: z.coerce.number().int().min(2).max(6),
  sessionMinutes: z.coerce.number().int().min(10).max(120),
  focusAreas: z.array(z.string()).max(10),
  lowImpact: z.boolean().default(false),
  activity: z.enum(["sedentary", "light", "moderate", "active", "athlete"]),
});

/**
 * POST /api/onboarding
 *
 * Grava o perfil do usuário e gera a ficha de treino inicial.
 * Usado pela web e disponível para clientes nativos.
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await applyOnboarding(session.user.id, parsed.data);
    const { template, plan, resolved } = await createGeneratedTemplate(
      session.user.id,
    );

    return NextResponse.json({
      ok: true,
      nutrition: result,
      plan: {
        id: template.id,
        name: plan.name,
        split: plan.split,
        daysPerWeek: plan.daysPerWeek,
        estMinutes: plan.estMinutes,
        exerciseCount: resolved.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao gerar o plano" },
      { status: 500 },
    );
  }
}
