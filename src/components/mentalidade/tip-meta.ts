/**
 * Metadados das dicas de mentalidade (categoria e rótulos).
 *
 * Módulo neutro (sem "use client") para poder ser importado tanto por
 * páginas de servidor quanto por componentes interativos.
 */

export const TIP_CATEGORY_LABELS: Record<string, string> = {
  mindset: "Mentalidade",
  consistencia: "Consistência",
  recuperacao: "Recuperação",
  nutricao: "Nutrição",
  corpo: "Corpo",
  autoconfianca: "Autoconfiança",
};

export function tipCategoryLabel(category: string): string {
  return TIP_CATEGORY_LABELS[category] ?? category;
}
