"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startSession } from "@/server/actions/workouts";

export function StartWorkoutButton({
  templateId,
  label = "Iniciar",
  size = "sm",
  variant = "brand",
  className,
}: {
  templateId: string;
  label?: string;
  size?: "sm" | "default" | "lg";
  variant?: "brand" | "outline" | "ghost" | "default";
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      const result = await startSession(templateId);
      if (result.sessionId) {
        router.push(`/treino/${result.sessionId}`);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível iniciar o treino",
      );
      setLoading(false);
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      loading={loading}
      className={className}
    >
      {!loading && <Play className="size-3.5" />}
      {label}
    </Button>
  );
}
