"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteTemplate } from "@/server/actions/workouts";

export function TemplateActions({
  templateId,
  editable,
}: {
  templateId: string;
  editable: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  if (!editable) return null;

  async function handleDelete() {
    setLoading(true);
    try {
      await deleteTemplate(templateId);
      toast.success("Ficha excluída");
      router.push("/treinos");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível excluir",
      );
      setLoading(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={loading}>
          Gerenciar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <a href={`/treinos/novo?template=${templateId}`}>
            <Pencil className="size-4" />
            Editar ficha
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={handleDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="size-4" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
