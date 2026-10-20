import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock, Lightbulb } from "lucide-react";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/server/auth-helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarkTipRead } from "@/components/mentalidade/mark-tip-read";
import { tipCategoryLabel } from "@/components/mentalidade/tip-meta";

export const metadata: Metadata = {
  title: "Mentalidade",
};

export default async function MindTipPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  const tip = await prisma.mindTip.findUnique({ where: { slug } });
  if (!tip) notFound();

  // Todas as dicas ordenadas, para sugerir a leitura anterior e a seguinte.
  const allTips = await prisma.mindTip.findMany({
    orderBy: [{ category: "asc" }, { title: "asc" }],
    select: { id: true, slug: true, title: true },
  });
  const index = allTips.findIndex((item) => item.id === tip.id);
  const previous = index > 0 ? allTips[index - 1] : null;
  const next = index >= 0 && index < allTips.length - 1 ? allTips[index + 1] : null;

  const paragraphs = tip.body.split(/\n{2,}/).filter((paragraph) => paragraph.trim().length > 0);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      {/* Registra a leitura automaticamente ao abrir a dica. */}
      <MarkTipRead tipId={tip.id} />

      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/mentalidade">
          <ArrowLeft className="size-4" />
          Todas as dicas
        </Link>
      </Button>

      <Card>
        <CardContent className="space-y-6 p-6 sm:p-8">
          <header className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="brand" className="text-[10px]">
                {tipCategoryLabel(tip.category)}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                <Clock className="size-3" />
                {tip.readTime} min de leitura
              </Badge>
            </div>
            <h1 className="font-display text-[clamp(2rem,4.5vw,3.35rem)] leading-[1.02] tracking-[-0.02em]">
              {tip.title}
            </h1>
          </header>

          <div className="space-y-5 text-[15.5px] leading-[1.8] text-muted">
            {paragraphs.map((paragraph, position) => (
              <p
                key={position}
                className={position === 0 ? "text-[17px] text-foreground" : undefined}
              >
                {paragraph}
              </p>
            ))}
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-brand/25 bg-brand/[0.06] p-4">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand">
              <Lightbulb className="size-4" />
            </span>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand">
                O que levar para casa
              </p>
              <p className="text-sm font-medium text-foreground">{tip.takeaway}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navegação entre dicas */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {previous ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`/mentalidade/${previous.slug}`}>
              <ArrowLeft className="size-4" />
              <span className="truncate">{previous.title}</span>
            </Link>
          </Button>
        ) : (
          <span />
        )}
        {next && (
          <Button asChild variant="outline" size="sm" className="sm:ml-auto">
            <Link href={`/mentalidade/${next.slug}`}>
              <span className="truncate">{next.title}</span>
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
