import { getTodayKey } from "./ItineraryUtils";
import { formatYYYYMMDD, parseYYYYMMDD } from "./dateKeyUtils";
import type { Goal } from "./goalTypes";

type StreakStateInput = {
  dailyCompletionMap: Record<string, string[]>;
  goalIds: string[];
  goalsById: Record<string, Goal>;
  bestStreak: number;
};

/**
 * Calcula racha actual y mejor racha usando dailyCompletionMap.
 * Una fecha cuenta solo si todas las metas activas actuales están marcadas.
 */
export const calculateStreaks = (state: StreakStateInput) => {
  const map = state.dailyCompletionMap || {};
  const todayKey = getTodayKey();

  const activeGoals = state.goalIds
    .map((id) => state.goalsById[id])
    .filter(
      (goal): goal is Goal =>
        !!goal &&
        goal.status === "active" &&
        Array.isArray(goal.steps) &&
        goal.steps.length > 0,
    )
    .map((goal) => goal.id);

  if (activeGoals.length === 0) {
    return { globalStreak: 0, bestStreak: 0 };
  }

  const dateHasAllActive = (dateKey: string) => {
    const completed = map[dateKey] ?? [];
    return activeGoals.every((id) => completed.includes(id));
  };

  const todayHasAll = dateHasAllActive(todayKey);
  const cursorStart = parseYYYYMMDD(todayKey);
  if (!todayHasAll) cursorStart.setDate(cursorStart.getDate() - 1);

  let globalStreak = 0;
  let cursor = new Date(cursorStart);

  while (true) {
    const key = formatYYYYMMDD(cursor);
    if (!dateHasAllActive(key)) break;
    globalStreak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  const dateKeys = Object.keys(map).sort();
  let bestRun = 0;
  let run = 0;
  let prevKey: string | null = null;

  for (const key of dateKeys) {
    if (!dateHasAllActive(key)) {
      run = 0;
      prevKey = null;
      continue;
    }

    if (!prevKey) {
      run = 1;
    } else {
      const prev = parseYYYYMMDD(prevKey);
      prev.setDate(prev.getDate() + 1);
      const expected = formatYYYYMMDD(prev);
      run = expected === key ? run + 1 : 1;
    }

    bestRun = Math.max(bestRun, run);
    prevKey = key;
  }

  return {
    globalStreak,
    bestStreak: Math.max(state.bestStreak || 0, bestRun),
  };
};
