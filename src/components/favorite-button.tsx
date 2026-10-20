"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleFavorite } from "@/server/actions/workouts";
import { cn } from "@/lib/utils";

/**
 * Botão de favorito (estrela) de um exercício.
 *
 * Precisa ser client component porque alterna o favorito via server action
 * e reflete o novo estado na tela sem recarregar a página.
 */
export function FavoriteButton({
  exerciseId,
  initialFavorite,
  showLabel = true,
  className,
}: {
  exerciseId: string;
  initialFavorite: boolean;
  showLabel?: boolean;
  className?: string;
}) {
  const [favorite, setFavorite] = React.useState(initialFavorite);
  const [saving, setSaving] = React.useState(false);

  async function handleToggle() {
    if (saving) return;
    setSaving(true);
    try {
      const result = await toggleFavorite(exerciseId);
      setFavorite(result.favorite);
      toast.success(
        result.favorite
          ? "Exercício salvo nos favoritos"
          : "Exercício removido dos favoritos",
      );
    } catch {
      toast.error("Não foi possível atualizar os favoritos. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Button
      type="button"
      variant={favorite ? "brand" : "outline"}
      size="lg"
      onClick={handleToggle}
      loading={saving}
      aria-pressed={favorite}
      className={cn(className)}
    >
      {!saving && <Star className={cn("size-4", favorite && "fill-current")} />}
      {showLabel ? (favorite ? "Nos favoritos" : "Favoritar") : null}
    </Button>
  );
}
