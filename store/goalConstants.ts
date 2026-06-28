import type { GoalCategory } from "./goalTypes";

/**
 * Metadata visual por categoría.
 * La usa el store para crear metas con color/icono por defecto.
 */
export const CATEGORY_META: Record<
  GoalCategory,
  { icon: string; color: string; label?: string }
> = {
  Fitness: { icon: "activity", color: "#ef4444", label: "Fitness" },
  Estudio: { icon: "book-open", color: "#06b6d4", label: "Estudio" },
  Carrera: { icon: "briefcase", color: "#f59e0b", label: "Carrera" },
  Salud: { icon: "heart", color: "#10b981", label: "Salud" },
  Finanzas: { icon: "dollar-sign", color: "#8b5cf6", label: "Finanzas" },
  Otro: { icon: "target", color: "#6b7280", label: "Otro" },
};
