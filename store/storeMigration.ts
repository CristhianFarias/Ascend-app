import { DEFAULT_TEMPLATES } from "./goalTemplates";
import { normalizeGoal, normalizeStep } from "./goalNormalizers";
import type { Goal } from "./goalTypes";
import { DEFAULT_SETTINGS, STORE_VERSION } from "./storeDefaults";

/**
 * Migra datos antiguos guardados en AsyncStorage.
 * Mantiene compatibilidad con versiones que guardaban goals como arreglo plano.
 */
export const migratePersistedState = (persistedState: unknown) => {
  const state = (persistedState as any)?.state ?? persistedState;
  if (!state) return persistedState;

  const migrated: any = { ...(state as any) };

  if (
    Array.isArray((state as any).goals) &&
    (!migrated.goalsById || Object.keys(migrated.goalsById).length === 0)
  ) {
    const byId: Record<string, Goal> = {};
    const ids: string[] = [];

    ((state as any).goals as any[]).forEach((rawGoal) => {
      const goal = normalizeGoal(rawGoal);
      byId[goal.id] = goal;
      ids.push(goal.id);
    });

    migrated.goalsById = byId;
    migrated.goalIds = ids;
  }

  if (!Array.isArray(migrated.templates) || migrated.templates.length === 0) {
    migrated.templates = DEFAULT_TEMPLATES;
  }

  if (migrated.goalsById) {
    Object.keys(migrated.goalsById).forEach((id) => {
      const rawGoal = migrated.goalsById[id];
      const goal = normalizeGoal({
        ...rawGoal,
        steps: Array.isArray(rawGoal.steps)
          ? rawGoal.steps.map(normalizeStep)
          : [],
      });
      const template = migrated.templates.find(
        (item: any) => item.id === goal.templateId,
      );

      migrated.goalsById[id] = {
        ...goal,
        frequencyPerWeek:
          typeof rawGoal.frequencyPerWeek === "number"
            ? rawGoal.frequencyPerWeek
            : template?.frequencyPerWeek ?? goal.frequencyPerWeek,
        restStrategy: "auto",
      };
    });
  }

  if (typeof migrated.globalStreak === "undefined") migrated.globalStreak = 0;
  if (typeof migrated.bestStreak === "undefined") migrated.bestStreak = 0;

  // Ajusta campos agregados después de versiones iniciales de la app.
  migrated.settings = migrated.settings ?? DEFAULT_SETTINGS;
  if (!migrated.settings.theme) migrated.settings.theme = "system";
  if (typeof migrated.lastRolloverDate === "undefined") {
    migrated.lastRolloverDate = undefined;
  }

  migrated.storeVersion = STORE_VERSION;
  return migrated;
};
