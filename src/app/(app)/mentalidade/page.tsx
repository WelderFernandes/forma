import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Check, Clock } from "lucide-react";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/server/auth-helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { tipCategoryLabel } from "@/components/mentalidade/tip-meta";

export const metadata: Metadata = {
  title: "Mentalidade",
};

export default async function MentalidadePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [tips, reads] = await Promise.all([
    prisma.mindTip.findMany({ orderBy: [{ category: "asc" }, { title: "asc" }] }),
    prisma.tipRead.findMany({ where: { userId: user.id } }),
  ]);

  const readTipIds = new Set(reads.map((read) => read.tipId));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Hábitos e mente"
        title="Mentalidade"
        description="Textos práticos sobre hábitos, rotina e comportamento — sem achismos."
      />

      {tips.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Nenhuma dica disponível"
          description="As dicas de mentalidade aparecem aqui assim que o banco de dados for populado."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tips.map((tip) => {
            const isRead = readTipIds.has(tip.id);
            return (
              <Card key={tip.id} className="flex flex-col">
                <CardContent className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="brand" className="text-[10px]">
                      {tipCategoryLabel(tip.category)}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      <Clock className="size-3" />
                      {tip.readTime} min
                    </Badge>
                    {isRead && (
                      <Badge variant="success" className="text-[10px]">
                        <Check className="size-3" />
                        Lida
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <h2 className="font-display text-base font-semibold leading-tight tracking-tight">
                      {tip.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">{tip.takeaway}</p>
                  </div>

                  <Button asChild variant="outline" size="sm" className="mt-auto w-full">
                    <Link href={`/mentalidade/${tip.slug}`}>Ler dica</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
