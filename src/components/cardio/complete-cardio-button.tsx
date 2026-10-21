"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { completeCardio } from "@/server/actions/cardio";

export function CompleteCardioButton({
  cardioId,
  compact = false,
  className,
}: {
  cardioId: string;
  compact?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);

  async function handleComplete() {
    if (saving) return;
    setSaving(true);
    try {
      await completeCardio(cardioId);
      toast.success("Cardio concluído. Movimento registrado.");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível concluir o cardio.",
      );
      setSaving(false);
    }
  }

  return (
    <Button
      type="button"
      size={compact ? "icon-sm" : "sm"}
      variant="outline"
      onClick={handleComplete}
      loading={saving}
      aria-label="Concluir cardio"
      title="Concluir cardio"
      className={className}
    >
      {!saving && <Check className="size-3.5" />}
      {!compact && "Concluir"}
    </Button>
  );
}
