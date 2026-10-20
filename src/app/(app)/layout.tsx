import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/server/auth-helpers";
import { currentStreak } from "@/lib/domain/insights";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");

  const profile = await prisma.userProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile?.onboarded) redirect("/onboarding");

  const sessions = await prisma.workoutSession.findMany({
    where: { userId: user.id, status: "completed" },
    select: { startedAt: true, completedAt: true, status: true },
    orderBy: { startedAt: "desc" },
    take: 200,
  });

  const streak = currentStreak(
    sessions.map((s, i) => ({
      id: String(i),
      name: "",
      startedAt: s.startedAt,
      completedAt: s.completedAt,
      durationSeconds: null,
      status: s.status,
      items: [],
    })),
  );

  return (
    <AppShell
      user={{ name: user.name, email: user.email }}
      streak={streak}
    >
      {children}
    </AppShell>
  );
}
