"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/primitives";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { saveBodyMetric } from "@/server/actions/nutrition";

/* ───────────────────────────── Tipos ───────────────────────────── */

/** Tipo do payload aceito pela server action de medidas corporais. */
type BodyMetricInput = Parameters<typeof saveBodyMetric>[0];

type FieldKey =
  | "weightKg"
  | "bodyFatPct"
  | "chestCm"
  | "waistCm"
  | "hipCm"
  | "armCm"
  | "thighCm";

type FieldDef = {
  name: FieldKey;
  label: string;
  unit: string;
  step: string;
  min: number;
  max: number;
  placeholder: string;
};

/* ───────────────────────────── Constantes ───────────────────────────── */

/** Campos numéricos do formulário, na ordem em que aparecem no diálogo. */
const FIELDS: FieldDef[] = [
  { name: "weightKg", label: "Peso", unit: "kg", step: "0.1", min: 30, max: 350, placeholder: "78,5" },
  { name: "bodyFatPct", label: "Gordura corporal", unit: "%", step: "0.1", min: 2, max: 70, placeholder: "18,0" },
  { name: "chestCm", label: "Peito", unit: "cm", step: "0.5", min: 40, max: 250, placeholder: "102" },
  { name: "waistCm", label: "Cintura", unit: "cm", step: "0.5", min: 30, max: 250, placeholder: "82" },
  { name: "hipCm", label: "Quadril", unit: "cm", step: "0.5", min: 40, max: 250, placeholder: "98" },
  { name: "armCm", label: "Braço", unit: "cm", step: "0.5", min: 15, max: 90, placeholder: "36" },
  { name: "thighCm", label: "Coxa", unit: "cm", step: "0.5", min: 30, max: 150, placeholder: "58" },
];

/* ───────────────────────────── Helpers ───────────────────────────── */

/** Data de hoje no formato aceito por <input type="date">, em horário local. */
function todayInputValue(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/** Converte o texto do campo em número, aceitando vírgula decimal. */
function parseNumber(raw: string): number | undefined {
  const trimmed = raw.trim().replace(",", ".");
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/* ───────────────────────────── Componente ───────────────────────────── */

export function BodyMetricForm() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [values, setValues] = React.useState<Record<string, string>>({
    date: todayInputValue(),
  });
  const [errors, setErrors] = React.useState<Partial<Record<FieldKey, string>>>({});

  function updateField(field: string, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field as FieldKey]) return prev;
      const next = { ...prev };
      delete next[field as FieldKey];
      return next;
    });
  }

  /** Valida os campos preenchidos antes de chamar a server action. */
  function validate(): boolean {
    const next: Partial<Record<FieldKey, string>> = {};
    for (const field of FIELDS) {
      const raw = values[field.name];
      if (!raw || !raw.trim()) continue;
      const parsed = parseNumber(raw);
      if (parsed === undefined) {
        next[field.name] = "Valor inválido.";
        continue;
      }
      if (parsed < field.min || parsed > field.max) {
        next[field.name] = `Informe entre ${field.min} e ${field.max} ${field.unit}.`;
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) return;

    const payload: BodyMetricInput = {
      date: values.date ? new Date(`${values.date}T12:00:00`) : undefined,
    };

    for (const field of FIELDS) {
      const parsed = parseNumber(values[field.name] ?? "");
      if (parsed !== undefined) payload[field.name] = parsed;
    }

    const notes = values.notes?.trim();
    if (notes) payload.notes = notes;

    setSaving(true);
    try {
      await saveBodyMetric(payload);
      toast.success("Medição registrada. Bons dados!");
      setOpen(false);
      setValues({ date: todayInputValue() });
      setErrors({});
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível salvar a medição.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="brand" size="lg">
          <Plus className="size-4" />
          Registrar medição
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar medição</DialogTitle>
          <DialogDescription>
            Anote peso, percentual de gordura e circunferências. O histórico guarda a
            linha do tempo das suas mudanças.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="metric-date">Data da medição</Label>
            <Input
              id="metric-date"
              type="date"
              value={values.date ?? ""}
              onChange={(event) => updateField("date", event.target.value)}
            />
          </div>

          {FIELDS.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={`metric-${field.name}`}>
                {field.label} ({field.unit})
              </Label>
              <Input
                id={`metric-${field.name}`}
                type="number"
                inputMode="decimal"
                step={field.step}
                min={field.min}
                max={field.max}
                placeholder={field.placeholder}
                value={values[field.name] ?? ""}
                aria-invalid={!!errors[field.name]}
                onChange={(event) => updateField(field.name, event.target.value)}
              />
              {errors[field.name] && (
                <p className="text-xs text-destructive">{errors[field.name]}</p>
              )}
            </div>
          ))}

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="metric-notes">Notas (opcional)</Label>
            <Textarea
              id="metric-notes"
              maxLength={400}
              placeholder="Como você se sentiu, horário da medição, contexto do dia..."
              value={values.notes ?? ""}
              onChange={(event) => updateField("notes", event.target.value)}
            />
          </div>

          <DialogFooter className="sm:col-span-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" variant="brand" loading={saving}>
              Salvar medição
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
