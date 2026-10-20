import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { CalculadorasView } from "@/components/calculadoras/calculadoras-view";

export const metadata: Metadata = {
  title: "Calculadoras",
};

export default function CalculadorasPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Números com contexto"
        title="Calculadoras"
        description="Ferramentas para entender os números do treino e da alimentação, com a conta à mostra."
      />

      <CalculadorasView />

      <p className="pt-2 text-center text-xs text-muted-foreground">
        As estimativas servem para orientar decisões, não para substituir avaliação de um
        profissional de saúde.
      </p>
    </div>
  );
}
