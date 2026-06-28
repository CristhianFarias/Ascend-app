import type { Goal } from "./goalTypes";

/**
 * Calcula estadísticas agregadas para las pantallas Inicio/Progreso/Perfil.
 * No modifica estado; solo resume las metas actuales.
 */
export function buildStats(
  goals: Goal[],
  globalStreak: number,
  bestStreak: number,
) {
  const totalGoals = goals.length;
  const activeGoals = goals.filter(
    (g) => g.status === "active" && g.steps.length > 0,
  ).length;
  const totalSteps = goals.reduce((acc, g) => acc + g.steps.length, 0);
  const completedSteps = goals.reduce(
    (acc, g) => acc + g.steps.filter((s) => s.completed).length,
    0,
  );
  const totalMinutes = goals.reduce(
    (acc, g) => acc + g.steps.reduce((b, s) => b + (s.duration || 0), 0),
    0,
  );
  const totalFocusMinutes = goals.reduce(
    (acc, g) => acc + (g.totalFocusMinutes || 0),
    0,
  );
  const consistency =
    totalSteps === 0 ? 0 : Math.round((completedSteps / totalSteps) * 100);

  return {
    totalGoals,
    activeGoals,
    completedSteps,
    totalSteps,
    totalMinutes,
    totalFocusMinutes,
    consistency,
    globalStreak,
    bestStreak,
  };
}
